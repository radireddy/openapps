export { generateAppLayout } from './appGenerationService';
export { generateTheme } from './themeGenerationService';
export { generateTemplate } from './templateGenerationService';
export { generateStructuredContent, getApiKey, createAIClient, getModelName } from './geminiClient';

export type AIMode = 'app-create' | 'app-edit' | 'theme' | 'template';
