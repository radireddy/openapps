
/**
 * Generates a `package.json` file tailored for a Vite + React + TypeScript + Tailwind project.
 * @param appName The name of the application.
 */
export const generatePackageJson = (appName: string): string => {
  const sanitizedAppName = appName.toLowerCase().replace(/\s+/g, '-');
  return JSON.stringify({
    "name": sanitizedAppName,
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "marked": "^11.1.1",
      "@uipath/uipath-typescript": "^1.0.0-beta.16"
    },
    "devDependencies": {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      "autoprefixer": "^10.4.15",
      "postcss": "^8.4.29",
      "tailwindcss": "^3.3.3",
      "typescript": "^5.0.2",
      "vite": "^4.4.5",
      "@types/marked": "^6.0.0"
    }
  }, null, 2);
};

/**
 * Generates the `vite.config.ts` file.
 */
export const generateViteConfig = (): string => `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`;

/**
 * Generates the `tsconfig.json` file with robust compiler options for React/Vite.
 */
export const generateTsConfig = (): string => JSON.stringify({
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}, null, 2);

/**
 * Generates the `tsconfig.node.json` file for Vite config type checking.
 */
export const generateTsConfigNode = (): string => JSON.stringify({
  "compilerOptions": { "composite": true, "skipLibCheck": true, "module": "ESNext", "moduleResolution": "bundler", "allowSyntheticDefaultImports": true },
  "include": ["vite.config.ts"]
}, null, 2);

/**
 * Generates `vite-env.d.ts` to ensure TypeScript understands Vite client types.
 */
export const generateViteEnvDts = (): string => `/// <reference types="vite/client" />
`;

/**
 * Generates the `tailwind.config.js` file.
 */
export const generateTailwindConfig = (): string => `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

/**
 * Generates the `postcss.config.js` file required by Tailwind.
 */
export const generatePostCssConfig = (): string => `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

/**
 * Generates the `index.html` entry point.
 */
export const generateIndexHtml = (appName: string): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

/**
 * Generates the `src/main.tsx` entry point which mounts the React app.
 */
export const generateMainTsx = (): string => `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

/**
 * Generates the `src/index.css` file with Tailwind directives and full-height styles.
 */
export const generateIndexCss = (): string => `
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './responsive.css';

/* Responsive base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100dvh;
}

img, video {
  max-width: 100%;
  height: auto;
}

#root {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
`;

/**
 * Generates the `.env` file with integration configuration.
 */
export const generateEnvFile = (integrationSettings?: { accountName: string; tenantName: string; clientId: string; scope: string }): string => {
  if (!integrationSettings) {
    return `# UiPath Integration Configuration
# Configure these values to enable UiPath SDK integration

VITE_UIPATH_BASE_URL=https://staging.uipath.com
VITE_UIPATH_ORG_NAME=
VITE_UIPATH_TENANT_NAME=
VITE_UIPATH_CLIENT_ID=
VITE_UIPATH_REDIRECT_URI=http://localhost:5173
VITE_UIPATH_SCOPE=
`;
  }

  return `# UiPath Integration Configuration
VITE_UIPATH_BASE_URL=https://staging.uipath.com
VITE_UIPATH_ORG_NAME=${integrationSettings.accountName || ''}
VITE_UIPATH_TENANT_NAME=${integrationSettings.tenantName || ''}
VITE_UIPATH_CLIENT_ID=${integrationSettings.clientId || ''}
VITE_UIPATH_REDIRECT_URI=http://localhost:5173
VITE_UIPATH_SCOPE=${integrationSettings.scope || ''}
`;
};

