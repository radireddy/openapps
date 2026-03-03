import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ImagePlugin } from '@/components/component-registry/Image';
import { ComponentType, ImageProps } from 'types';
import { safeEval } from '@/expressions/engine';

// Mock safeEval so we can track onClick calls without actually executing code
jest.mock('@/expressions/engine', () => ({
  safeEval: jest.fn(),
  parseDependencies: jest.fn().mockReturnValue([]),
}));

const ImageRenderer = ImagePlugin.renderer;
const ImageProperties = ImagePlugin.properties;

/** Helper to build a component object with ImageProps */
function makeComponent(overrides: Partial<ImageProps> = {}) {
  return {
    id: 'image1',
    type: ComponentType.IMAGE,
    props: {
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      src: 'https://example.com/photo.jpg',
      alt: 'Test image',
      objectFit: 'cover' as const,
      ...overrides,
    } as ImageProps,
  };
}

describe('ImagePlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Basic rendering ──────────────────────────────────────────
  describe('Basic rendering', () => {
    it('renders an img element with correct src and alt', () => {
      render(<ImageRenderer component={makeComponent()} evaluationScope={{}} />);
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('applies objectFit style from props', () => {
      render(
        <ImageRenderer
          component={makeComponent({ objectFit: 'contain' })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.objectFit).toBe('contain');
    });

    it('defaults loading attribute to lazy', () => {
      render(<ImageRenderer component={makeComponent()} evaluationScope={{}} />);
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('does not render a figure wrapper when there is no caption', () => {
      const { container } = render(
        <ImageRenderer component={makeComponent()} evaluationScope={{}} />
      );
      expect(container.querySelector('figure')).toBeNull();
      expect(container.querySelector('figcaption')).toBeNull();
    });
  });

  // ─── objectPosition ──────────────────────────────────────────
  describe('objectPosition', () => {
    it('applies the given object-position style', () => {
      render(
        <ImageRenderer
          component={makeComponent({ objectPosition: 'top left' })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.objectPosition).toBe('top left');
    });

    it('defaults object-position to center when not specified', () => {
      render(
        <ImageRenderer
          component={makeComponent({ objectPosition: undefined })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.objectPosition).toBe('center');
    });
  });

  // ─── aspectRatio ─────────────────────────────────────────────
  describe('aspectRatio', () => {
    it('applies aspect-ratio to the container div when set', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({ aspectRatio: '16/9' })}
          evaluationScope={{}}
        />
      );
      // The container is a div wrapping the img (no caption => div, not figure)
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.aspectRatio).toBe('16/9');
    });

    it('does not apply aspect-ratio when value is "auto"', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({ aspectRatio: 'auto' })}
          evaluationScope={{}}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.aspectRatio).toBeFalsy();
    });
  });

  // ─── loading attribute ───────────────────────────────────────
  describe('loading', () => {
    it('respects eager loading setting', () => {
      render(
        <ImageRenderer
          component={makeComponent({ loading: 'eager' })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  // ─── Filters ─────────────────────────────────────────────────
  describe('filters', () => {
    it('builds a correct CSS filter string from blur, grayscale, brightness', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            filterBlur: 5,
            filterGrayscale: 50,
            filterBrightness: 120,
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.filter).toBe('blur(5px) grayscale(50%) brightness(120%)');
    });

    it('does not apply filter when all values are defaults', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            filterBlur: 0,
            filterGrayscale: 0,
            filterBrightness: 100,
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.filter).toBe('');
    });

    it('applies filter when only blur is non-default', () => {
      render(
        <ImageRenderer
          component={makeComponent({ filterBlur: 3 })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.filter).toBe('blur(3px) grayscale(0%) brightness(100%)');
    });
  });

  // ─── Hover effects ──────────────────────────────────────────
  describe('hover effects', () => {
    it('applies scale/opacity/shadow on mouseEnter and reverts on mouseLeave', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            hoverScale: 1.1,
            hoverOpacity: 80,
            hoverShadow: 'md',
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');

      // Before hover: should have transition but no transform
      expect(img.style.transition).toContain('transform');
      expect(img.style.transform).toBe('');

      // Hover: apply effects
      fireEvent.mouseEnter(img);
      expect(img.style.transform).toBe('scale(1.1)');
      expect(img.style.opacity).toBe('0.8');
      expect(img.style.boxShadow).toBeTruthy();

      // Leave: revert
      fireEvent.mouseLeave(img);
      expect(img.style.transform).toBe('');
    });

    it('does not attach hover listeners when all hover values are defaults', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            hoverScale: 1,
            hoverOpacity: 100,
            hoverShadow: 'none',
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      // The transition property should not be set when there are no hover effects
      expect(img.style.transition).toBe('');
    });
  });

  // ─── Error fallback ──────────────────────────────────────────
  describe('error fallback', () => {
    it('switches to fallbackSrc on img error event', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            src: 'https://example.com/broken.jpg',
            fallbackSrc: 'https://example.com/fallback.jpg',
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('src', 'https://example.com/broken.jpg');

      fireEvent.error(img);
      expect(img).toHaveAttribute('src', 'https://example.com/fallback.jpg');
    });

    it('does not switch src when no fallbackSrc is provided', () => {
      render(
        <ImageRenderer
          component={makeComponent({
            src: 'https://example.com/broken.jpg',
          })}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      fireEvent.error(img);
      // src should remain unchanged
      expect(img).toHaveAttribute('src', 'https://example.com/broken.jpg');
    });
  });

  // ─── Skeleton placeholder ────────────────────────────────────
  describe('skeleton placeholder', () => {
    it('shows skeleton div when placeholder is "skeleton" and image is not loaded', () => {
      render(
        <ImageRenderer
          component={makeComponent({ placeholder: 'skeleton' })}
          evaluationScope={{}}
        />
      );
      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();
    });

    it('hides skeleton after onLoad fires', () => {
      render(
        <ImageRenderer
          component={makeComponent({ placeholder: 'skeleton' })}
          evaluationScope={{}}
        />
      );
      expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();

      const img = screen.getByAltText('Test image');
      fireEvent.load(img);
      expect(screen.queryByTestId('image-skeleton')).toBeNull();
    });

    it('does not show skeleton when placeholder is "none"', () => {
      render(
        <ImageRenderer
          component={makeComponent({ placeholder: 'none' })}
          evaluationScope={{}}
        />
      );
      expect(screen.queryByTestId('image-skeleton')).toBeNull();
    });
  });

  // ─── onClick ─────────────────────────────────────────────────
  describe('onClick', () => {
    it('sets cursor to pointer when onClick is defined', () => {
      render(
        <ImageRenderer
          component={makeComponent({ onClick: '{{alert("hi")}}' })}
          evaluationScope={{}}
          mode="preview"
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.cursor).toBe('pointer');
    });

    it('calls safeEval with stripped expression in preview mode', () => {
      const scope = { myVar: 42 };
      const actions = { doStuff: jest.fn() };
      render(
        <ImageRenderer
          component={makeComponent({ onClick: '{{alert("clicked")}}' })}
          evaluationScope={scope}
          mode="preview"
          actions={actions}
        />
      );
      const img = screen.getByAltText('Test image');
      fireEvent.click(img);

      expect(safeEval).toHaveBeenCalledTimes(1);
      // The handler strips {{ }} wrappers before calling safeEval
      expect(safeEval).toHaveBeenCalledWith(
        'alert("clicked")',
        expect.objectContaining({ myVar: 42, actions })
      );
    });

    it('does not call safeEval when mode is edit', () => {
      render(
        <ImageRenderer
          component={makeComponent({ onClick: '{{alert("clicked")}}' })}
          evaluationScope={{}}
          mode="edit"
        />
      );
      const img = screen.getByAltText('Test image');
      fireEvent.click(img);

      expect(safeEval).not.toHaveBeenCalled();
    });

    it('does not set cursor to pointer when onClick is not defined', () => {
      render(
        <ImageRenderer
          component={makeComponent()}
          evaluationScope={{}}
        />
      );
      const img = screen.getByAltText('Test image');
      expect(img.style.cursor).toBe('');
    });
  });

  // ─── Caption below ──────────────────────────────────────────
  describe('caption below', () => {
    it('renders a figure element with figcaption containing caption text', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({
            caption: 'A beautiful sunset',
            captionPosition: 'below',
          })}
          evaluationScope={{}}
        />
      );
      const figure = container.querySelector('figure');
      expect(figure).toBeInTheDocument();

      const figcaption = container.querySelector('figcaption');
      expect(figcaption).toBeInTheDocument();
      expect(figcaption!.textContent).toBe('A beautiful sunset');
    });

    it('below caption does not have position absolute', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({
            caption: 'Caption text',
            captionPosition: 'below',
          })}
          evaluationScope={{}}
        />
      );
      const figcaption = container.querySelector('figcaption') as HTMLElement;
      expect(figcaption.style.position).not.toBe('absolute');
    });
  });

  // ─── Caption overlay ────────────────────────────────────────
  describe('caption overlay', () => {
    it('renders figcaption with position:absolute for overlay-bottom', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({
            caption: 'Overlay caption',
            captionPosition: 'overlay-bottom',
          })}
          evaluationScope={{}}
        />
      );
      const figcaption = container.querySelector('figcaption') as HTMLElement;
      expect(figcaption).toBeInTheDocument();
      expect(figcaption.style.position).toBe('absolute');
      expect(figcaption.textContent).toBe('Overlay caption');
    });

    it('overlay caption has bottom:0 positioning', () => {
      const { container } = render(
        <ImageRenderer
          component={makeComponent({
            caption: 'Bottom overlay',
            captionPosition: 'overlay-bottom',
          })}
          evaluationScope={{}}
        />
      );
      const figcaption = container.querySelector('figcaption') as HTMLElement;
      expect(figcaption.style.bottom).toBe('0px');
    });
  });

  // ─── Backward compatibility ──────────────────────────────────
  describe('backward compatibility', () => {
    it('renders correctly with only legacy props (src, alt, objectFit)', () => {
      const legacyComponent = {
        id: 'img-legacy',
        type: ComponentType.IMAGE,
        props: {
          x: 10,
          y: 20,
          width: 150,
          height: 100,
          src: 'https://example.com/legacy.jpg',
          alt: 'Legacy image',
          objectFit: 'contain' as const,
        },
      };
      render(<ImageRenderer component={legacyComponent} evaluationScope={{}} />);
      const img = screen.getByAltText('Legacy image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/legacy.jpg');
      expect(img.style.objectFit).toBe('contain');
      expect(img).toHaveAttribute('loading', 'lazy');
      // No skeleton, no caption, no hover, no filter
      expect(screen.queryByTestId('image-skeleton')).toBeNull();
      expect(img.style.filter).toBe('');
      expect(img.style.cursor).toBe('');
    });
  });

  // ─── Properties ──────────────────────────────────────────────
  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<ImageProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});
