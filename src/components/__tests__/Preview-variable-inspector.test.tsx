/**
 * Preview Variable Inspector Tests
 *
 * Tests for IMP-011: Variable Inspector/Debug Panel in Preview mode
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppDefinition } from '../../types';

// Mock useUiPathSDK
jest.mock('../../hooks/useUiPathSDK', () => ({
  useUiPathSDK: () => ({
    uipath: null,
    error: null,
    isInitializing: false,
  }),
}));

// Mock useQueryExecution
jest.mock('../../hooks/useQueryExecution', () => ({
  useQueryExecution: () => ({
    runQuery: jest.fn(),
  }),
}));

// Mock the responsive module
jest.mock('@/responsive', () => ({
  generateMediaQueryCSS: () => '',
  generateGlobalBaseStyles: () => '',
}));

// Mock buildEvaluationScope
jest.mock('../../hooks/state/evaluationScope', () => ({
  buildEvaluationScope: () => ({
    theme: {
      colors: {
        primary: '#4F46E5',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#1A1A1A',
        border: '#D1D1D1',
      },
    },
    dataStore: {},
    variables: {},
    actions: {},
  }),
}));

// Import Preview after mocks are set up
import { Preview } from '../Preview';

function createMinimalAppDefinition(): AppDefinition {
  return {
    id: 'test-app',
    name: 'Test App',
    pages: [{ id: 'page-1', name: 'Main' }],
    mainPageId: 'page-1',
    components: [],
    dataStore: { selectedRecord: null },
    variables: [],
    theme: {
      colors: {
        primary: '#4F46E5',
        onPrimary: '#FFFFFF',
        secondary: '#06B6D4',
        onSecondary: '#FFFFFF',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#1A1A1A',
        border: '#D1D1D1',
      },
      font: { family: 'Segoe UI, sans-serif' },
      border: { width: '1px', style: 'solid' },
      radius: { default: '4px' },
      spacing: { sm: '4px', md: '8px', lg: '16px' },
    },
  };
}

const defaultActions = {
  set: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  del: jest.fn(),
  submitForm: jest.fn(),
  navigateTo: jest.fn(),
  runQuery: jest.fn(),
};

describe('IMP-011: Variable Inspector', () => {

  it('shows variable inspector toggle button in preview', () => {
    render(
      <Preview
        appDefinition={createMinimalAppDefinition()}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={{}}
      />
    );

    expect(screen.getByText('Variable Inspector')).toBeInTheDocument();
  });

  it('inspector panel is collapsed by default', () => {
    render(
      <Preview
        appDefinition={createMinimalAppDefinition()}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={{ counter: 5 }}
      />
    );

    // The toggle button should have aria-expanded=false
    const toggleButton = screen.getByText('Variable Inspector').closest('button')!;
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // The pre element with variable data should not be in the DOM
    expect(screen.queryByTestId('variable-inspector')).not.toBeInTheDocument();
  });

  it('shows variable values when inspector is expanded', () => {
    const variableState = { counter: 5, userName: 'Alice', isActive: true };

    render(
      <Preview
        appDefinition={createMinimalAppDefinition()}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={variableState}
      />
    );

    // Click the toggle to expand
    const toggleButton = screen.getByText('Variable Inspector').closest('button')!;
    fireEvent.click(toggleButton);

    // Verify the inspector is now expanded
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Verify the JSON is displayed
    const inspector = screen.getByTestId('variable-inspector');
    expect(inspector).toBeInTheDocument();
    expect(inspector.textContent).toContain('"counter": 5');
    expect(inspector.textContent).toContain('"userName": "Alice"');
    expect(inspector.textContent).toContain('"isActive": true');
  });

  it('shows ephemeral state notice in preview', () => {
    render(
      <Preview
        appDefinition={createMinimalAppDefinition()}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={{}}
      />
    );

    expect(
      screen.getByText(/variable changes reset when returning to editor/i)
    ).toBeInTheDocument();
  });

  it('collapses inspector panel when toggle is clicked again', () => {
    render(
      <Preview
        appDefinition={createMinimalAppDefinition()}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={{ x: 1 }}
      />
    );

    const toggleButton = screen.getByText('Variable Inspector').closest('button')!;

    // Expand
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('variable-inspector')).toBeInTheDocument();

    // Collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByTestId('variable-inspector')).not.toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
