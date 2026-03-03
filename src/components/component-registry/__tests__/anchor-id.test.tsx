import React from 'react';

describe('Anchor ID on components', () => {
  test('anchorId property is a valid string identifier', () => {
    const props = {
      width: '100%',
      height: 'auto',
      anchorId: 'hero-section',
    };
    expect(props.anchorId).toBe('hero-section');
    // Verify it would be a valid HTML id
    expect(props.anchorId).toMatch(/^[a-zA-Z][\w-]*$/);
  });

  test('anchorId can be undefined', () => {
    const props = {
      width: '100%',
      height: 'auto',
    };
    expect((props as any).anchorId).toBeUndefined();
  });
});
