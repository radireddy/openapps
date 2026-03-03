import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  InheritedStyles,
  InheritedStylesProvider,
  useInheritedStyles,
  mergeInheritedStyles,
  buildPageInheritedStyles,
} from '../InheritedStylesContext';
import { AppPage } from '../../types';

// Helper component that renders inherited styles as JSON for assertions
const StyleConsumer: React.FC = () => {
  const styles = useInheritedStyles();
  return <div data-testid="styles">{JSON.stringify(styles)}</div>;
};

describe('mergeInheritedStyles', () => {
  test('returns empty values when both parent and overrides are empty', () => {
    const result = mergeInheritedStyles({}, {});
    expect(result).toEqual({
      textColor: undefined,
      textFontSize: undefined,
      textFontWeight: undefined,
      textFontFamily: undefined,
    });
  });

  test('preserves parent values when overrides are empty', () => {
    const parent: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    };
    const result = mergeInheritedStyles(parent, {});
    expect(result).toEqual({
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    });
  });

  test('overrides replace parent values when provided', () => {
    const parent: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    };
    const overrides: Partial<InheritedStyles> = {
      textColor: 'blue',
      textFontSize: '20px',
      textFontWeight: '400',
      textFontFamily: 'Helvetica',
    };
    const result = mergeInheritedStyles(parent, overrides);
    expect(result).toEqual({
      textColor: 'blue',
      textFontSize: '20px',
      textFontWeight: '400',
      textFontFamily: 'Helvetica',
    });
  });

  test('partial overrides only replace specified values', () => {
    const parent: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    };
    const overrides: Partial<InheritedStyles> = {
      textColor: 'blue',
      textFontFamily: 'Helvetica',
    };
    const result = mergeInheritedStyles(parent, overrides);
    expect(result).toEqual({
      textColor: 'blue',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Helvetica',
    });
  });

  test('empty string overrides fall back to parent values', () => {
    const parent: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
    };
    const overrides: Partial<InheritedStyles> = {
      textColor: '',
      textFontSize: '',
    };
    const result = mergeInheritedStyles(parent, overrides);
    expect(result.textColor).toBe('red');
    expect(result.textFontSize).toBe('16px');
  });
});

describe('useInheritedStyles', () => {
  test('returns empty object when used without a provider', () => {
    render(<StyleConsumer />);
    const styles = JSON.parse(screen.getByTestId('styles').textContent!);
    expect(styles).toEqual({});
  });

  test('returns provided values when wrapped in a provider', () => {
    const value: InheritedStyles = {
      textColor: '#333',
      textFontSize: '14px',
      textFontWeight: '600',
      textFontFamily: 'sans-serif',
    };
    render(
      <InheritedStylesProvider value={value}>
        <StyleConsumer />
      </InheritedStylesProvider>
    );
    const styles = JSON.parse(screen.getByTestId('styles').textContent!);
    expect(styles).toEqual(value);
  });

  test('returns partial values when provider only sets some properties', () => {
    const value: InheritedStyles = {
      textColor: '#333',
    };
    render(
      <InheritedStylesProvider value={value}>
        <StyleConsumer />
      </InheritedStylesProvider>
    );
    const styles = JSON.parse(screen.getByTestId('styles').textContent!);
    expect(styles.textColor).toBe('#333');
    expect(styles.textFontSize).toBeUndefined();
  });
});

describe('nested InheritedStylesProvider', () => {
  test('child provider overrides parent values', () => {
    const parentValue: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    };
    const childValue: InheritedStyles = {
      textColor: 'blue',
      textFontSize: '20px',
      textFontWeight: '400',
      textFontFamily: 'Helvetica',
    };
    render(
      <InheritedStylesProvider value={parentValue}>
        <InheritedStylesProvider value={childValue}>
          <StyleConsumer />
        </InheritedStylesProvider>
      </InheritedStylesProvider>
    );
    const styles = JSON.parse(screen.getByTestId('styles').textContent!);
    expect(styles).toEqual(childValue);
  });

  test('child provider can partially override parent with merged styles', () => {
    const parentValue: InheritedStyles = {
      textColor: 'red',
      textFontSize: '16px',
      textFontWeight: 'bold',
      textFontFamily: 'Arial',
    };
    // Simulate how containers merge: child overrides only textColor
    const mergedValue = mergeInheritedStyles(parentValue, { textColor: 'blue' });
    render(
      <InheritedStylesProvider value={parentValue}>
        <InheritedStylesProvider value={mergedValue}>
          <StyleConsumer />
        </InheritedStylesProvider>
      </InheritedStylesProvider>
    );
    const styles = JSON.parse(screen.getByTestId('styles').textContent!);
    expect(styles.textColor).toBe('blue');
    expect(styles.textFontSize).toBe('16px');
    expect(styles.textFontWeight).toBe('bold');
    expect(styles.textFontFamily).toBe('Arial');
  });
});

describe('buildPageInheritedStyles', () => {
  test('returns all undefined when page is undefined', () => {
    const result = buildPageInheritedStyles(undefined);
    expect(result).toEqual({
      textColor: undefined,
      textFontSize: undefined,
      textFontWeight: undefined,
      textFontFamily: undefined,
    });
  });

  test('returns all undefined when page has no text properties', () => {
    const page: AppPage = { id: 'page_1', name: 'Home' };
    const result = buildPageInheritedStyles(page);
    expect(result).toEqual({
      textColor: undefined,
      textFontSize: undefined,
      textFontWeight: undefined,
      textFontFamily: undefined,
    });
  });

  test('extracts text properties from page', () => {
    const page: AppPage = {
      id: 'page_1',
      name: 'Styled Page',
      textColor: '#222',
      textFontSize: '18px',
      textFontWeight: '700',
      textFontFamily: 'Georgia',
    };
    const result = buildPageInheritedStyles(page);
    expect(result).toEqual({
      textColor: '#222',
      textFontSize: '18px',
      textFontWeight: '700',
      textFontFamily: 'Georgia',
    });
  });

  test('handles partial text properties on page', () => {
    const page: AppPage = {
      id: 'page_1',
      name: 'Partial',
      textColor: '#444',
      textFontFamily: 'monospace',
    };
    const result = buildPageInheritedStyles(page);
    expect(result.textColor).toBe('#444');
    expect(result.textFontSize).toBeUndefined();
    expect(result.textFontWeight).toBeUndefined();
    expect(result.textFontFamily).toBe('monospace');
  });

  test('converts empty string page properties to undefined', () => {
    const page = {
      id: 'page_1',
      name: 'Empty Strings',
      textColor: '',
      textFontSize: '',
      textFontWeight: '',
      textFontFamily: '',
    } as AppPage;
    const result = buildPageInheritedStyles(page);
    expect(result.textColor).toBeUndefined();
    expect(result.textFontSize).toBeUndefined();
    expect(result.textFontWeight).toBeUndefined();
    expect(result.textFontFamily).toBeUndefined();
  });
});
