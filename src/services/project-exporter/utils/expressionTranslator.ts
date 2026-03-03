
import { AppDefinition, AppComponent, AppVariable } from '../../../types';
import { toPascalCase } from './stringUtils';

/**
 * Defines the context in which an expression is being translated.
 * - 'jsx-attr': Inside a JSX attribute (e.g. `width={...}`).
 * - 'raw-js': Inside a JavaScript object or logic block (e.g. `style={{...}}`).
 * - 'jsx-children': As a child of a JSX element (e.g. `<div>{...}</div>`).
 * - 'code-block': Inside an executable code block (e.g. button click handler).
 */
export type ExpressionContext = 'jsx-attr' | 'raw-js' | 'jsx-children' | 'code-block';

const JS_RESERVED_WORDS = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum', 'await', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'arguments', 'eval'
]);

/**
 * Translates a low-code expression (using {{ }}) into valid React/JavaScript code.
 * 
 * It handles:
 * - Converting data store access (e.g. `Input1.value` -> `get(dataStore, 'Input1.value')`).
 * - Handling variable references.
 * - Preserving literals and identifiers.
 * - Transforming `actions.updateVariable` calls in code blocks into `setVariable` hooks.
 * 
 * @param value The value to translate (string expression or literal).
 * @param appDef The application definition (context).
 * @param context The context where the result will be used.
 * @returns A string of valid JavaScript/JSX code.
 */
export const translateExpression = (value: any, appDef: AppDefinition, context: ExpressionContext = 'jsx-attr'): string => {
    const isRaw = context === 'raw-js' || context === 'code-block';
    const allVariables = appDef.variables;
    const allComponents = appDef.components;

    if (value === undefined) {
        return isRaw ? 'undefined' : '{undefined}';
    }

    if (typeof value === 'boolean' || typeof value === 'number' || value === null) {
        return isRaw ? String(value) : `{${String(value)}}`;
    }

    if (typeof value !== 'string') {
        const stringified = JSON.stringify(value);
        return isRaw ? (stringified || 'undefined') : `{${stringified || 'undefined'}}`;
    }

    const varNames = new Set(allVariables.map(v => v.name));
    const componentMap = new Map(allComponents.map(c => [c.id, c]));
    const keywords = new Set([
        'theme', 'console', 'true', 'false', 'null', 'undefined', 
        'get', 'set', 'updateDataStore', 'dataStore', 'actions',
        'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'window', 'alert',
        ...JS_RESERVED_WORDS
    ]);

    const transformExpression = (expr: string): string => {
        // List iteration variables that should use safe get() for property access
        const listIterationVars = new Set(['currentItem', 'item', 'row', 'record', 'index']);
        
        // First, preserve theme property access chains (e.g., theme.colors.onPrimary, theme.radius.default)
        // This must happen before the general property access transformation to prevent theme properties
        // from being incorrectly processed. Theme properties use camelCase and must be preserved exactly.
        // Match: theme.property1.property2... (any depth of nesting)
        let transformed = expr.replace(/\btheme\.([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)/g, (match) => {
            // Preserve the entire theme property access chain as-is
            // This ensures camelCase property names like onPrimary, onSecondary are preserved
            return match;
        });
        
        // First, handle property access patterns like "currentItem.hotelImage" or "item.name"
        // These should be converted to safe access: get(currentItem, 'hotelImage')
        // Pattern: identifier.property (where property is a valid identifier)
        // Handle nested property access like "currentItem.hotelImage" or "item.amenities[0]"
        // IMPORTANT: Don't match method calls (e.g., value.toLowerCase()) - those should be preserved
        // Use a more comprehensive regex that matches property access patterns but NOT method calls
        // This must run BEFORE the tokenizer to prevent currentItem from being converted to get(dataStore, 'currentItem')
        // Match: obj.prop or obj.prop[index] but NOT obj.method( or obj.prop.method(
        // IMPORTANT: Exclude theme property access that was already preserved above
        transformed = transformed.replace(/(?<![\.\w])([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)(\[[^\]]*\])?(?!\s*\()/g, (match, objName, propName, arrayAccess) => {
            // Skip theme property access - it was already preserved above
            if (objName === 'theme') {
                return match;
            }
            
            // Skip if it's component.value (handled separately)
            if (propName === 'value') {
                const component = componentMap.get(objName);
                if (component) {
                    // Component access - translate to get(dataStore, 'componentId')
                    // Since we removed dataStoreKey, components now use their ID as the dataStore key
                    return `get(dataStore, '${objName}')`;
                }
            }
            
            // Special handling for list iteration variables - always use safe get
            if (listIterationVars.has(objName)) {
                const arrayPart = arrayAccess || '';
                // For array access like currentItem.amenities[0], we need to handle it differently
                if (arrayAccess) {
                    // Extract the array index
                    const indexMatch = arrayAccess.match(/\[(.+)\]/);
                    if (indexMatch) {
                        const index = indexMatch[1];
                        // Use get with the full path
                        return `get(${objName}, '${propName}.${index}')`;
                    }
                }
                return `get(${objName}, '${propName}')`;
            }
            
            // Skip if objName is a keyword or known entity (like 'dataStore', 'theme', etc.)
            if (keywords.has(objName) || varNames.has(objName) || componentMap.has(objName)) {
                // For other known entities, preserve direct access (they're safe)
                return match;
            }
            
            // In code-block context, be conservative - don't convert property access for unknown variables
            // Assume they're local variables and preserve direct access
            if (context === 'code-block') {
                return match;
            }
            
            // For unknown objects in non-code-block context, use safe get access
            if (arrayAccess) {
                const indexMatch = arrayAccess.match(/\[(.+)\]/);
                if (indexMatch) {
                    const index = indexMatch[1];
                    return `get(${objName}, '${propName}.${index}')`;
                }
            }
            return `get(${objName}, '${propName}')`;
        });
        
        // Tokenizer regex: 1. Strings, 2. Component.value (already handled above), 3. Identifiers
        const tokenizer = /("(?:\\[\s\S]|[^"])*"|'(?:\\[\s\S]|[^'])*')|(\b[a-zA-Z_]\w*\.value\b)|(?<![\.\w])([a-zA-Z_]\w*)\b/g;

        transformed = transformed.replace(tokenizer, (match, stringLiteral, componentAccess, identifier) => {
            if (stringLiteral) return stringLiteral;

            if (componentAccess) {
                // Component access - return as is
                return componentAccess;
            }

            if (identifier) {
                // List iteration variables should be preserved as-is (they're local variables in map functions)
                const listIterationVars = new Set(['currentItem', 'item', 'row', 'record', 'index']);
                if (listIterationVars.has(identifier)) {
                    return identifier;
                }
                
                // Check if this identifier is part of a property access that was already transformed
                // If the transformed string already contains get(identifier, ...), don't transform it again
                if (keywords.has(identifier) || varNames.has(identifier) || componentMap.has(identifier)) {
                    return identifier;
                }
                
                if (context === 'code-block') {
                    return identifier; // Assume local variable
                }

                // Only convert to dataStore lookup if it's not a list iteration variable
                return `get(dataStore, '${identifier}')`;
            }

            return match;
        });

        if (context === 'code-block') {
            transformed = transformed.replace(/actions\.updateVariable\s*\(\s*(['"])(.*?)\1\s*,\s*/g, (match, quote, varName) => {
                return `set${toPascalCase(varName)}(`;
            });
            
            // Add optional chaining for get() results followed by method calls to handle null/undefined safely
            // Pattern: get(...).method( -> get(...)?.method(
            transformed = transformed.replace(/get\(([^)]+)\)\.([a-zA-Z_]\w*)\s*\(/g, (match, getArgs, methodName) => {
                return `get(${getArgs})?.${methodName}(`;
            });
        }

        // Fix theme property names that may have been incorrectly lowercased
        // This ensures camelCase property names like onPrimary, onSecondary are preserved correctly
        // Pattern: theme.colors.onprimary -> theme.colors.onPrimary
        // Pattern: theme.colors.onsecondary -> theme.colors.onSecondary
        // Pattern: theme.radius.default -> theme.radius.default (already correct, no change)
        // This handles cases where property names were lowercased during expression processing
        // Match theme.property1.onprimary (where 'on' prefix properties need capitalization)
        transformed = transformed.replace(/\btheme\.([a-zA-Z_]\w*)\.on([a-z])([a-zA-Z]*)\b/g, (match, themePath, firstLetter, rest) => {
            // Convert onprimary -> onPrimary, onsecondary -> onSecondary, etc.
            // Capitalize the first letter after 'on' and preserve the rest
            return `theme.${themePath}.on${firstLetter.toUpperCase()}${rest}`;
        });

        return transformed;
    };

    // If we're in a raw JS/code-block context and have a plain string (not a {{}} expression),
    // treat it as code to transform (e.g. actions.updateVariable -> setXyz).
    if (isRaw) {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            const expression = value.substring(2, value.length - 2).trim();
            const finalExpr = transformExpression(expression);
            return isRaw ? finalExpr : `{${finalExpr}}`;
        }

        // Handle template-style strings containing mustache placeholders like "Hello {{ name }}"
        if (value.includes('{{') && value.includes('}}')) {
            const templateLiteral = value.replace(/{{\s*(.*?)\s*}}/g, (_, expression) => `\${${transformExpression(expression)}}`);
            return `\`${templateLiteral}\``;
        }

        // Heuristic: if the value looks like plain text (no code-like chars), return it as a string literal.
        // Check if it's a URL (starts with http:// or https://)
        const isUrl = /^https?:\/\//.test(value);
        if (isUrl) {
            return JSON.stringify(value);
        }
        
        // KEY FIX: If the string contains spaces (multiple words), it's almost certainly plain text
        // unless it contains mustache expressions (which are handled above) or explicit code patterns
        const hasSpaces = /\s/.test(value);
        
        // Additional check: if it's multiple space-separated simple words, it's definitely plain text
        // This catches cases like "Enter hotel name" where each word would be treated as an identifier
        if (hasSpaces) {
            const words = value.trim().split(/\s+/);
            // If all words are simple identifiers (letters, numbers, underscores) and no code patterns,
            // it's definitely plain text
            const allWordsAreSimple = words.every(word => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word));
            const hasNoCodeChars = !/[()\[\]=<>+\-*/%&|?:]/.test(value) && 
                                   !value.includes('actions') && 
                                   !value.includes('updateVariable') &&
                                   !/\b[a-zA-Z_]\w*\.value\b/.test(value);
            
            if (allWordsAreSimple && hasNoCodeChars) {
                return JSON.stringify(value);
            }
        }
        
        // Check for explicit code patterns that indicate this is actual code, not plain text
        // Note: We check for component.value patterns, operators, and action keywords
        const hasComponentValuePattern = /\b[a-zA-Z_]\w*\.value\b/.test(value);
        const hasOperators = /[()\[\]=<>+\-*/%&|?:]/.test(value);
        const hasActionKeywords = value.includes('actions') || value.includes('updateVariable');
        const hasExplicitCodePatterns = hasOperators || hasActionKeywords || hasComponentValuePattern;
        
        // If it has spaces and no explicit code patterns, it's definitely plain text
        // This prevents strings like "Enter hotel name" from being treated as code
        if (hasSpaces && !hasExplicitCodePatterns) {
            return JSON.stringify(value);
        }
        
        // For strings without spaces, we need to be more careful
        // They could be:
        // 1. Plain text: "Hello"
        // 2. Component.value: "Input1.value" 
        // 3. Property path: "user.name"
        // 4. Single identifier that might be a dataStore key
        
        if (!hasSpaces) {
            // If it matches component.value pattern, it's code
            if (hasComponentValuePattern) {
                return transformExpression(value);
            }
            
            // If it has a dot and looks like property access, it might be code
            if (value.includes('.')) {
                // Check if it looks like a valid property path (e.g., "user.name", "data.value")
                const looksLikePropertyPath = /^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)+$/.test(value);
                if (looksLikePropertyPath) {
                    return transformExpression(value);
                }
            }
            
            // If it's a single identifier, check if it's a known keyword/variable/component
            const isSingleIdentifier = /^[a-zA-Z_]\w*$/.test(value);
            if (isSingleIdentifier) {
                // If it's a known entity, it's code
                if (keywords.has(value) || varNames.has(value) || componentMap.has(value)) {
                    return value; // Return as-is, it's a valid identifier
                }
                // Otherwise, it could be a dataStore key, but to be safe for placeholders,
                // treat single words without context as strings
                return JSON.stringify(value);
            }
            
            // If it has operators or action keywords, it's code
            if (hasExplicitCodePatterns) {
                return transformExpression(value);
            }
            
            // Default: treat as string if we're not sure
            return JSON.stringify(value);
        }
        
        // If we get here with spaces and explicit code patterns, transform it
        // (though this case should be rare - template literals are handled above)
        return transformExpression(value);
    }

    if (value.startsWith('{{') && value.endsWith('}}')) {
        const expression = value.substring(2, value.length - 2).trim();
        const finalExpr = transformExpression(expression);
        return isRaw ? finalExpr : `{${finalExpr}}`;
    }

    if (value.includes('{{') && value.includes('}}')) {
        const templateLiteral = value.replace(/{{\s*(.*?)\s*}}/g, (_, expression) => `\${${transformExpression(expression)}}`);
        return isRaw ? `\`${templateLiteral}\`` : `{\`${templateLiteral}\`}`;
    }

    // Check if it's a URL (starts with http:// or https://) - always quote URLs
    const isUrl = /^https?:\/\//.test(value);
    if (isUrl) {
        return isRaw ? JSON.stringify(value) : `"${value}"`;
    }
    
    if (context === 'jsx-attr') return `"${value}"`;
    if (isRaw) return JSON.stringify(value);
    return value;
};
