
import { AppDefinition, AppVariable, AppVariableType } from '../../../types';
import { toPascalCase, sanitizeName } from '../utils/stringUtils';

const generateInitialValue = (variable: AppVariable): string => {
    const { initialValue, type } = variable;
    try {
        switch (type) {
            case AppVariableType.STRING:
                return JSON.stringify(String(initialValue ?? ''));
            case AppVariableType.NUMBER:
                const num = Number(initialValue);
                return isNaN(num) ? '0' : String(num);
            case AppVariableType.BOOLEAN:
                return String(initialValue === 'true' || initialValue === true);
            case AppVariableType.OBJECT:
            case AppVariableType.ARRAY:
            case AppVariableType.ARRAY_OF_OBJECTS:
                if (typeof initialValue === 'object' && initialValue !== null) {
                    return JSON.stringify(initialValue);
                }
                if (typeof initialValue === 'string' && initialValue.trim()) {
                    JSON.parse(initialValue); // Validate JSON
                    return initialValue;
                }
                return type === AppVariableType.OBJECT ? '{}' : '[]';
            default:
                return JSON.stringify(initialValue);
        }
    } catch {
        return type === AppVariableType.OBJECT ? '{}' : (type === AppVariableType.ARRAY || type === AppVariableType.ARRAY_OF_OBJECTS ? '[]' : '""');
    }
};

/**
 * Generates the main `App.tsx` file content.
 * 
 * This file serves as the root of the exported application. It:
 * - Initializes the global `dataStore`.
 * - Initializes all app variables as React state (`useState`).
 * - Renders the main page component.
 * - Passes all state and setters down to the page as props.
 * 
 * @param appDef The application definition.
 * @returns The complete content of App.tsx.
 */
export const generateAppTsx = (appDef: AppDefinition): string => {
    const mainPage = appDef.pages.find(p => p.id === appDef.mainPageId)!;
    const mainPageComponent = toPascalCase(sanitizeName(mainPage.name));

    return `
import { useState, useEffect } from 'react';
import { ${toPascalCase(sanitizeName(mainPage.name))} } from './pages/${toPascalCase(sanitizeName(mainPage.name))}';
import { initializeSdk, getUiPathSdk } from './services/uipathService';
// TODO: Import other pages here for routing

// A safe 'set' utility for deep, immutable state updates.
function set(obj: any, path: string, value: any): any {
  if (!path || typeof path !== 'string') return obj;
  const pathArray = path.split('.');
  const newObj = { ...obj };
  let current: any = newObj;
  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
    if (i === pathArray.length - 1) {
      current[key] = value;
    } else {
      // Ensure the next level is an object, creating it if necessary.
      const next = current[key];
      current[key] = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? { ...next } : {};
      current = current[key];
    }
  }
  return newObj;
}

function App() {
    const theme = ${JSON.stringify(appDef.theme, null, 2)};
    const [dataStore, setDataStore] = useState(${JSON.stringify(appDef.dataStore, null, 2)});
    ${appDef.variables.map(v => `const [${v.name}, set${toPascalCase(v.name)}] = useState(${generateInitialValue(v)});`).join('\n    ')}

    // Initialize UiPath SDK on app load
    useEffect(() => {
        initializeSdk().catch(error => {
            console.error('SDK initialization failed:', error);
        });
    }, []);

    const updateDataStore = (key: string, value: any) => {
        setDataStore(prev => set(prev, key, value));
    };

    // Get UiPath SDK instance (will be null if config is invalid)
    const uipathSdk = getUiPathSdk();
    
    const pageProps = {
        theme,
        dataStore,
        updateDataStore,
        uipath: uipathSdk${appDef.variables.length > 0 ? ',\n        ' + appDef.variables.map(v => v.name).join(',\n        ') + ',\n        ' + appDef.variables.map(v => `set${toPascalCase(v.name)}`).join(',\n        ') : ''}
    };
    
    return (
        <main className="w-screen h-screen overflow-auto" style={{ backgroundColor: theme.colors.background }}>
            <${mainPageComponent}
                theme={theme}
                dataStore={dataStore}
                updateDataStore={updateDataStore}
                uipath={uipathSdk}${appDef.variables.length > 0 ? '\n                ' + appDef.variables.map(v => `${v.name}={${v.name}}`).join('\n                ') + '\n                ' + appDef.variables.map(v => `set${toPascalCase(v.name)}={set${toPascalCase(v.name)}}`).join('\n                ') : ''}
            />
        </main>
    );
}

export default App;
`;
};
