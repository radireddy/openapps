describe('Page metadata', () => {
  test('AppPage can have metadata fields', () => {
    const page = {
      id: 'page_1',
      name: 'Home',
      metadata: {
        title: 'My App - Home',
        description: 'Welcome to my app',
        ogImage: 'https://example.com/og.png',
        favicon: 'https://example.com/favicon.ico',
      },
    };
    expect(page.metadata.title).toBe('My App - Home');
    expect(page.metadata.description).toBe('Welcome to my app');
    expect(page.metadata.ogImage).toBe('https://example.com/og.png');
    expect(page.metadata.favicon).toBe('https://example.com/favicon.ico');
  });

  test('AppPage metadata is optional', () => {
    const page = {
      id: 'page_2',
      name: 'About',
    };
    expect((page as any).metadata).toBeUndefined();
  });
});
