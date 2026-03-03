/**
 * Preview UiPath SDK Warning Tests
 *
 * Verifies that the Preview component does not log a console.warn
 * about UiPath SDK initialisation when integration settings are empty
 * or missing.
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppDefinition } from '../../types';

// Mock useUiPathSDK to simulate an SDK error without actually loading the SDK
jest.mock('../../hooks/useUiPathSDK', () => ({
  useUiPathSDK: () => ({
    uipath: null,
    error: 'Integration settings are incomplete. Please configure all fields in the Integration tab.',
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

function createMinimalAppDefinition(
  integration?: AppDefinition['integration']
): AppDefinition {
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
    integration,
  };
}

describe('Preview UiPath SDK', () => {
  it('does not log warning when integration settings are empty', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Render with no integration settings at all
    render(
      <Preview
        appDefinition={createMinimalAppDefinition(undefined)}
        onUpdateDataStore={jest.fn()}
        actions={{
          set: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
          del: jest.fn(),
          submitForm: jest.fn(),
          navigateTo: jest.fn(),
          runQuery: jest.fn(),
        }}
        variableState={{}}
      />
    );

    // console.warn should not have been called with UiPath SDK message
    const sdkWarnings = warnSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('UiPath SDK')
    );
    expect(sdkWarnings).toHaveLength(0);

    warnSpy.mockRestore();
  });

  it('does not log warning when integration settings have no configured values', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Render with empty string integration settings
    render(
      <Preview
        appDefinition={createMinimalAppDefinition({
          accountName: '',
          tenantName: '',
          clientId: '',
          scope: '',
        })}
        onUpdateDataStore={jest.fn()}
        actions={{
          set: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
          del: jest.fn(),
          submitForm: jest.fn(),
          navigateTo: jest.fn(),
          runQuery: jest.fn(),
        }}
        variableState={{}}
      />
    );

    const sdkWarnings = warnSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('UiPath SDK')
    );
    expect(sdkWarnings).toHaveLength(0);

    warnSpy.mockRestore();
  });
});
