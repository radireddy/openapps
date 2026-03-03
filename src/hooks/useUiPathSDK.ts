import { useState, useEffect, useRef } from 'react';
import { IntegrationSettings } from '../types';
import { ENABLE_UIPATH_SDK } from '../constants';

/**
 * Custom hook to initialize the UiPath SDK
 * Initializes the SDK once per component mount using integration settings
 */
export const useUiPathSDK = (integrationSettings?: IntegrationSettings) => {
    const [uipath, setUipath] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const initializationAttempted = useRef(false);

    useEffect(() => {
        // Skip initialization if SDK is disabled
        if (!ENABLE_UIPATH_SDK) {
            return;
        }

        // Only initialize once
        if (initializationAttempted.current) {
            return;
        }

        // Check if integration settings are complete
        if (!integrationSettings ||
            !integrationSettings.accountName ||
            !integrationSettings.tenantName ||
            !integrationSettings.clientId ||
            !integrationSettings.scope) {
            setError('Integration settings are incomplete. Please configure all fields in the Integration tab.');
            return;
        }

        const initializeSDK = async () => {
            initializationAttempted.current = true;
            setIsInitializing(true);
            setError(null);

            try {
                // Dynamically import the UiPath SDK only when enabled
                // Using Function constructor to create a truly dynamic import that Vite can't analyze
                // This prevents Vite from trying to resolve the module at build time
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                // @ts-ignore - Module may not exist if SDK package is not installed
                const module = await dynamicImport('@uipath/uipath-typescript');
                const { UiPath } = module;

                const config = {
                    baseUrl: 'https://staging.uipath.com',
                    orgName: integrationSettings.accountName,
                    tenantName: integrationSettings.tenantName,
                    clientId: integrationSettings.clientId,
                    redirectUri: "http://localhost:3000",
                    scope: integrationSettings.scope,
                };

                // Create SDK instance
                const uipathSdk = new UiPath(config);

                // Initialize the OAuth flow
                await uipathSdk.initialize();
                console.log('[UiPath SDK] Initialized successfully');

                setUipath(uipathSdk);
            } catch (err: any) {
                // Handle case where SDK package is not installed or not available
                if (err?.message?.includes('Failed to resolve') || err?.code === 'MODULE_NOT_FOUND') {
                    console.warn('[UiPath SDK] Package not found. SDK functionality disabled.');
                    setError('UiPath SDK package is not installed. Please install @uipath/uipath-typescript to enable SDK features.');
                } else {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to initialize UiPath SDK';
                    console.error('UiPath SDK initialization error:', err);
                    setError(errorMessage);
                }
            } finally {
                setIsInitializing(false);
            }
        };

        initializeSDK();
    }, [integrationSettings]);

    return { uipath, error, isInitializing };
};
