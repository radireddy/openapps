export interface EditorThemeDefinition {
  id: string;
  label: string;
  icon: 'moon' | 'sun' | 'monitor';
}

export const EDITOR_THEMES: EditorThemeDefinition[] = [
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'light', label: 'Light', icon: 'sun' },
];

export const DEFAULT_THEME = 'dark';
export const THEME_STORAGE_KEY = 'procode-editor-theme';
