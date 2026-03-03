// A simple implementation of lodash's get and set for deep property access.

export function get(obj: Record<string, any>, path: string, defaultValue: any = undefined): any {
  if (!path) return defaultValue;

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

export function set(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  if (!path) return obj;

  const pathArray = path.split('.');
  const newObj = { ...obj }; // Shallow copy at the top level
  let current = newObj;

  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
    if (i === pathArray.length - 1) {
      current[key] = value;
    } else {
      // If the next level doesn't exist or is not an object, create it.
      if (current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      // Create a shallow copy of the nested object to avoid direct mutation
      current[key] = { ...current[key] };
      current = current[key];
    }
  }

  return newObj;
}