

import React from 'react';
import { ComponentType, LabelProps, ComponentPlugin } from '../../types';
import { InlineTextEditor, buildSpacingStyles } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { propertyRendererRegistry } from '../../property-renderers/registry';
import { useDisplayStyle } from './useDisplayStyle';
import { useInheritedStyles } from '../InheritedStylesContext';
import hljs from 'highlight.js/lib/common';
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const markdownStyles = `
.procode-markdown-content {
  line-height: 1.7;
  word-wrap: break-word;
}
.procode-markdown-content p {
  margin: 0 0 1em 0;
}
.procode-markdown-content p:last-child {
  margin-bottom: 0;
}
.procode-markdown-content h1, .procode-markdown-content h2, .procode-markdown-content h3,
.procode-markdown-content h4, .procode-markdown-content h5, .procode-markdown-content h6 {
  margin: 1.5em 0 0.5em 0;
  line-height: 1.3;
  font-weight: 600;
}
.procode-markdown-content h1:first-child, .procode-markdown-content h2:first-child,
.procode-markdown-content h3:first-child {
  margin-top: 0;
}
.procode-markdown-content h1 { font-size: 2em; }
.procode-markdown-content h2 { font-size: 1.5em; }
.procode-markdown-content h3 { font-size: 1.25em; }
.procode-markdown-content h4 { font-size: 1.1em; }
.procode-markdown-content ul, .procode-markdown-content ol {
  margin: 0 0 1em 0;
  padding-left: 1.5em;
}
.procode-markdown-content li {
  margin-bottom: 0.4em;
}
.procode-markdown-content a {
  color: #4F46E5;
  text-decoration: underline;
}
.procode-markdown-content a:hover {
  color: #3730A3;
}
.procode-markdown-content blockquote {
  margin: 0 0 1em 0;
  padding: 0.5em 1em;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
}
.procode-markdown-content code {
  background: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}
.procode-markdown-content pre {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0 0 1em 0;
}
.procode-markdown-content pre code {
  background: none;
  padding: 0;
}
.procode-markdown-content hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5em 0;
}
.procode-markdown-content strong { font-weight: 600; }
.procode-markdown-content img { max-width: 100%; height: auto; }
`;

let markdownStylesInjected = false;
function injectMarkdownStyles() {
  if (markdownStylesInjected) return;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-procode-markdown', 'true');
  styleEl.textContent = markdownStyles;
  document.head.appendChild(styleEl);
  markdownStylesInjected = true;
}

let highlightStylesInjected = false;
function injectHighlightStyles() {
  if (highlightStylesInjected) return;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-procode-highlight', 'true');
  // GitHub-inspired light theme
  styleEl.textContent = `
.procode-markdown-content pre code.hljs{display:block;overflow-x:auto;padding:1em}
.procode-markdown-content code.hljs{padding:3px 5px}
.hljs{color:#24292e;background:#f6f8fa}
.hljs-comment,.hljs-quote{color:#6a737d;font-style:italic}
.hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#d73a49;font-weight:bold}
.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr{color:#005cc5}
.hljs-string,.hljs-doctag{color:#032f62}
.hljs-title,.hljs-section,.hljs-selector-id{color:#6f42c1;font-weight:bold}
.hljs-type,.hljs-class .hljs-title{color:#6f42c1}
.hljs-tag,.hljs-name,.hljs-attribute{color:#22863a}
.hljs-regexp,.hljs-link{color:#032f62}
.hljs-symbol,.hljs-bullet{color:#e36209}
.hljs-built_in,.hljs-builtin-name{color:#005cc5}
.hljs-meta{color:#735c0f}
.hljs-deletion{color:#b31d28;background:#ffeef0}
.hljs-addition{color:#22863a;background:#f0fff4}
.hljs-emphasis{font-style:italic}
.hljs-strong{font-weight:bold}
`;
  document.head.appendChild(styleEl);
  highlightStylesInjected = true;
}

const LabelRenderer: React.FC<{
  component: { props: LabelProps };
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  evaluationScope: Record<string, any>;
  mode?: 'edit' | 'preview';
  actions?: any;
}> = ({ component, isEditingInline, onCommitInlineEdit, evaluationScope, mode, actions }) => {
  const p = component.props;

  // Call all renderer hooks at the top level (React hooks must be called unconditionally)
  // Then select which result to use based on textRenderer prop
  const javascriptContent = propertyRendererRegistry.javascript(p.text, evaluationScope, '');
  const markdownContent = propertyRendererRegistry.markdown(p.text, evaluationScope, '');
  const literalContent = propertyRendererRegistry.literal(p.text, evaluationScope, '');
  
  // Select the appropriate content based on textRenderer
  const textRenderer = p.textRenderer || 'javascript';
  const content = textRenderer === 'markdown' 
    ? markdownContent 
    : textRenderer === 'literal' 
    ? literalContent 
    : javascriptContent;
  
  // Cascading text styles: use inherited values as fallbacks when component doesn't set its own
  const inherited = useInheritedStyles();

  const effectiveColor = p.color || inherited.textColor;
  const color = useJavaScriptRenderer(effectiveColor, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, 'transparent');
  const effectiveFontSize = p.fontSize || inherited.textFontSize;
  const fontSize = useJavaScriptRenderer(effectiveFontSize, evaluationScope, 16);
  const effectiveFontWeight = p.fontWeight || inherited.textFontWeight;
  const fontWeight = useJavaScriptRenderer(effectiveFontWeight, evaluationScope, 'normal');
  const effectiveFontFamily = p.fontFamily || inherited.textFontFamily;
  const fontFamily = useJavaScriptRenderer(effectiveFontFamily, evaluationScope, 'sans-serif');
  const paddingValue = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
  const marginValue = useJavaScriptRenderer(p.margin, evaluationScope, undefined);
  const lineHeight = useJavaScriptRenderer(p.lineHeight, evaluationScope, undefined);
  const letterSpacing = useJavaScriptRenderer(p.letterSpacing, evaluationScope, undefined);
  const textTransform = useJavaScriptRenderer(p.textTransform, evaluationScope, undefined);
  const textDecoration = useJavaScriptRenderer(p.textDecoration, evaluationScope, undefined);
  const cursor = useJavaScriptRenderer(p.cursor, evaluationScope, undefined);
  const href = useJavaScriptRenderer(p.href, evaluationScope, undefined);

  const { borderShadowStyle } = useDisplayStyle(p, evaluationScope, {
    borderRadius: '0px',
    borderWidth: '0px',
    borderColor: 'transparent',
  });

  const style: React.CSSProperties = {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontWeight,
    color,
    textAlign: p.textAlign || 'left',
    fontFamily: String(fontFamily),
    backgroundColor,
    ...borderShadowStyle,
    borderStyle: p.borderStyle,
    ...buildSpacingStyles(paddingValue, marginValue),
    padding: paddingValue !== undefined ? undefined : '8px',
    boxSizing: 'border-box',
    ...(lineHeight !== undefined && { lineHeight: String(lineHeight) }),
    ...(letterSpacing !== undefined && { letterSpacing: String(letterSpacing) }),
    ...(textTransform !== undefined && { textTransform: textTransform as React.CSSProperties['textTransform'] }),
    ...(textDecoration !== undefined && { textDecoration: String(textDecoration) }),
    ...(cursor !== undefined && { cursor: String(cursor) }),
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (mode !== 'preview' || !href) return;
    const hrefStr = String(href);
    if (hrefStr.startsWith('#')) {
      e.preventDefault();
      const targetId = hrefStr.substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (hrefStr.startsWith('http://') || hrefStr.startsWith('https://')) {
      // External link handled by <a> tag
    } else {
      e.preventDefault();
      if (actions?.navigateTo) {
        actions.navigateTo(hrefStr);
      }
    }
  };

  if (isEditingInline && onCommitInlineEdit) {
      return (
          <div style={{...style, padding: '0'}}>
              <InlineTextEditor
                value={p.text}
                onCommit={onCommitInlineEdit}
                style={{ 
                    fontSize: style.fontSize, 
                    fontWeight: style.fontWeight,
                    color: style.color,
                    textAlign: style.textAlign,
                    fontFamily: style.fontFamily,
                    padding: '8px',
                }}
              />
          </div>
      )
  }
  
  // For renderers that return a string (like Markdown), we need to render it as HTML
  if (p.textRenderer === 'markdown' && typeof content === 'string') {
      injectMarkdownStyles();
      injectHighlightStyles();

      // Apply syntax highlighting to code blocks
      let highlightedContent = content;
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        tempDiv.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
        highlightedContent = tempDiv.innerHTML;
      } catch (e) {
        // Fallback to un-highlighted content
      }

      const markdownDiv = (
        <div style={{...style, display: 'block'}} className="procode-markdown-content" dangerouslySetInnerHTML={{ __html: highlightedContent }} />
      );
      if (mode === 'preview' && href) {
        const hrefStr = String(href);
        if (hrefStr.startsWith('http://') || hrefStr.startsWith('https://')) {
          return <a href={hrefStr} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{markdownDiv}</a>;
        }
        return <div onClick={handleLinkClick} style={{ cursor: 'pointer' }}>{markdownDiv}</div>;
      }
      return markdownDiv;
  }

  // Use flexbox for vertical centering (alignItems: 'center')
  // For horizontal alignment, use justifyContent based on textAlign
  // Map textAlign to justifyContent: 'left' -> 'flex-start', 'center' -> 'center', 'right' -> 'flex-end'
  const justifyContent = p.textAlign === 'center' ? 'center' : (p.textAlign === 'right' ? 'flex-end' : 'flex-start');
  
  const textElement = (
    <div style={{...style, display: 'flex', alignItems: 'center', justifyContent, width: '100%', height: '100%'}}>
      <span style={{ textAlign: p.textAlign || 'left', width: '100%', color: style.color, fontSize: style.fontSize }}>{String(content)}</span>
    </div>
  );

  if (mode === 'preview' && href) {
    const hrefStr = String(href);
    if (hrefStr.startsWith('http://') || hrefStr.startsWith('https://')) {
      return <a href={hrefStr} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}>{textElement}</a>;
    }
    return <div onClick={handleLinkClick} style={{ cursor: 'pointer', width: '100%', height: '100%' }}>{textElement}</div>;
  }

  return textElement;
};

export const LabelPlugin: ComponentPlugin = {
  type: ComponentType.LABEL,
  paletteConfig: {
    label: 'Label',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 7H14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 12H10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M16 11L18.5 16L21 11", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonStylingProps,
      text: 'New Label',
      width: '100%',
      height: 'auto',
      fontSize: '{{theme.typography.fontSizeLg}}',
      fontWeight: '{{theme.typography.fontWeightNormal}}',
      color: '{{theme.colors.text}}',
      textAlign: 'left',
      fontFamily: '{{theme.typography.fontFamily}}',
      backgroundColor: 'transparent',
      borderStyle: 'none',
      textRenderer: 'javascript',
    },
  },
  renderer: LabelRenderer,
  properties: () => null,
};