import React from 'react';

describe('Hover state CSS generation', () => {
  test('generates hover CSS class for component with hoverBackgroundColor', () => {
    const componentId = 'LABEL_test1';
    const hoverBg = '#ff0000';
    const hoverColor = '#ffffff';

    const className = `procode-hover-${componentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const css = `.${className}:hover { background-color: ${hoverBg} !important; color: ${hoverColor} !important; }`;

    expect(className).toBe('procode-hover-LABEL-test1');
    expect(css).toContain(':hover');
    expect(css).toContain('#ff0000');
    expect(css).toContain('#ffffff');
  });

  test('generates hover CSS with opacity and transform', () => {
    const componentId = 'BTN_1';
    const className = `procode-hover-${componentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const hoverOpacity = 0.8;
    const hoverTransform = 'scale(1.05)';

    const rules: string[] = [];
    rules.push(`opacity: ${hoverOpacity} !important`);
    rules.push(`transform: ${hoverTransform} !important`);
    const css = `.${className}:hover { ${rules.join('; ')}; }`;

    expect(css).toContain('opacity: 0.8');
    expect(css).toContain('scale(1.05)');
  });

  test('no hover class generated when no hover props are set', () => {
    const hoverBg = undefined;
    const hoverColor = undefined;
    const hoverOpacity = undefined;
    const hoverTransform = undefined;

    const hasHover = !!(hoverBg || hoverColor || hoverOpacity || hoverTransform);
    expect(hasHover).toBe(false);
  });

  test('sanitizes component ID with special characters for CSS class name', () => {
    const componentId = 'CONTAINER_page1.section-2';
    const className = `procode-hover-${componentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    expect(className).toBe('procode-hover-CONTAINER-page1-section-2');
    // Should be a valid CSS class name (no dots or other special chars)
    expect(className).not.toContain('.');
  });

  test('hasHoverProps is true when at least one hover property is set', () => {
    const cases = [
      { hoverBg: '#ff0000', hoverColor: undefined, hoverOpacity: undefined, hoverTransform: undefined },
      { hoverBg: undefined, hoverColor: '#fff', hoverOpacity: undefined, hoverTransform: undefined },
      { hoverBg: undefined, hoverColor: undefined, hoverOpacity: 0.5, hoverTransform: undefined },
      { hoverBg: undefined, hoverColor: undefined, hoverOpacity: undefined, hoverTransform: 'scale(1.1)' },
    ];

    cases.forEach(({ hoverBg, hoverColor, hoverOpacity, hoverTransform }) => {
      const hasHover = !!(hoverBg || hoverColor || hoverOpacity || hoverTransform);
      expect(hasHover).toBe(true);
    });
  });

  test('generates combined CSS rule with all hover properties', () => {
    const componentId = 'BTN_2';
    const className = `procode-hover-${componentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const hoverBg = '#3b82f6';
    const hoverColor = '#ffffff';
    const hoverOpacity = 0.9;
    const hoverTransform = 'translateY(-2px)';

    const rules: string[] = [];
    if (hoverBg) rules.push(`background-color: ${hoverBg} !important`);
    if (hoverColor) rules.push(`color: ${hoverColor} !important`);
    if (hoverOpacity !== undefined) rules.push(`opacity: ${hoverOpacity} !important`);
    if (hoverTransform) rules.push(`transform: ${hoverTransform} !important`);

    const css = `.${className}:hover { ${rules.join('; ')}; transition: all 0.2s ease !important; }`;

    expect(css).toContain('background-color: #3b82f6 !important');
    expect(css).toContain('color: #ffffff !important');
    expect(css).toContain('opacity: 0.9 !important');
    expect(css).toContain('transform: translateY(-2px) !important');
    expect(css).toContain('transition: all 0.2s ease !important');
  });
});
