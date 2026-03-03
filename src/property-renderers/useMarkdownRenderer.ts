import { useMemo } from 'react';
import { marked } from 'marked';
import { useJavaScriptRenderer } from './useJavaScriptRenderer';

/**
 * A property renderer that interprets the input string as Markdown.
 * It first resolves any embedded JavaScript expressions (e.g., {{...}})
 * and then parses the resulting string into HTML.
 * @param value The raw string, which may contain Markdown and expressions.
 * @param scope The evaluation scope for expressions.
 * @param defaultValue A fallback value.
 * @returns An HTML string.
 */
// FIX: Updated function signature to be fully generic (`<T>`) and return type to `T` to match the `PropertyRendererHook` interface.
export function useMarkdownRenderer<T>(value: T, scope: Record<string, any>, defaultValue: T): T {
    const processedValue = useJavaScriptRenderer(value, scope, defaultValue);

    const html = useMemo(() => {
        if (typeof processedValue !== 'string') {
            return processedValue;
        }
        // Configure marked for safety and convenience
        marked.setOptions({
            gfm: true,
            breaks: true, // Convert single line breaks to <br>
        });
        
        try {
            // Note: The parent component is responsible for rendering this HTML safely
            // using dangerouslySetInnerHTML.
            return marked.parse(processedValue) as string;
        } catch (error) {
            console.error("Markdown parsing error:", error);
            return processedValue; // Fallback to the processed string on error
        }
    }, [processedValue]);

    return html as T;
}