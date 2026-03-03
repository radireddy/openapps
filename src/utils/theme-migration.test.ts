import { migrateTheme } from '@/utils/theme-migration';
import { defaultLightTheme, defaultDarkTheme } from '@/theme-presets';

describe('migrateTheme', () => {
  describe('v2 themes (already migrated)', () => {
    it('returns theme as-is if it already has typography key', () => {
      const v2Theme = {
        colors: { primary: '#3b82f6' },
        typography: { fontFamily: 'Inter' },
      };
      const result = migrateTheme(v2Theme);
      expect(result).toBe(v2Theme);
    });

    it('preserves all existing v2 properties', () => {
      const fullV2Theme = { ...defaultLightTheme };
      const result = migrateTheme(fullV2Theme);
      expect(result).toBe(fullV2Theme);
    });
  });

  describe('null/undefined/missing colors input', () => {
    it('returns defaultLightTheme for null input', () => {
      const result = migrateTheme(null);
      expect(result).toEqual(defaultLightTheme);
    });

    it('returns defaultLightTheme for undefined input', () => {
      const result = migrateTheme(undefined);
      expect(result).toEqual(defaultLightTheme);
    });

    it('returns defaultLightTheme when colors are missing', () => {
      const result = migrateTheme({ font: { family: 'Arial' } });
      expect(result).toEqual(defaultLightTheme);
    });

    it('returns defaultLightTheme for empty object', () => {
      const result = migrateTheme({});
      expect(result).toEqual(defaultLightTheme);
    });
  });

  describe('v1 light theme migration', () => {
    const v1LightTheme = {
      colors: {
        primary: '#2563eb',
        onPrimary: '#ffffff',
        secondary: '#7c3aed',
        onSecondary: '#ffffff',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        border: '#e2e8f0',
      },
      font: { family: 'Roboto' },
      border: { width: '2px', style: 'dashed' },
      radius: { default: '8px' },
      spacing: { sm: '6px', md: '12px', lg: '24px' },
    };

    it('produces a v2 theme with typography key', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.typography).toBeDefined();
    });

    it('preserves v1 color values exactly', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.primary).toBe('#2563eb');
      expect(result.colors.onPrimary).toBe('#ffffff');
      expect(result.colors.secondary).toBe('#7c3aed');
      expect(result.colors.onSecondary).toBe('#ffffff');
      expect(result.colors.background).toBe('#ffffff');
      expect(result.colors.surface).toBe('#f8fafc');
      expect(result.colors.text).toBe('#1e293b');
      expect(result.colors.border).toBe('#e2e8f0');
    });

    it('derives primaryLight and primaryDark from primary', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.primaryLight).toBeDefined();
      expect(result.colors.primaryDark).toBeDefined();
      expect(result.colors.primaryLight).not.toBe(result.colors.primary);
      expect(result.colors.primaryDark).not.toBe(result.colors.primary);
    });

    it('derives secondaryLight and secondaryDark from secondary', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.secondaryLight).toBeDefined();
      expect(result.colors.secondaryDark).toBeDefined();
    });

    it('preserves v1 font family in both font and typography', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.font.family).toBe('Roboto');
      expect(result.typography.fontFamily).toBe('Roboto');
      expect(result.typography.fontFamilyHeading).toBe('Roboto');
    });

    it('preserves v1 border properties', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.border.width).toBe('2px');
      expect(result.border.style).toBe('dashed');
    });

    it('preserves v1 radius default', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.radius.default).toBe('8px');
      expect(result.radius.md).toBe('8px');
    });

    it('preserves v1 spacing values', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.spacing.sm).toBe('6px');
      expect(result.spacing.md).toBe('12px');
      expect(result.spacing.lg).toBe('24px');
    });

    it('adds status colors from light defaults', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.error).toBe(defaultLightTheme.colors.error);
      expect(result.colors.warning).toBe(defaultLightTheme.colors.warning);
      expect(result.colors.success).toBe(defaultLightTheme.colors.success);
      expect(result.colors.info).toBe(defaultLightTheme.colors.info);
    });

    it('sets link color to primary', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.link).toBe('#2563eb');
    });

    it('sets focus color to primary', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.focus).toBe('#2563eb');
    });

    it('uses light theme shadow', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.shadow).toEqual(defaultLightTheme.shadow);
    });

    it('includes transition properties from base', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.transition).toEqual(defaultLightTheme.transition);
    });

    it('sets onBackground from text color', () => {
      const result = migrateTheme(v1LightTheme);
      expect(result.colors.onBackground).toBe('#1e293b');
    });
  });

  describe('v1 dark theme migration', () => {
    const v1DarkTheme = {
      colors: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#e2e8f0',
        border: '#334155',
      },
    };

    it('detects dark theme based on background color luminance', () => {
      const result = migrateTheme(v1DarkTheme);
      expect(result.shadow).toEqual(defaultDarkTheme.shadow);
    });

    it('uses dark base defaults for missing properties', () => {
      const result = migrateTheme(v1DarkTheme);
      expect(result.colors.error).toBe(defaultDarkTheme.colors.error);
    });

    it('preserves provided dark theme colors', () => {
      const result = migrateTheme(v1DarkTheme);
      expect(result.colors.primary).toBe('#60a5fa');
      expect(result.colors.background).toBe('#0f172a');
      expect(result.colors.text).toBe('#e2e8f0');
    });

    it('falls back to dark base font when font not provided', () => {
      const result = migrateTheme(v1DarkTheme);
      expect(result.font.family).toBe(defaultDarkTheme.font.family);
    });
  });

  describe('v1 minimal theme (only colors)', () => {
    it('fills all missing properties from base theme', () => {
      const minimal = { colors: { primary: '#ff0000', background: '#ffffff' } };
      const result = migrateTheme(minimal);
      expect(result.typography).toBeDefined();
      expect(result.shadow).toBeDefined();
      expect(result.transition).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.radius).toBeDefined();
      expect(result.border).toBeDefined();
    });

    it('uses base defaults for missing color values', () => {
      const minimal = { colors: { primary: '#ff0000', background: '#ffffff' } };
      const result = migrateTheme(minimal);
      expect(result.colors.primary).toBe('#ff0000');
      expect(result.colors.secondary).toBe(defaultLightTheme.colors.secondary);
    });
  });
});
