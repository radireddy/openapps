
import { AppDefinition, AppComponent, ComponentType, ButtonProps } from '../../../types';
import { toPascalCase, sanitizeName } from '../utils/stringUtils';
import { translateExpression } from '../utils/expressionTranslator';
import { ComponentGeneratorFactory } from './component/ComponentGeneratorFactory';

/**
 * Generates the full React component file content for a single Page.
 * 
 * This function constructs the entire file, including:
 * - Imports.
 * - Helper functions (like a safe `get` utility).
 * - The React component definition.
 * - Event handler functions for interactive components (buttons).
 * - The JSX tree structure.
 * 
 * @param page The page object from the app definition.
 * @param components The list of components belonging to this page.
 * @param appDef The complete application definition (for context).
 * @returns A string containing the complete `.tsx` file content.
 */
export const generatePageTsx = (page: any, components: AppComponent[], appDef: AppDefinition): string => {
  const rootComponents = components.filter(c => !c.parentId);
  const pageName = toPascalCase(sanitizeName(page.name));

  // Generate event handlers for buttons
  const buttonClickHandlers = components
    .filter(c => c.type === ComponentType.BUTTON)
    .map(c => {
      const btnProps = c.props as ButtonProps;
      const handlerName = `handle${toPascalCase(c.id)}Click`;
      let handlerBody = '';

      switch (btnProps.actionType) {
        case 'alert':
          handlerBody = `alert(${translateExpression(btnProps.actionAlertMessage, appDef, 'raw-js')})`;
          break;
        case 'updateVariable':
          if (btnProps.actionVariableName) {
            const setterName = `set${toPascalCase(btnProps.actionVariableName)}`;
            const valueExpr = translateExpression(btnProps.actionVariableValue, appDef, 'raw-js') || 'undefined';
            if (valueExpr.includes(btnProps.actionVariableName)) {
              handlerBody = `${setterName}((${btnProps.actionVariableName}) => ${valueExpr})`;
            } else {
              handlerBody = `${setterName}(${valueExpr})`;
            }
          }
          break;
        case 'executeCode':
          if (btnProps.actionCodeToExecute) {
            handlerBody = translateExpression(btnProps.actionCodeToExecute, appDef, 'code-block');
          }
          break;
      }
      return `const ${handlerName} = () => { ${handlerBody} };`;
    }).join('\n');

  const jsxContent = rootComponents
    .map(c => ComponentGeneratorFactory.create(c.type).generate(c, components, appDef))
    .join('\n');

  return `
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { marked } from 'marked';

// A safe 'get' utility for deep data access.
function get(obj: any, path: string, defaultValue: any = undefined): any {
  if (!path || typeof path !== 'string') return defaultValue;
  const pathArray = path.split('.');
  let current = obj;
  for (let i = 0; i < pathArray.length; i++) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[pathArray[i]];
  }
  return current === undefined ? defaultValue : current;
}

// Safe expression evaluation (similar to safeEval but simpler for exported app)
function safeEvalExpression(expression: string, scope: Record<string, any>): any {
  try {
    // Disallow dangerous patterns
    if (/window|document|globalThis|process|require|Function|eval/.test(expression)) {
      return undefined;
    }
    
    // Use Function constructor with scope keys as parameters for safer evaluation
    const scopeKeys = Object.keys(scope);
    const scopeValues = scopeKeys.map(key => scope[key]);
    const func = new Function(...scopeKeys, \`return \${expression}\`);
    return func(...scopeValues);
  } catch (error) {
    return undefined;
  }
}

// Markdown renderer - evaluates expressions first, then parses as markdown
function renderMarkdown(value: any, scope: Record<string, any>): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  // First, evaluate any JavaScript expressions in the string
  let processedValue = value;
  
  // Handle pure expression like "{{ expression }}"
  if (value.startsWith('{{') && value.endsWith('}}')) {
    const expression = value.substring(2, value.length - 2).trim();
    if (expression) {
      const result = safeEvalExpression(expression, scope);
      processedValue = result !== undefined && result !== null ? String(result) : '';
    } else {
      processedValue = '';
    }
  } else if (value.includes('{{') && value.includes('}}')) {
    // Template literal like "Hello {{ name }}"
    processedValue = value.replace(/{{\\s*(.*?)\\s*}}/g, (match, expr) => {
      const result = safeEvalExpression(expr.trim(), scope);
      return result !== undefined && result !== null ? String(result) : '';
    });
  }
  
  // Configure marked for safety and convenience
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  
  try {
    return marked.parse(processedValue) as string;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return processedValue;
  }
}

type ${pageName}Props = {
    theme: any;
    dataStore: any;
    updateDataStore: (key: string, value: any) => void;
    uipath: any;${appDef.variables.length > 0 ? '\n    ' + appDef.variables.map(v => `${v.name}: any;`).join('\n    ') + '\n    ' + appDef.variables.map(v => `set${toPascalCase(v.name)}: React.Dispatch<React.SetStateAction<any>>;`).join('\n    ') : ''}
};

export const ${pageName}: React.FC<${pageName}Props> = ({ theme, dataStore, updateDataStore, uipath${appDef.variables.length > 0 ? ', ' + appDef.variables.map(v => v.name).join(', ') + ', ' + appDef.variables.map(v => `set${toPascalCase(v.name)}`).join(', ') : ''} }) => {
    
    ${buttonClickHandlers}

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100vh',
                backgroundColor: theme.colors.background,
                gap: '8px',
                padding: '16px',
            }}
        >
            ${jsxContent}
        </div>
    );
};
`;
};
