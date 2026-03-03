import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('../../../property-renderers/useJavaScriptRenderer', () => ({
  useJavaScriptRenderer: (value: any, _scope: any, defaultValue: any) => value ?? defaultValue,
}));

jest.mock('../../../property-renderers/registry', () => ({
  propertyRendererRegistry: {
    javascript: (value: any) => value ?? '',
    markdown: (value: any) => value ?? '',
    literal: (value: any) => value ?? '',
  },
}));

jest.mock('../useDisplayStyle', () => ({
  useDisplayStyle: () => ({ borderShadowStyle: {} }),
}));

import { LabelPlugin } from '../Label';

const LabelRenderer = LabelPlugin.renderer as React.FC<any>;

describe('Label link/navigation behavior', () => {
  const baseProps = {
    text: 'Click me',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000',
    width: '100%',
    height: 'auto',
  };

  test('renders as anchor tag when href is an external URL', () => {
    const { container } = render(
      <LabelRenderer
        component={{ props: { ...baseProps, href: 'https://example.com' } }}
        evaluationScope={{}}
        mode="preview"
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  test('does not render as anchor in edit mode', () => {
    const { container } = render(
      <LabelRenderer
        component={{ props: { ...baseProps, href: 'https://example.com' } }}
        evaluationScope={{}}
        mode="edit"
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeNull();
  });

  test('calls navigateTo for internal page links', () => {
    const navigateTo = jest.fn();
    const { container } = render(
      <LabelRenderer
        component={{ props: { ...baseProps, href: 'page_home' } }}
        evaluationScope={{}}
        mode="preview"
        actions={{ navigateTo }}
      />
    );
    const clickable = container.firstElementChild;
    fireEvent.click(clickable!);
    expect(navigateTo).toHaveBeenCalledWith('page_home');
  });

  test('triggers smooth scroll for anchor href', () => {
    const scrollIntoView = jest.fn();
    const mockElement = { scrollIntoView: scrollIntoView };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

    const { container } = render(
      <LabelRenderer
        component={{ props: { ...baseProps, href: '#section1' } }}
        evaluationScope={{}}
        mode="preview"
      />
    );
    const clickable = container.firstElementChild;
    fireEvent.click(clickable!);
    expect(document.getElementById).toHaveBeenCalledWith('section1');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    (document.getElementById as jest.Mock).mockRestore();
  });

  test('renders without link when href is empty', () => {
    const { container } = render(
      <LabelRenderer
        component={{ props: { ...baseProps } }}
        evaluationScope={{}}
        mode="preview"
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor).toBeNull();
  });
});
