import { PropertyRendererHook } from '../types';
import { useJavaScriptRenderer } from './useJavaScriptRenderer';
import { useMarkdownRenderer } from './useMarkdownRenderer';

const useLiteralRenderer: PropertyRendererHook = (value) => {
    return value;
};

export const propertyRendererRegistry: Record<string, PropertyRendererHook> = {
    javascript: useJavaScriptRenderer,
    markdown: useMarkdownRenderer,
    literal: useLiteralRenderer,
};
