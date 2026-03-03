
import JSZip from 'jszip';
import { AppDefinition } from '../../types';
import {
    generatePackageJson,
    generateViteConfig,
    generateTsConfig,
    generateTsConfigNode,
    generateTailwindConfig,
    generatePostCssConfig,
    generateIndexHtml,
    generateMainTsx,
    generateIndexCss,
    generateViteEnvDts,
    generateEnvFile
} from './generators/ConfigFilesGenerator';
import { generateAppTsx } from './generators/AppGenerator';
import { generatePageTsx } from './generators/PageGenerator';
import { generateUiPathService } from './generators/ServiceGenerator';
import { toPascalCase, sanitizeName } from './utils/stringUtils';
import { generateResponsiveCss } from './generators/ResponsiveCSSGenerator';

/**
 * Exports the current application definition as a downloadable React project zip file.
 * 
 * This function orchestrates the generation of a modern Vite + React + Tailwind project.
 * It creates:
 * - Configuration files (package.json, tsconfig, vite.config, etc.)
 * - Source code (App.tsx, main.tsx, pages components)
 * - CSS styles
 * 
 * @param appDefinition - The complete application state to export.
 * @returns A Promise that resolves when the download has been triggered in the browser.
 */
export async function exportToReactProject(appDefinition: AppDefinition): Promise<void> {
    const zip = new JSZip();
    const sanitizedAppName = appDefinition.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // --- Add configuration files ---
    zip.file('package.json', generatePackageJson(appDefinition.name));
    zip.file('vite.config.ts', generateViteConfig());
    zip.file('tsconfig.json', generateTsConfig());
    zip.file('tsconfig.node.json', generateTsConfigNode());
    zip.file('tailwind.config.js', generateTailwindConfig());
    zip.file('postcss.config.js', generatePostCssConfig());
    zip.file('index.html', generateIndexHtml(appDefinition.name));
    zip.file('.env', generateEnvFile(appDefinition.integration));

    // --- Add src folder and files ---
    const src = zip.folder('src')!;
    src.file('main.tsx', generateMainTsx());
    src.file('index.css', generateIndexCss());
    src.file('responsive.css', generateResponsiveCss(appDefinition.components));
    src.file('App.tsx', generateAppTsx(appDefinition));
    src.file('vite-env.d.ts', generateViteEnvDts());

    // --- Add services folder ---
    const servicesFolder = src.folder('services')!;
    servicesFolder.file('uipathService.ts', generateUiPathService());

    const pagesFolder = src.folder('pages')!;
    for (const page of appDefinition.pages) {
        const pageComponents = appDefinition.components.filter(c => c.pageId === page.id);
        const pageFileName = `${toPascalCase(sanitizeName(page.name))}.tsx`;
        pagesFolder.file(pageFileName, generatePageTsx(page, pageComponents, appDefinition));
    }

    // --- Generate and Download Zip ---
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedAppName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
