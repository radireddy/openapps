/**
 * Component Ordering Tests (BUG-010)
 *
 * Verifies that root components in both Canvas and Preview are sorted
 * by their `order` property, ensuring consistent rendering order.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppDefinition, ComponentType } from '../../types';

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

import { Preview } from '../Preview';
import { Canvas } from '../Canvas';

function createAppDefinitionWithOrderedComponents(): AppDefinition {
  return {
    id: 'test-app',
    name: 'Test App',
    pages: [{ id: 'page-1', name: 'Main' }],
    mainPageId: 'page-1',
    components: [
      {
        id: 'comp-c',
        type: ComponentType.LABEL,
        pageId: 'page-1',
        parentId: null,
        props: {
          text: 'Third',
          width: '100%',
          height: 'auto',
          order: 2,
        } as any,
      },
      {
        id: 'comp-a',
        type: ComponentType.LABEL,
        pageId: 'page-1',
        parentId: null,
        props: {
          text: 'First',
          width: '100%',
          height: 'auto',
          order: 0,
        } as any,
      },
      {
        id: 'comp-b',
        type: ComponentType.LABEL,
        pageId: 'page-1',
        parentId: null,
        props: {
          text: 'Second',
          width: '100%',
          height: 'auto',
          order: 1,
        } as any,
      },
    ],
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

describe('Component ordering', () => {
  it('Preview sorts root components by order property', () => {
    const appDef = createAppDefinitionWithOrderedComponents();

    render(
      <Preview
        appDefinition={appDef}
        onUpdateDataStore={jest.fn()}
        actions={defaultActions}
        variableState={{}}
      />
    );

    const previewRegion = screen.getByRole('region', { name: 'Preview' });
    const labels = within(previewRegion).getAllByText(/First|Second|Third/);

    expect(labels).toHaveLength(3);
    expect(labels[0]).toHaveTextContent('First');
    expect(labels[1]).toHaveTextContent('Second');
    expect(labels[2]).toHaveTextContent('Third');
  });

  it('Canvas sorts root components by order property', () => {
    const appDef = createAppDefinitionWithOrderedComponents();

    render(
      <Canvas
        components={appDef.components}
        allComponents={appDef.components}
        onDrop={jest.fn()}
        onSelectComponent={jest.fn()}
        onDeselectCanvas={jest.fn()}
        selectedComponentIds={[]}
        onSetSelectedComponentIds={jest.fn()}
        updateComponent={jest.fn()}
        updateComponents={jest.fn()}
        onDeleteComponent={jest.fn()}
        evaluationScope={{
          theme: { colors: { background: '#fff', border: '#ccc' } },
          dataStore: {},
          variables: {},
          actions: {},
        }}
        dataStore={{}}
        onReparentComponent={jest.fn()}
        currentPageId="page-1"
      />
    );

    const canvas = screen.getByTestId('canvas');
    const labels = within(canvas).getAllByText(/First|Second|Third/);

    expect(labels).toHaveLength(3);
    expect(labels[0]).toHaveTextContent('First');
    expect(labels[1]).toHaveTextContent('Second');
    expect(labels[2]).toHaveTextContent('Third');
  });
});
