import { AppDefinition, AppVariable } from '../../types';

/**
 * Parse initial value for a variable based on its type.
 * Handles string parsing, JSON parsing, and type coercion with safe fallbacks.
 */
export function parseInitialValue(value: any, type: AppVariable['type']): any {
  try {
    switch (type) {
      case 'string':
        return String(value ?? '');
      case 'number':
        return Number(value ?? 0);
      case 'boolean':
        return value === 'true' || value === true || value === 'True';
      case 'object':
        // If already an object, return it
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return value;
        }
        // If it's a string, try to parse it
        if (typeof value === 'string') {
          // Handle empty string
          const trimmed = value.trim();
          if (!trimmed) return {};
          // Try to parse the JSON string
          try {
            return JSON.parse(trimmed);
          } catch (parseError) {
            // If parsing fails, try to extract JSON from the string
            // This handles cases where there might be extra content
            const jsonMatch = trimmed.match(/^[\s\n]*(\[[\s\S]*\]|{[\s\S]*})[\s\n]*/);
            if (jsonMatch && jsonMatch[1]) {
              return JSON.parse(jsonMatch[1]);
            }
            throw parseError;
          }
        }
        // Default to empty object
        return {};
      case 'array':
      case 'array_of_objects':
        // If already an array, return it
        if (Array.isArray(value)) {
          // For array_of_objects, validate that all items are objects
          if (type === 'array_of_objects') {
            if (!value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
              console.warn('Array contains non-object items, returning empty array');
              return [];
            }
          }
          return value;
        }
        // If it's a string, try to parse it
        if (typeof value === 'string') {
          // Handle empty string
          const trimmed = value.trim();
          if (!trimmed) return [];
          // Try to parse the JSON string directly first
          try {
            const parsed = JSON.parse(trimmed);
            // For array_of_objects, validate that it's an array of objects
            if (type === 'array_of_objects') {
              if (!Array.isArray(parsed)) {
                console.warn('Value is not an array, returning empty array');
                return [];
              }
              if (!parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                console.warn('Array contains non-object items, returning empty array');
                return [];
              }
            }
            return parsed;
          } catch (parseError) {
            // If parsing fails, try to extract JSON array from the string
            // This handles cases where there might be extra content, semicolons, or formatting
            // Look for array pattern: [ ... ] and extract just that part
            // Match from first [ to matching ] (handles nested arrays/objects)
            let bracketCount = 0;
            let startIndex = -1;
            let endIndex = -1;

            for (let i = 0; i < trimmed.length; i++) {
              if (trimmed[i] === '[') {
                if (startIndex === -1) startIndex = i;
                bracketCount++;
              } else if (trimmed[i] === ']') {
                bracketCount--;
                if (bracketCount === 0 && startIndex !== -1) {
                  endIndex = i;
                  break;
                }
              }
            }

            if (startIndex !== -1 && endIndex !== -1) {
              const jsonString = trimmed.substring(startIndex, endIndex + 1);
              try {
                const parsed = JSON.parse(jsonString);
                // For array_of_objects, validate that it's an array of objects
                if (type === 'array_of_objects') {
                  if (!Array.isArray(parsed)) {
                    console.warn('Value is not an array, returning empty array');
                    return [];
                  }
                  if (!parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                    console.warn('Array contains non-object items, returning empty array');
                    return [];
                  }
                }
                return parsed;
              } catch (e) {
                // If extracted part still fails, throw original error
                throw parseError;
              }
            }

            // If no array pattern found, throw the original error
            throw parseError;
          }
        }
        // Default to empty array
        return [];
      default:
        return value;
    }
  } catch (e) {
    console.error("Invalid initial value for variable:", e, "Value:", value, "Type:", type);
    // Return safe defaults based on type
    switch (type) {
      case 'object': return {};
      case 'array':
      case 'array_of_objects': return [];
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      default: return value;
    }
  }
}

/** Add a variable to app definition. Returns null if a variable with the same name already exists. */
export function addVariableToState(state: AppDefinition, variable: AppVariable): AppDefinition | null {
  const variables = state.variables || [];
  if (variables.some(v => v.name === variable.name)) return null; // duplicate
  return { ...state, variables: [...variables, variable] };
}

/** Update a variable in app definition */
export function updateVariableInState(state: AppDefinition, variableId: string, updates: Partial<AppVariable>): AppDefinition {
  return {
    ...state,
    variables: (state.variables || []).map(v => v.id === variableId ? { ...v, ...updates } : v)
  };
}

/** Delete a variable from app definition */
export function deleteVariableFromState(state: AppDefinition, variableId: string): AppDefinition {
  return {
    ...state,
    variables: (state.variables || []).filter(v => v.id !== variableId)
  };
}

/** Initialize variable state from app definition variables */
export function initializeVariableState(variables: AppVariable[]): Record<string, any> {
  const state: Record<string, any> = {};
  variables.forEach(v => {
    state[v.name] = parseInitialValue(v.initialValue, v.type);
  });
  return state;
}
