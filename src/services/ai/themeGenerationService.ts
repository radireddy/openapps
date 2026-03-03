import { GlobalTheme, Theme } from '@/types';
import { generateStructuredContent } from './geminiClient';
import { themeSchema } from './schemas';
import { getThemeGenerationInstruction } from './systemInstructions';
import { defaultLightTheme, defaultDarkTheme } from '@/theme-presets';

/**
 * Generates a complete application theme from a natural language description.
 * The AI only generates colors + font family; everything else uses preset defaults.
 */
export async function generateTheme(prompt: string): Promise<GlobalTheme> {
  const systemInstruction = getThemeGenerationInstruction();

  const result = await generateStructuredContent({
    systemInstruction,
    prompt,
    responseSchema: themeSchema,
  });

  console.log('[ThemeGen] AI raw response keys:', Object.keys(result));
  console.log('[ThemeGen] AI colors keys:', result.colors ? Object.keys(result.colors) : 'MISSING');
  console.log('[ThemeGen] AI type:', result.type, '| name:', result.name);

  // Pick the appropriate base theme for defaults (typography, spacing, shadows, etc.)
  const isDark = result.type === 'dark';
  const baseTheme = isDark ? defaultDarkTheme : defaultLightTheme;

  // AI generates colors; merge with base to cover any gaps
  const aiColors = result.colors || {};
  const colors = { ...baseTheme.colors, ...aiColors };

  // AI generates font family; use for both body and heading
  const fontFamily = result.fontFamily || baseTheme.font.family;

  // Build the complete Theme — only colors + font come from AI, rest from presets
  const theme: Theme = {
    colors,
    font: { family: fontFamily },
    border: baseTheme.border,
    radius: baseTheme.radius,
    spacing: baseTheme.spacing,
    typography: {
      ...baseTheme.typography,
      fontFamily,
      fontFamilyHeading: fontFamily,
    },
    shadow: baseTheme.shadow,
    transition: baseTheme.transition,
  };

  return {
    id: `theme_${Date.now()}`,
    name: result.name || 'AI Generated Theme',
    type: result.type || 'light',
    theme,
    description: result.description || `Generated from: "${prompt}"`,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
  };
}
