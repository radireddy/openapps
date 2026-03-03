import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  lightenColor,
  darkenColor,
  isColorDark,
  getContrastRatio,
  meetsContrastAA,
} from '@/utils/color-utils';

describe('color-utils', () => {
  describe('hexToRgb', () => {
    it('converts 6-char hex with # to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts 6-char hex without # to RGB', () => {
      expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('converts 3-char shorthand hex with #', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts 3-char shorthand hex without #', () => {
      expect(hexToRgb('0f0')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('handles pure black', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('handles pure white', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('handles shorthand black (#000)', () => {
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('handles shorthand white (#fff)', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('handles uppercase hex', () => {
      expect(hexToRgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
    });

    it('handles mixed case hex', () => {
      expect(hexToRgb('#aAbBcC')).toEqual({ r: 170, g: 187, b: 204 });
    });

    it('parses cornflower blue (#6495ed)', () => {
      expect(hexToRgb('#6495ed')).toEqual({ r: 100, g: 149, b: 237 });
    });

    it('parses mid-gray (#808080)', () => {
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
    });
  });

  describe('rgbToHex', () => {
    it('converts primary red to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    });

    it('converts green to hex', () => {
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    });

    it('converts blue to hex', () => {
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('converts black to hex', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('converts white to hex', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('pads single-digit hex values with leading zero', () => {
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });

    it('clamps values above 255 down to 255', () => {
      expect(rgbToHex(300, 999, 256)).toBe('#ffffff');
    });

    it('clamps negative values up to 0', () => {
      expect(rgbToHex(-10, -1, -255)).toBe('#000000');
    });

    it('clamps a mix of out-of-range values', () => {
      expect(rgbToHex(-5, 128, 300)).toBe('#0080ff');
    });

    it('rounds fractional values', () => {
      expect(rgbToHex(127.6, 0.4, 254.9)).toBe('#8000ff');
    });
  });

  describe('hexToHsl', () => {
    it('converts pure red to HSL (0, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#ff0000');
      expect(h).toBeCloseTo(0, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts pure green to HSL (120, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#00ff00');
      expect(h).toBeCloseTo(120, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts pure blue to HSL (240, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#0000ff');
      expect(h).toBeCloseTo(240, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts white to HSL (0, 0, 100)', () => {
      const { h, s, l } = hexToHsl('#ffffff');
      expect(h).toBe(0);
      expect(s).toBe(0);
      expect(l).toBe(100);
    });

    it('converts black to HSL (0, 0, 0)', () => {
      const { h, s, l } = hexToHsl('#000000');
      expect(h).toBe(0);
      expect(s).toBe(0);
      expect(l).toBe(0);
    });

    it('converts mid-gray to HSL with 0 saturation', () => {
      const { s, l } = hexToHsl('#808080');
      expect(s).toBeCloseTo(0, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts yellow (#ffff00) to HSL (60, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#ffff00');
      expect(h).toBeCloseTo(60, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts cyan (#00ffff) to HSL (180, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#00ffff');
      expect(h).toBeCloseTo(180, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('converts magenta (#ff00ff) to HSL (300, 100, 50)', () => {
      const { h, s, l } = hexToHsl('#ff00ff');
      expect(h).toBeCloseTo(300, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });

    it('handles 3-char shorthand hex', () => {
      const { h, s, l } = hexToHsl('#f00');
      expect(h).toBeCloseTo(0, 0);
      expect(s).toBeCloseTo(100, 0);
      expect(l).toBeCloseTo(50, 0);
    });
  });

  describe('hslToHex', () => {
    it('converts HSL red (0, 100, 50) to #ff0000', () => {
      expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    });

    it('converts HSL green (120, 100, 50) to #00ff00', () => {
      expect(hslToHex(120, 100, 50)).toBe('#00ff00');
    });

    it('converts HSL blue (240, 100, 50) to #0000ff', () => {
      expect(hslToHex(240, 100, 50)).toBe('#0000ff');
    });

    it('converts HSL white (0, 0, 100) to #ffffff', () => {
      expect(hslToHex(0, 0, 100)).toBe('#ffffff');
    });

    it('converts HSL black (0, 0, 0) to #000000', () => {
      expect(hslToHex(0, 0, 0)).toBe('#000000');
    });

    it('converts HSL yellow (60, 100, 50) to #ffff00', () => {
      expect(hslToHex(60, 100, 50)).toBe('#ffff00');
    });

    it('converts HSL cyan (180, 100, 50) to #00ffff', () => {
      expect(hslToHex(180, 100, 50)).toBe('#00ffff');
    });

    it('converts HSL magenta (300, 100, 50) to #ff00ff', () => {
      expect(hslToHex(300, 100, 50)).toBe('#ff00ff');
    });

    it('converts HSL mid-gray (0, 0, 50) to #808080', () => {
      expect(hslToHex(0, 0, 50)).toBe('#808080');
    });

    it('handles hue in 60-120 range', () => {
      expect(hslToHex(90, 100, 50)).toBe('#80ff00');
    });

    it('handles hue in 120-180 range', () => {
      expect(hslToHex(150, 100, 50)).toBe('#00ff80');
    });

    it('handles hue in 180-240 range', () => {
      expect(hslToHex(210, 100, 50)).toBe('#0080ff');
    });

    it('handles hue in 240-300 range', () => {
      expect(hslToHex(270, 100, 50)).toBe('#8000ff');
    });

    it('handles hue in 300-360 range', () => {
      expect(hslToHex(330, 100, 50)).toBe('#ff0080');
    });
  });

  describe('round-trip conversions', () => {
    const colorsToTest = [
      '#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000',
      '#ffff00', '#ff00ff', '#00ffff', '#808080', '#336699', '#c0c0c0',
    ];

    describe('hex -> rgb -> hex', () => {
      it.each(colorsToTest)('round-trips %s through RGB', (hex) => {
        const { r, g, b } = hexToRgb(hex);
        expect(rgbToHex(r, g, b)).toBe(hex);
      });
    });

    describe('hex -> hsl -> hex', () => {
      it.each(colorsToTest)('round-trips %s through HSL', (hex) => {
        const { h, s, l } = hexToHsl(hex);
        expect(hslToHex(h, s, l)).toBe(hex);
      });
    });

    it('round-trips a 3-char hex through RGB (expanding to 6-char)', () => {
      const { r, g, b } = hexToRgb('#f0f');
      expect(rgbToHex(r, g, b)).toBe('#ff00ff');
    });
  });

  describe('lightenColor', () => {
    it('lightens a color by the specified amount', () => {
      const result = lightenColor('#808080', 20);
      const { l } = hexToHsl(result);
      expect(l).toBeCloseTo(70, 0);
    });

    it('does not exceed lightness of 100', () => {
      const result = lightenColor('#ffffff', 10);
      expect(result).toBe('#ffffff');
    });

    it('caps lightness at 100 for very large amounts', () => {
      const result = lightenColor('#808080', 200);
      expect(result).toBe('#ffffff');
    });

    it('lightens black by 50 to mid-gray range', () => {
      const result = lightenColor('#000000', 50);
      const { l } = hexToHsl(result);
      expect(l).toBeCloseTo(50, 0);
    });

    it('returns the same color when amount is 0', () => {
      expect(lightenColor('#336699', 0)).toBe('#336699');
    });

    it('preserves hue and saturation when lightening', () => {
      const original = hexToHsl('#336699');
      const lightened = hexToHsl(lightenColor('#336699', 10));
      expect(lightened.h).toBeCloseTo(original.h, 0);
      expect(lightened.s).toBeCloseTo(original.s, 0);
    });
  });

  describe('darkenColor', () => {
    it('darkens a color by the specified amount', () => {
      const result = darkenColor('#808080', 20);
      const { l } = hexToHsl(result);
      expect(l).toBeCloseTo(30, 0);
    });

    it('does not go below lightness of 0', () => {
      const result = darkenColor('#000000', 10);
      expect(result).toBe('#000000');
    });

    it('caps lightness at 0 for very large amounts', () => {
      const result = darkenColor('#808080', 200);
      expect(result).toBe('#000000');
    });

    it('darkens white by 50 to mid-gray range', () => {
      const result = darkenColor('#ffffff', 50);
      const { l } = hexToHsl(result);
      expect(l).toBeCloseTo(50, 0);
    });

    it('returns the same color when amount is 0', () => {
      expect(darkenColor('#336699', 0)).toBe('#336699');
    });
  });

  describe('lighten and darken inverse relationship', () => {
    it('lightening then darkening by the same amount returns approximately the original', () => {
      const original = '#336699';
      const lightened = lightenColor(original, 15);
      const restored = darkenColor(lightened, 15);
      // Allow minor floating point drift in HSL round-trips
      const origRgb = hexToRgb(original);
      const restoredRgb = hexToRgb(restored);
      expect(restoredRgb.r).toBeCloseTo(origRgb.r, -1);
      expect(restoredRgb.g).toBeCloseTo(origRgb.g, -1);
      expect(restoredRgb.b).toBeCloseTo(origRgb.b, -1);
    });

    it('darkening then lightening by the same amount returns approximately the original', () => {
      const original = '#996633';
      const darkened = darkenColor(original, 10);
      const restored = lightenColor(darkened, 10);
      const origRgb = hexToRgb(original);
      const restoredRgb = hexToRgb(restored);
      expect(restoredRgb.r).toBeCloseTo(origRgb.r, -1);
      expect(restoredRgb.g).toBeCloseTo(origRgb.g, -1);
      expect(restoredRgb.b).toBeCloseTo(origRgb.b, -1);
    });
  });

  describe('isColorDark', () => {
    it('returns true for black', () => {
      expect(isColorDark('#000000')).toBe(true);
    });

    it('returns false for white', () => {
      expect(isColorDark('#ffffff')).toBe(false);
    });

    it('returns true for dark navy blue', () => {
      expect(isColorDark('#000080')).toBe(true);
    });

    it('returns true for dark red', () => {
      expect(isColorDark('#800000')).toBe(true);
    });

    it('returns false for bright yellow', () => {
      expect(isColorDark('#ffff00')).toBe(false);
    });

    it('returns false for bright cyan', () => {
      expect(isColorDark('#00ffff')).toBe(false);
    });

    it('returns true for pure blue (#0000ff)', () => {
      expect(isColorDark('#0000ff')).toBe(true);
    });

    it('returns false for pure green (#00ff00)', () => {
      expect(isColorDark('#00ff00')).toBe(false);
    });

    it('handles 3-char shorthand hex', () => {
      expect(isColorDark('#000')).toBe(true);
      expect(isColorDark('#fff')).toBe(false);
    });

    it('handles hex without # prefix', () => {
      expect(isColorDark('000000')).toBe(true);
      expect(isColorDark('ffffff')).toBe(false);
    });
  });

  describe('getContrastRatio', () => {
    it('returns 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 21 for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 1);
    });

    it('returns 1 for black on black', () => {
      expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 1);
    });

    it('returns 1 for white on white', () => {
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
    });

    it('is symmetric (fg/bg order does not change the ratio)', () => {
      const ratio1 = getContrastRatio('#336699', '#ffcc00');
      const ratio2 = getContrastRatio('#ffcc00', '#336699');
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });

    it('returns a value between 1 and 21', () => {
      const ratio = getContrastRatio('#123456', '#abcdef');
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });

    it('calculates known ratio for white vs mid-gray (#808080)', () => {
      const ratio = getContrastRatio('#ffffff', '#808080');
      expect(ratio).toBeCloseTo(3.95, 1);
    });

    it('handles 3-char hex inputs', () => {
      const ratio = getContrastRatio('#000', '#fff');
      expect(ratio).toBeCloseTo(21, 0);
    });
  });

  describe('meetsContrastAA', () => {
    it('passes AA for black on white (normal text)', () => {
      expect(meetsContrastAA('#000000', '#ffffff')).toBe(true);
    });

    it('passes AA for black on white (large text)', () => {
      expect(meetsContrastAA('#000000', '#ffffff', true)).toBe(true);
    });

    it('fails AA for white on white', () => {
      expect(meetsContrastAA('#ffffff', '#ffffff')).toBe(false);
    });

    it('fails AA for same color', () => {
      expect(meetsContrastAA('#888888', '#888888')).toBe(false);
    });

    it('uses 4.5:1 threshold for normal text', () => {
      // #767676 on white has ratio ~4.54 (passes)
      expect(meetsContrastAA('#767676', '#ffffff')).toBe(true);
      // #777777 on white has ratio ~4.48 (fails)
      expect(meetsContrastAA('#777777', '#ffffff')).toBe(false);
    });

    it('uses 3:1 threshold for large text', () => {
      // #808080 on white has ratio ~3.95 which passes large text
      expect(meetsContrastAA('#808080', '#ffffff', true)).toBe(true);
      // but fails normal text
      expect(meetsContrastAA('#808080', '#ffffff', false)).toBe(false);
    });

    it('defaults isLargeText to false', () => {
      expect(meetsContrastAA('#808080', '#ffffff')).toBe(false);
    });

    it('is symmetric with respect to fg/bg order', () => {
      expect(meetsContrastAA('#000000', '#ffffff')).toBe(meetsContrastAA('#ffffff', '#000000'));
    });
  });

  describe('known color cross-function verification', () => {
    it('correctly processes Material Design primary blue (#1976d2)', () => {
      const rgb = hexToRgb('#1976d2');
      expect(rgb).toEqual({ r: 25, g: 118, b: 210 });
      const hsl = hexToHsl('#1976d2');
      expect(hsl.h).toBeCloseTo(210, 0);
      expect(isColorDark('#1976d2')).toBe(true);
    });

    it('correctly identifies dark vs light for common colors', () => {
      expect(isColorDark('#333333')).toBe(true);
      expect(isColorDark('#1a1a2e')).toBe(true);
      expect(isColorDark('#ecf0f1')).toBe(false);
      expect(isColorDark('#f5f5dc')).toBe(false);
    });
  });
});
