/**
 * Generates the UiPath SDK service file that handles SDK initialization.
 */
export const generateUiPathService = (): string => `
import { UiPath } from '@uipath/uipath-typescript';

// SDK Configuration from environment variables
const getConfig = () => ({
  baseUrl: import.meta.env.VITE_UIPATH_BASE_URL || 'https://staging.uipath.com',
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME || '',
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || '',
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI || 'http://localhost:5173',
  scope: import.meta.env.VITE_UIPATH_SCOPE || '',
});

// Validate required configuration
const validateConfig = (config: ReturnType<typeof getConfig>): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!config.baseUrl || config.baseUrl.trim() === '') missing.push('VITE_UIPATH_BASE_URL');
  if (!config.orgName || config.orgName.trim() === '') missing.push('VITE_UIPATH_ORG_NAME');
  if (!config.tenantName || config.tenantName.trim() === '') missing.push('VITE_UIPATH_TENANT_NAME');
  if (!config.clientId || config.clientId.trim() === '') missing.push('VITE_UIPATH_CLIENT_ID');
  if (!config.scope || config.scope.trim() === '') missing.push('VITE_UIPATH_SCOPE');
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Lazy SDK instance - only created when needed and config is valid
let uipathSdkInstance: UiPath | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Get the UiPath SDK instance. Returns null if configuration is invalid.
 * The SDK instance is created lazily on first access with valid configuration.
 */
export const getUiPathSdk = (): UiPath | null => {
  // If already created, return it
  if (uipathSdkInstance) {
    return uipathSdkInstance;
  }

  // Get and validate config
  const config = getConfig();
  const validation = validateConfig(config);

  if (!validation.isValid) {
    console.warn(
      '[UiPath SDK] Incomplete configuration. SDK will be disabled until all required values are set in .env:',
      validation.missing.join(', ')
    );
    return null;
  }

  // Create SDK instance only when config is valid
  try {
    uipathSdkInstance = new UiPath(config);
    return uipathSdkInstance;
  } catch (error) {
    console.error('[UiPath SDK] Failed to create SDK instance:', error);
    return null;
  }
};

// Export uipathSdk for backward compatibility (lazy getter)
// Accessing this will safely return the SDK instance or null if config is invalid
export const uipathSdk = getUiPathSdk();

/**
 * Initialize the UiPath SDK with OAuth flow.
 * This function ensures the SDK is only initialized once.
 */
export const initializeSdk = async (): Promise<void> => {
  // Get SDK instance (will validate config and create if needed)
  const sdk = getUiPathSdk();
  
  // If configuration is incomplete, skip initialization
  if (!sdk) {
    console.warn('[UiPath SDK] Initialization skipped because configuration is incomplete.');
    return;
  }

  // If already initialized, return immediately
  if (isInitialized) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      await sdk.initialize();
      isInitialized = true;
      console.log('UiPath SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UiPath SDK:', error);
      initializationPromise = null; // Allow retry on failure
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Check if the SDK is initialized.
 */
export const isSdkInitialized = (): boolean => {
  return isInitialized;
};
`;
