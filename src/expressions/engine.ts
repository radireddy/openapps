
// A simple, safe expression evaluation engine with LRU caching.

/**
 * LRU cache for compiled Function objects.
 * Avoids re-compiling the same expression strings into `new Function()` on every render.
 * With 30 components x 15 expressible properties, this reduces ~450 compilations
 * per render cycle to ~30 unique compilations (cache hits for the rest).
 */
const CACHE_MAX_SIZE = 500;
const compiledFunctionCache = new Map<string, Function>();

/**
 * Returns a cached compiled Function for the given function body,
 * or compiles and caches a new one.
 */
function getOrCompileFunction(funcBody: string): Function {
  const cached = compiledFunctionCache.get(funcBody);
  if (cached) {
    // Move to end (most-recently-used) by re-inserting
    compiledFunctionCache.delete(funcBody);
    compiledFunctionCache.set(funcBody, cached);
    return cached;
  }

  // Compile new function
  const func = new Function('scope', funcBody);

  // Evict oldest entry if at capacity
  if (compiledFunctionCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = compiledFunctionCache.keys().next().value;
    if (oldestKey !== undefined) {
      compiledFunctionCache.delete(oldestKey);
    }
  }

  compiledFunctionCache.set(funcBody, func);
  return func;
}

/**
 * Clears the compiled function cache.
 * Useful for testing or when the expression security model changes.
 */
export function clearExpressionCache(): void {
  compiledFunctionCache.clear();
}

/**
 * Returns the current size of the expression cache (for diagnostics/testing).
 */
export function getExpressionCacheSize(): number {
  return compiledFunctionCache.size;
}

/**
 * Checks whether the expression contains semicolons at the top level
 * (i.e., not nested inside braces, parentheses, brackets, or strings).
 * This correctly distinguishes multi-statement code like `a(); b()` from
 * IIFEs like `(() => { return 'x'; })()` where semicolons are inside a function body.
 *
 * O(n) single-pass scanner — strictly better than the previous regex approach.
 */
export function hasTopLevelSemicolons(expression: string): boolean {
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;

  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i];
    const prev = i > 0 ? expression[i - 1] : '';

    // Handle escape sequences inside strings
    if ((inSingleQuote || inDoubleQuote || inTemplateLiteral) && ch === '\\') {
      i++; // skip the escaped character
      continue;
    }

    // Toggle string context
    if (ch === "'" && !inDoubleQuote && !inTemplateLiteral) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (ch === '"' && !inSingleQuote && !inTemplateLiteral) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inTemplateLiteral = !inTemplateLiteral;
      continue;
    }

    // Skip anything inside strings
    if (inSingleQuote || inDoubleQuote || inTemplateLiteral) {
      continue;
    }

    // Track nesting depth
    if (ch === '{') { braceDepth++; continue; }
    if (ch === '}') { braceDepth = Math.max(0, braceDepth - 1); continue; }
    if (ch === '(') { parenDepth++; continue; }
    if (ch === ')') { parenDepth = Math.max(0, parenDepth - 1); continue; }
    if (ch === '[') { bracketDepth++; continue; }
    if (ch === ']') { bracketDepth = Math.max(0, bracketDepth - 1); continue; }

    // Semicolon at top level = multi-statement
    if (ch === ';' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Safely evaluates a JavaScript expression within a given scope.
 * It uses the Function constructor with a `with` block to create a sandboxed function,
 * preventing access to global scope (like `window` or `document`) while
 * making all properties of the scope object available as local variables.
 *
 * Compiled functions are cached in an LRU cache to avoid re-compilation
 * on every render cycle.
 *
 * @param expression - The string expression to evaluate (e.g., "a + b.value").
 * @param scope - An object where keys are variable names available to the expression.
 * @returns The result of the expression. Returns undefined if syntax is invalid.
 *
 * @example
 * const scope = { a: 10, b: 5 };
 * const result = safeEval("a + b", scope); // Returns 15
 */
export function safeEval(expression: string, scope: Record<string, any>): any {
  // 1. Sanitize the expression. If it's empty or just whitespace, don't even try.
  const trimmedExpression = expression.trim();
  if (!trimmedExpression) {
    return undefined;
  }

  // 2. Disallow access to global objects and assignments to prevent escaping the sandbox.
  const forbiddenGlobals = /(^|[^.\w])(?:window|document|globalThis|process|require|Function)\b/;
  if (forbiddenGlobals.test(trimmedExpression)) {
    throw new Error('Access to global objects is prohibited');
  }
  // Disallow top-level assignments like `myGlobal = 10` which would create globals.
  // Use negative lookahead (?!=) to exclude ==, ===, =>, and other comparison operators.
  const assignmentPattern = /^\s*[a-zA-Z_]\w*\s*=(?![=>])/;
  if (assignmentPattern.test(trimmedExpression)) {
    // Likely a partial assignment while typing (e.g. "a ="),
    // return undefined instead of throwing so the UI/tests can handle
    // in-progress typing without failing.
    return undefined;
  }

  // 3. Use a `with` block to provide the scope to the expression. We keep this but
  // guard above prevents dangerous access patterns.
  // Detect multi-statement code (contains semicolons outside strings).
  // Multi-statement code is executed for side effects, not return value,
  // so we must NOT prefix with `return` or only the first statement runs.
  const hasMultipleStatements = hasTopLevelSemicolons(trimmedExpression);
  const funcBody = hasMultipleStatements
    ? `with(scope) { ${trimmedExpression} }`
    : `with(scope) { return ${trimmedExpression} }`;

  try {
    // 3. Get cached function or compile and cache a new one.
    const func = getOrCompileFunction(funcBody);
    return func(scope);
  } catch (error) {
    // 4. Handle errors gracefully, especially those that happen during user typing.

    // A. Check for ReferenceError (e.g., "monthlyEMI is not defined").
    // ReferenceErrors are normal and expected: variables not yet initialized,
    // edit mode where runtime values aren't populated, user typing expressions.
    // Handle silently — never spam console.error for these.
    if (error instanceof ReferenceError) {
        const isSimpleIdentifier = /^[a-zA-Z_]\w*$/.test(trimmedExpression);
        const isKeyword = ['true', 'false', 'null', 'undefined', 'console'].includes(trimmedExpression);
        if (isSimpleIdentifier && !isKeyword) {
            // It's a single word that's not defined, likely being typed. Return as a string.
            return trimmedExpression;
        }
        // Compound expression with undefined variable — return undefined silently.
        // This is normal in edit mode or before variables are initialized.
        return undefined;
    }

    // B. Check for SyntaxError (e.g., "name !=") for incomplete expressions.
    // We can suppress the console log for these to avoid spamming during typing.
    const isPartialSyntax = /[!=<>&|?.,]$/.test(trimmedExpression);
    if (error instanceof SyntaxError && isPartialSyntax) {
        // It's an incomplete expression. Return undefined and don't log the error.
        return undefined;
    }

    // C. For all other "real" errors, log them so the developer knows something is wrong, but don't crash.
    console.error(`[Expression Error] Error evaluating expression "${trimmedExpression}":`, error);
    console.error('[Expression Error] Error details:', {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.error('[Expression Error] Available scope keys:', Object.keys(scope).sort());
    // Don't throw - log the error but allow execution to continue
  }
}


/**
 * Parses a string to find top-level variable dependencies.
 * This is a simple implementation and may not cover all edge cases.
 * It looks for patterns like `variable.property` or just `variable`.
 * @param expression - The expression string (e.g., "Input1.value > 10").
 * @returns An array of dependency keys (e.g., ["Input1"]).
 */
export function parseDependencies(expression: string): string[] {
  const dependencies = new Set<string>();
  // Regex to find variable-like patterns, avoids strings and numbers.
  const regex = /[a-zA-Z_]\w*(?=\s*(\.|\(|\)|\[|\]|\=\=|\!\=|\>|\<|\>\=|\<\=|\&\&|\|\||\?|\:|\+|\-|\*|\/|$))/g;

  const matches = expression.match(regex);
  if (matches) {
    matches.forEach(match => {
      // Avoid language keywords and literals
      if (!['true', 'false', 'null', 'undefined', 'console', 'return', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'function', '=>'].includes(match)) {
        dependencies.add(match.split('.')[0]); // Only care about the root object
      }
    });
  }
  return Array.from(dependencies);
}
