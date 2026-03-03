describe('Markdown syntax highlighting', () => {
  test('highlight.js can highlight a code block', () => {
    const hljs = require('highlight.js/lib/common');
    const result = hljs.highlightAuto('const x = 1;');
    expect(result.value).toContain('hljs-');
  });

  test('auto-detection highlights function declaration', () => {
    const hljs = require('highlight.js/lib/common');
    const result = hljs.highlightAuto('function hello() { return "world"; }');
    expect(result.value).toContain('hljs-');
  });

  test('highlight.js handles unknown language gracefully', () => {
    const hljs = require('highlight.js/lib/common');
    const result = hljs.highlightAuto('some random text that is not code');
    // Should not throw, may or may not have highlights
    expect(result.value).toBeTruthy();
  });
});
