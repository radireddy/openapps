

import React from 'react';
import { ComponentType, ButtonProps, ComponentPlugin, ActionHandlers } from '../../types';
import { InlineTextEditor } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { commonStylingProps } from '../../constants';
import { useDisplayStyle } from './useDisplayStyle';
import { coerceToBoolean } from './form-utils';
import { useInheritedStyles } from '../InheritedStylesContext';
// Common icon style
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

// This utility handles evaluation at the moment of an event (like a click)
const evaluateAndProcess = (valueOrExpr: any, scope: Record<string, any>): any => {
    if (typeof valueOrExpr !== 'string') {
        return valueOrExpr; // It's a literal value, not a string expression
    }

    // Pure expression: "{{ ... }}"
    if (valueOrExpr.startsWith('{{') && valueOrExpr.endsWith('}}')) {
        const expression = valueOrExpr.substring(2, valueOrExpr.length - 2).trim();
        return safeEval(expression, scope);
    }

    // Template literal: "Hello, {{ name }}"
    if (valueOrExpr.includes('{{') && valueOrExpr.includes('}}')) {
         return valueOrExpr.replace(/{{\s*(.*?)\s*}}/g, (match: string, expression: string) => {
            const result = safeEval(expression, scope);
            return result !== undefined && result !== null ? String(result) : '';
        });
    }

    // It's just a literal string
    return valueOrExpr;
};

/** Parse a CSS color string (hex or rgb()) into RGB components. Returns null for unparseable values. */
const parseColorToRgb = (color: string): { r: number; g: number; b: number } | null => {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim();
  // Hex format: #RGB or #RRGGBB
  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }
  // rgb()/rgba() format
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }
  return null;
};

/** Check if a color is light (high luminance). Used to pick a visible accent color for non-solid button variants. */
const isLightColor = (color: string): boolean => {
  const rgb = parseColorToRgb(color);
  if (!rgb) return false;
  // Perceived luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.7;
};

/** Size configurations for button variants */
const buttonSizes = {
  sm: { fontSize: '12px', padding: '4px 12px', height: '32px' },
  md: { fontSize: '14px', padding: '8px 16px', height: '40px' },
  lg: { fontSize: '16px', padding: '10px 24px', height: '48px' },
};

/** Loading spinner SVG */
const LoadingSpinner: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" strokeDashoffset="10" opacity="0.7" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const ButtonRenderer: React.FC<{
  component: { id?: string; props: ButtonProps };
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, actions, isEditingInline, onCommitInlineEdit, evaluationScope }) => {
  const p = component.props;

  // Cascading text styles: use inherited values as fallbacks for font properties (NOT color)
  const inherited = useInheritedStyles();

  // Evaluate dynamic properties for rendering
  const text = useJavaScriptRenderer(p.text, evaluationScope, '');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#4f46e5');
  const textColor = useJavaScriptRenderer(p.textColor, evaluationScope, '#FFFFFF');
  const effectiveFontSize = p.fontSize || inherited.textFontSize;
  const fontSize = useJavaScriptRenderer(effectiveFontSize, evaluationScope, undefined);
  const loadingValue = useJavaScriptRenderer(p.loading, evaluationScope, false);

  const { isDisabled, finalOpacity, borderShadowStyle } = useDisplayStyle(p, evaluationScope);

  const isLoading = coerceToBoolean(loadingValue);
  const variant = p.variant || 'solid';
  const size = p.size || 'md';
  const sizeConfig = buttonSizes[size];

  const handleButtonClick = () => {
    if (mode === 'preview' && !isDisabled && !isLoading) {
      // Add a reference to actions into the scope for executeCode
      const clickScope = { ...evaluationScope, actions };

      switch(p.actionType) {
        case 'alert':
            if (p.actionAlertMessage) {
                const message = evaluateAndProcess(p.actionAlertMessage, clickScope);
                alert(message);
            }
            break;
        case 'updateVariable':
            if (p.actionVariableName && actions) {
                const newValue = evaluateAndProcess(p.actionVariableValue, clickScope);
                actions.updateVariable(p.actionVariableName, newValue);
            }
            break;
        case 'executeCode':
            if (p.actionCodeToExecute) {
                evaluateAndProcess(p.actionCodeToExecute, clickScope);
            }
            break;
        case 'submitForm':
            if (actions && actions.submitForm) {
                actions.submitForm(p.actionOnSubmitCode, clickScope, undefined, component.id);
            }
            break;
        case 'navigate': {
            // Determine target page: expression overrides static ID
            let targetPageId: string | undefined;
            if (p.actionPageExpression) {
              targetPageId = evaluateAndProcess(p.actionPageExpression, clickScope);
            } else {
              targetPageId = p.actionPageId;
            }
            if (targetPageId && actions?.navigateTo) {
              if (p.validateBeforeNavigate && actions.submitForm) {
                // Use submitForm with a success callback that navigates
                actions.submitForm(`{{ actions.navigateTo("${targetPageId}") }}`, clickScope, undefined, component.id);
              } else {
                actions.navigateTo(targetPageId);
              }
            }
            break;
          }
        default:
          break;
      }
    }
  };

  // In edit mode, allow interaction for selection; in preview mode, disable if needed
  const isDisabledInPreview = mode === 'preview' && (isDisabled || isLoading);

  // Build variant-specific styles
  // For non-solid variants, the "accent color" (used for text & border) is typically
  // backgroundColor (the button's brand/primary color). However, when backgroundColor
  // is very light (e.g. white), it becomes invisible on a light canvas. In that case,
  // fall back to textColor which is designed to contrast with backgroundColor.
  const accentColor = isLightColor(backgroundColor) ? textColor : backgroundColor;

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: accentColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: accentColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: accentColor,
          borderWidth: '0',
          borderStyle: 'none',
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: accentColor,
          borderWidth: '0',
          borderStyle: 'none',
          padding: '4px 8px',
        };
      case 'solid':
      default:
        return {
          backgroundColor,
          color: textColor,
          borderStyle: p.borderStyle || 'none',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Inherited font styles applied as low-priority defaults (before component's own styles).
  // fontFamily is a reasonable default; fontWeight is NOT applied because Button has
  // its own semantic weight via the font-semibold Tailwind class.
  const style: React.CSSProperties = {
    ...(inherited.textFontFamily && { fontFamily: inherited.textFontFamily }),
    ...borderShadowStyle,
    ...variantStyles,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: fontSize || sizeConfig.fontSize,
    padding: sizeConfig.padding,
    opacity: finalOpacity,
    cursor: isDisabledInPreview ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
    width: p.fullWidth ? '100%' : undefined,
  };

  const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const spinnerColor = variant === 'solid' ? textColor : accentColor;

  return (
    <button
      type="button"
      onClick={handleButtonClick}
      style={style}
      className="w-full h-full font-semibold transition-opacity hover:opacity-90"
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
      aria-busy={isLoading || undefined}
    >
      {isEditingInline && onCommitInlineEdit ? (
        <InlineTextEditor
          value={p.text}
          onCommit={onCommitInlineEdit}
          style={{
            color: variantStyles.color,
            textAlign: 'center',
            fontWeight: '600',
            fontFamily: 'sans-serif'
          }}
        />
      ) : (
        <>
          {isLoading && <LoadingSpinner color={spinnerColor} size={spinnerSize} />}
          {!isLoading && p.iconLeft && <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{p.iconLeft}</span>}
          <span>{text}</span>
          {!isLoading && p.iconRight && <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{p.iconRight}</span>}
        </>
      )}
    </button>
  );
};

export const ButtonPlugin: ComponentPlugin = {
  type: ComponentType.BUTTON,
  paletteConfig: {
    label: 'Button',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "6", y: "7", width: "12", height: "10", rx: "2", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M12 12H12.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      text: 'Click Me',
      width: '100%',
      height: 'auto',
      backgroundColor: '{{theme.colors.primary}}',
      textColor: '{{theme.colors.onPrimary}}',
      actionType: 'none',
      borderStyle: 'none',
      disabled: false,
      variant: 'solid',
      loading: false,
      size: 'md',
      fullWidth: false,
    },
  },
  renderer: ButtonRenderer,
  properties: () => null,
};