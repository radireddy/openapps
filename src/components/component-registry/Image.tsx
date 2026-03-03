import React, { useState, useCallback } from 'react';
import { ComponentType, ImageProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { useDisplayStyle } from './useDisplayStyle';
import { safeEval } from '../../expressions/engine';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/** Shadow presets matching theme.shadow tokens */
const HOVER_SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
};

const ImageRenderer: React.FC<{
  component: { props: ImageProps };
  evaluationScope: Record<string, any>;
  mode?: 'edit' | 'preview';
  actions?: Record<string, any>;
}> = ({ component, evaluationScope, mode, actions }) => {
  const p = component.props;

  // Evaluate expression-supported properties
  const src = useJavaScriptRenderer(p.src, evaluationScope, 'https://picsum.photos/200/200');
  const alt = useJavaScriptRenderer(p.alt, evaluationScope, 'Image');
  const fallbackSrc = useJavaScriptRenderer(p.fallbackSrc, evaluationScope, '');
  const caption = useJavaScriptRenderer(p.caption, evaluationScope, '');

  const { borderShadowStyle } = useDisplayStyle(p, evaluationScope);

  // Loading/error state
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
    }
  }, [hasError, fallbackSrc]);

  // Hover state
  const [isHovered, setIsHovered] = useState(false);
  const hoverScale = p.hoverScale ?? 1;
  const hoverOpacity = p.hoverOpacity ?? 100;
  const hoverShadow = p.hoverShadow ?? 'none';
  const hasHoverEffect = hoverScale !== 1 || hoverOpacity !== 100 || hoverShadow !== 'none';

  // Filters
  const filterBlur = p.filterBlur ?? 0;
  const filterGrayscale = p.filterGrayscale ?? 0;
  const filterBrightness = p.filterBrightness ?? 100;
  const hasFilter = filterBlur !== 0 || filterGrayscale !== 0 || filterBrightness !== 100;
  const filterString = hasFilter
    ? `blur(${filterBlur}px) grayscale(${filterGrayscale}%) brightness(${filterBrightness}%)`
    : undefined;

  // Click handler
  const hasClick = !!(p.onClick);
  const handleClick = useCallback(() => {
    if (p.onClick && mode === 'preview') {
      const clickScope = { ...evaluationScope, actions };
      safeEval(p.onClick.replace(/^\{\{|\}\}$/g, '').trim(), clickScope);
    }
  }, [p.onClick, mode, evaluationScope, actions]);

  // Aspect ratio
  const aspectRatio = p.aspectRatio && p.aspectRatio !== 'auto' ? p.aspectRatio : undefined;

  // When the component height is 'auto', the RenderedComponent wrapper has height:auto.
  // In CSS block flow, children with height:100% don't resolve against flex-shrunk parents.
  // So we only use height:100% when an explicit height exists; otherwise let the image
  // determine its natural height.
  const isAutoHeight = !p.height || String(p.height).trim() === 'auto';

  // Image styles
  const imgStyle: React.CSSProperties = {
    ...borderShadowStyle,
    borderStyle: p.borderStyle,
    objectFit: p.objectFit,
    objectPosition: p.objectPosition || 'center',
    ...(filterString ? { filter: filterString } : {}),
    transition: hasHoverEffect ? 'transform 300ms ease, opacity 300ms ease, box-shadow 300ms ease' : undefined,
    ...(isHovered && hasHoverEffect
      ? {
          transform: hoverScale !== 1 ? `scale(${hoverScale})` : undefined,
          opacity: hoverOpacity !== 100 ? hoverOpacity / 100 : borderShadowStyle.opacity,
          boxShadow: hoverShadow !== 'none' ? HOVER_SHADOW_MAP[hoverShadow] : borderShadowStyle.boxShadow,
        }
      : {}),
    cursor: hasClick ? 'pointer' : undefined,
  };

  // Container styles — height:100% only when the component has an explicit height,
  // overflow:hidden only when needed (hover effects or aspect ratio)
  const needsOverflowClip = hasHoverEffect || !!aspectRatio;
  const containerStyle: React.CSSProperties = {
    width: '100%',
    ...(isAutoHeight ? {} : { height: '100%' }),
    overflow: needsOverflowClip ? 'hidden' : 'visible',
    position: 'relative',
    ...(aspectRatio ? { aspectRatio } : {}),
  };

  // Skeleton placeholder
  const showSkeleton = p.placeholder === 'skeleton' && !isLoaded;

  const imgElement = (
    <>
      {showSkeleton && (
        <div
          data-testid="image-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#e5e7eb',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading={p.loading || 'lazy'}
        style={imgStyle}
        className={isAutoHeight ? 'w-full' : 'w-full h-full'}
        onLoad={handleLoad}
        onError={handleError}
        onClick={hasClick ? handleClick : undefined}
        onMouseEnter={hasHoverEffect ? () => setIsHovered(true) : undefined}
        onMouseLeave={hasHoverEffect ? () => setIsHovered(false) : undefined}
      />
    </>
  );

  // Caption styles
  const captionBelowStyle: React.CSSProperties = {
    padding: '4px 0',
    fontSize: '0.875rem',
    color: 'inherit',
  };

  const captionOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#fff',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
  };

  // Render with or without caption
  if (caption) {
    return (
      <figure style={{ ...containerStyle, margin: 0 }}>
        {imgElement}
        <figcaption
          style={p.captionPosition === 'overlay-bottom' ? captionOverlayStyle : captionBelowStyle}
        >
          {caption}
        </figcaption>
      </figure>
    );
  }

  return <div style={containerStyle}>{imgElement}</div>;
};

export const ImagePlugin: ComponentPlugin = {
  type: ComponentType.IMAGE,
  paletteConfig: {
    label: 'Image',
    icon: React.createElement(
      'svg',
      { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('rect', { x: '4', y: '4', width: '16', height: '16', rx: '2', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('circle', { cx: '10', cy: '10', r: '2', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('path', { d: 'M14 16L12 14L4 20', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
    ),
    defaultProps: {
      ...commonStylingProps,
      src: 'https://picsum.photos/200/200',
      alt: 'Placeholder Image',
      width: '100%',
      height: 200,
      objectFit: 'cover',
      objectPosition: 'center',
      aspectRatio: 'auto',
      loading: 'lazy',
      placeholder: 'none',
      filterBlur: 0,
      filterGrayscale: 0,
      filterBrightness: 100,
      hoverScale: 1,
      hoverOpacity: 100,
      hoverShadow: 'none',
      captionPosition: 'below',
      backgroundColor: '{{theme.colors.surfaceVariant}}',
    },
  },
  renderer: ImageRenderer,
  properties: () => null,
};
