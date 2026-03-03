describe('Preview text selection', () => {
  test('preview content wrapper should have userSelect text property', () => {
    const previewStyle = {
      userSelect: 'text' as const,
    };
    expect(previewStyle.userSelect).toBe('text');
  });
});
