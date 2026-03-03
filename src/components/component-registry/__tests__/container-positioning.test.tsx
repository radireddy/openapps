import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../../property-renderers/useJavaScriptRenderer', () => ({
  useJavaScriptRenderer: (value: any, _scope: any, defaultValue: any) => value ?? defaultValue,
}));

import { createBaseContainerRenderer } from '../base-container';

const BaseContainer = createBaseContainerRenderer();

describe('Container positioning', () => {
  const baseProps = {
    backgroundColor: '#fff',
    width: '100%',
    height: 'auto',
  };

  test('applies sticky position with top offset', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps, position: 'sticky', positionTop: '0px' } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).toBe('sticky');
    expect(el.style.top).toBe('0px');
  });

  test('applies fixed position with top and left', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps, position: 'fixed', positionTop: '0px', positionLeft: '0px' } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).toBe('fixed');
    expect(el.style.top).toBe('0px');
    expect(el.style.left).toBe('0px');
  });

  test('defaults to no explicit position when not set', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).not.toBe('sticky');
    expect(el.style.position).not.toBe('fixed');
  });

  test('renders semantic HTML tag when set', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps, semanticTag: 'nav' } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Nav content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild;
    expect(el?.tagName.toLowerCase()).toBe('nav');
  });

  test('renders as div when semanticTag is not set', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild;
    expect(el?.tagName.toLowerCase()).toBe('div');
  });

  test('applies position bottom offset', () => {
    const { container } = render(
      <BaseContainer
        component={{ props: { ...baseProps, position: 'fixed', positionBottom: '20px', positionRight: '10px' } }}
        mode="preview"
        evaluationScope={{}}
      >
        <div>Content</div>
      </BaseContainer>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).toBe('fixed');
    expect(el.style.bottom).toBe('20px');
    expect(el.style.right).toBe('10px');
  });
});
