import React from 'react';

/**
 * Base Container Utilities
 *
 * This module provides reusable utilities for creating container-based components.
 * Any component that extends Container will automatically get:
 * - All container properties (padding, borders, background, etc.)
 * - Container rendering behavior (absolute positioning for children)
 * - Container drag-and-drop behavior
 * - Container property panel structure
 */
import { ContainerProps, ActionHandlers, FlexDirection, FlexWrap, JustifyContent, AlignItems } from '../../types';
import { buildBorderStyles, buildSpacingStyles } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { useInheritedStyles, mergeInheritedStyles, InheritedStylesProvider } from '../InheritedStylesContext';

/**
 * Options for customizing the base container renderer
 */
export interface BaseContainerRendererOptions {
  /**
   * Optional custom style extensions to merge with base container styles
   */
  styleExtensions?: React.CSSProperties | ((props: ContainerProps, evaluationScope: Record<string, any>) => React.CSSProperties);
  
  /**
   * Optional custom onClick handler
   * If provided, this will be called in addition to the base onClick handler
   */
  onClick?: (props: ContainerProps, actions?: ActionHandlers, evaluationScope?: Record<string, any>) => void;
  
  /**
   * Optional custom wrapper element (defaults to div)
   */
  wrapperElement?: keyof React.JSX.IntrinsicElements;
  
  /**
   * Optional additional props to pass to the wrapper element
   */
  wrapperProps?: Record<string, any>;
}

/**
 * Base container renderer props
 */
export interface BaseContainerRendererProps {
  component: { props: ContainerProps };
  children: React.ReactNode;
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
  onClick?: () => void;
}

/**
 * Creates a base container renderer with optional customizations
 * 
 * This renderer provides:
 * - Absolute positioning container (position: relative)
 * - Background color/image support
 * - Border styling (all border properties)
 * - Padding support
 * - Min/max width/height
 * - Z-index support
 * - onClick event handling
 * 
 * Children are expected to be absolutely positioned within this container.
 */
export function createBaseContainerRenderer(
  options: BaseContainerRendererOptions = {}
): React.FC<BaseContainerRendererProps> {
  const {
    styleExtensions = {},
    onClick: customOnClick,
    wrapperElement = 'div',
    wrapperProps = {},
  } = options;

  return function BaseContainerRenderer({
    component,
    children,
    mode,
    actions,
    evaluationScope,
    onClick: externalOnClick,
  }: BaseContainerRendererProps) {
    const p = component.props;

    // Cascading text styles: read parent inherited styles, merge with this container's overrides
    const parentStyles = useInheritedStyles();
    const mergedStyles = mergeInheritedStyles(parentStyles, {
      textColor: p.textColor,
      textFontSize: p.textFontSize,
      textFontWeight: p.textFontWeight,
      textFontFamily: p.textFontFamily,
    });

    // Evaluate all props at the top level (hooks must be called unconditionally)
    const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
    const backgroundImage = useJavaScriptRenderer(p.backgroundImage, evaluationScope, '');
    const backgroundSize = useJavaScriptRenderer((p as any).backgroundSize, evaluationScope, 'cover');
    const backgroundPosition = useJavaScriptRenderer((p as any).backgroundPosition, evaluationScope, 'center');
    const backgroundRepeat = useJavaScriptRenderer((p as any).backgroundRepeat, evaluationScope, 'no-repeat');
    const backgroundOverlay = useJavaScriptRenderer((p as any).backgroundOverlay, evaluationScope, '');
    const backgroundAttachment = useJavaScriptRenderer((p as any).backgroundAttachment, evaluationScope, 'scroll');
    const overflow = useJavaScriptRenderer((p as any).overflow, evaluationScope, 'visible');
    const position = useJavaScriptRenderer((p as any).position, evaluationScope, '');
    const positionTop = useJavaScriptRenderer((p as any).positionTop, evaluationScope, undefined);
    const positionBottom = useJavaScriptRenderer((p as any).positionBottom, evaluationScope, undefined);
    const positionLeft = useJavaScriptRenderer((p as any).positionLeft, evaluationScope, undefined);
    const positionRight = useJavaScriptRenderer((p as any).positionRight, evaluationScope, undefined);
    const semanticTag = useJavaScriptRenderer((p as any).semanticTag, evaluationScope, '');
    const opacity = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
    const boxShadow = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
    const padding = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
    const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, undefined);
    const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, undefined);
    const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, undefined);
    const borderTop = useJavaScriptRenderer(p.borderTop, evaluationScope, undefined);
    const borderRight = useJavaScriptRenderer(p.borderRight, evaluationScope, undefined);
    const borderBottom = useJavaScriptRenderer(p.borderBottom, evaluationScope, undefined);
    const borderLeft = useJavaScriptRenderer(p.borderLeft, evaluationScope, undefined);
    const borderStyle = useJavaScriptRenderer(p.borderStyle, evaluationScope, undefined);
    const zIndex = useJavaScriptRenderer(p.zIndex, evaluationScope, undefined);
    const className = useJavaScriptRenderer(p.className, evaluationScope, undefined);
    const tooltip = useJavaScriptRenderer(p.tooltip, evaluationScope, undefined);
    
    // Build border and spacing styles
    const borderStyles = buildBorderStyles(
      { ...p, borderStyle } as any,
      borderRadius,
      borderWidth,
      borderColor,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft
    );
    const spacingStyles = buildSpacingStyles(padding, undefined);
    
    // Build background style
    let backgroundStyle: React.CSSProperties = {};
    if (backgroundImage) {
      backgroundStyle.backgroundImage = `url(${backgroundImage})`;
      backgroundStyle.backgroundSize = String(backgroundSize || 'cover');
      backgroundStyle.backgroundPosition = String(backgroundPosition || 'center');
      backgroundStyle.backgroundRepeat = String(backgroundRepeat || 'no-repeat');
      if (backgroundAttachment && backgroundAttachment !== 'scroll') {
        backgroundStyle.backgroundAttachment = String(backgroundAttachment);
      }
    } else if (backgroundColor) {
      backgroundStyle.backgroundColor = backgroundColor;
    }
    
    // Evaluate min/max dimensions
    const minWidth = useJavaScriptRenderer(p.minWidth, evaluationScope, undefined);
    const maxWidth = useJavaScriptRenderer(p.maxWidth, evaluationScope, undefined);
    const minHeight = useJavaScriptRenderer(p.minHeight, evaluationScope, undefined);
    const maxHeight = useJavaScriptRenderer(p.maxHeight, evaluationScope, undefined);

    // Evaluate flex container properties
    const flexDirection = useJavaScriptRenderer((p as any).flexDirection, evaluationScope, 'column') as FlexDirection;
    const flexWrap = useJavaScriptRenderer((p as any).flexWrap, evaluationScope, 'nowrap') as FlexWrap;
    const justifyContent = useJavaScriptRenderer((p as any).justifyContent, evaluationScope, 'flex-start') as JustifyContent;
    const alignItems = useJavaScriptRenderer((p as any).alignItems, evaluationScope, 'stretch') as AlignItems;
    const gap = useJavaScriptRenderer((p as any).gap, evaluationScope, '12px');

    // Get custom style extensions
    const customStyles = typeof styleExtensions === 'function'
      ? styleExtensions(p, evaluationScope)
      : styleExtensions;

    // Build container style - flex layout container
    // Width and height come from the parent RenderedComponent wrapper, not from here
    // The container should fill its allocated space
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: flexDirection || 'column',
      flexWrap: flexWrap || 'nowrap',
      justifyContent: justifyContent || 'flex-start',
      alignItems: alignItems || 'stretch',
      gap: typeof gap === 'number' ? `${gap}px` : (gap || '12px'),
      width: '100%', // Fill the width allocated by parent
      height: '100%', // Fill the height allocated by parent
      boxSizing: 'border-box',
      ...backgroundStyle,
      opacity,
      boxShadow: boxShadow || undefined,
      ...spacingStyles,
      ...borderStyles,
      ...(zIndex !== undefined && { zIndex }),
      ...(minWidth !== undefined && { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }),
      ...(maxWidth !== undefined && { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }),
      ...(minHeight !== undefined && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
      ...(maxHeight !== undefined && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
      overflow: String(overflow || 'visible') as any, // Allow content to be visible; Canvas/page handles scrolling
      ...(position && position !== 'static' && { position: position as React.CSSProperties['position'] }),
      ...(positionTop !== undefined && { top: String(positionTop) }),
      ...(positionBottom !== undefined && { bottom: String(positionBottom) }),
      ...(positionLeft !== undefined && { left: String(positionLeft) }),
      ...(positionRight !== undefined && { right: String(positionRight) }),
      ...customStyles, // Apply custom style extensions last
    };
    
    // Handle onClick event
    const handleClick = () => {
      if (mode === 'preview' && p.onClick && actions) {
        try {
          // Evaluate onClick expression in the evaluation scope with actions available
          const clickScope = { ...evaluationScope, actions };
          const onClickValue = p.onClick;
          if (typeof onClickValue === 'string') {
            // Handle expression format {{ ... }}
            const { safeEval } = require('../../expressions/engine') as { safeEval: (expr: string, scope: any) => any };
            const expression = onClickValue.startsWith('{{') && onClickValue.endsWith('}}')
              ? onClickValue.substring(2, onClickValue.length - 2).trim()
              : onClickValue;
            safeEval(expression, clickScope);
          }
        } catch (error) {
          console.error('Error executing container onClick:', error);
        }
      }
      
      // Call custom onClick if provided
      if (customOnClick) {
        customOnClick(p, actions, evaluationScope);
      }
      
      // Call external onClick if provided
      if (externalOnClick) {
        externalOnClick();
      }
    };
    
    const resolvedTag = (semanticTag && semanticTag !== 'div') ? semanticTag : wrapperElement;
    const WrapperElement = resolvedTag as any;
    
    return (
      <WrapperElement
        style={{
          ...containerStyle,
          ...(!containerStyle.position && (backgroundOverlay && backgroundImage) ? { position: 'relative' as const } : {}),
        }}
        className={className}
        title={tooltip}
        onClick={handleClick}
        {...wrapperProps}
      >
        {backgroundOverlay && backgroundImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: String(backgroundOverlay),
              pointerEvents: 'none',
              zIndex: 0,
              borderRadius: containerStyle.borderRadius,
            }}
          />
        )}
        <InheritedStylesProvider value={mergedStyles}>
        <div style={{ position: (backgroundOverlay && backgroundImage) ? 'relative' as const : undefined, zIndex: (backgroundOverlay && backgroundImage) ? 1 : undefined, display: 'contents' }}>
          {children}
        </div>
        {React.Children.toArray(children).length === 0 && (
          <div style={{
            border: `1px dashed ${mode === 'preview' ? '#d1d5db' : '#d1d5db80'}`,
            borderRadius: '4px',
            padding: mode === 'preview' ? '12px' : '8px',
            textAlign: 'center',
            color: mode === 'preview' ? '#9ca3af' : '#9ca3af99',
            fontSize: mode === 'preview' ? '12px' : '11px',
            minHeight: mode === 'preview' ? '40px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            Empty container
          </div>
        )}
        </InheritedStylesProvider>
      </WrapperElement>
    );
  };
}

/**
 * Default base container renderer (no customizations)
 * Can be used directly or as a reference implementation
 */
export const BaseContainerRenderer = createBaseContainerRenderer();

