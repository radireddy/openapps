/**
 * Monaco Editor configuration for Vite.
 *
 * By default, @monaco-editor/react loads Monaco from a CDN (jsdelivr).
 * This fails silently in environments with network restrictions or slow
 * connections, leaving the editor stuck on "Loading..." forever.
 *
 * This module configures the loader to use the locally installed
 * `monaco-editor` package and sets up web workers for Vite.
 */
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

// Configure web workers for Vite's module-based bundling
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'typescript' || label === 'javascript') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
      { type: 'module' }
    );
  },
};

// Use local monaco-editor package instead of CDN
loader.config({ monaco });
