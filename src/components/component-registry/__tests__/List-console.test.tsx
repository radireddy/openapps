/**
 * List Component Console Output Tests
 *
 * Verifies that the List component does not spam console.error
 * when data evaluation fails, and does not emit debug console.log
 * in preview mode.
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { ListContext, ListContextValue } from '../ListContext';
import { ListComponentRenderer } from '../List';

/**
 * Minimal ListContext value for rendering the List component in isolation.
 */
function createMockListContext(overrides: Partial<ListContextValue> = {}): ListContextValue {
  return {
    allComponents: [],
    selectedComponentIds: [],
    onSelect: jest.fn(),
    onUpdate: jest.fn(),
    onUpdateComponents: jest.fn(),
    onDelete: jest.fn(),
    onDrop: jest.fn(),
    onReparentCheck: jest.fn(),
    dataStore: {},
    onUpdateDataStore: jest.fn(),
    actions: undefined,
    ...overrides,
  };
}

describe('List component console output', () => {
  it('does not log errors when data evaluation fails', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const component = {
      props: {
        x: 0,
        y: 0,
        width: 300,
        height: 400,
        data: '{{nonExistentVariable.items}}', // This will fail evaluation
        templateHeight: 120,
        itemSpacing: 8,
        emptyState: 'No items',
        templateChildren: [],
      },
    };

    render(
      <ListContext.Provider value={createMockListContext()}>
        <ListComponentRenderer
          component={component as any}
          mode="preview"
          evaluationScope={{}}
        >
          <div />
        </ListComponentRenderer>
      </ListContext.Provider>
    );

    // console.error should not have been called with list data error
    const listDataErrors = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('Error evaluating list data')
    );
    expect(listDataErrors).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  it('does not emit debug console.log in preview mode', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    const component = {
      props: {
        x: 0,
        y: 0,
        width: 300,
        height: 400,
        data: '{{[]}}',
        templateHeight: 120,
        itemSpacing: 8,
        emptyState: 'No items',
        templateChildren: [],
      },
    };

    render(
      <ListContext.Provider value={createMockListContext()}>
        <ListComponentRenderer
          component={component as any}
          mode="preview"
          evaluationScope={{}}
        >
          <div />
        </ListComponentRenderer>
      </ListContext.Provider>
    );

    // console.log should not have been called with List Preview Debug
    const debugLogs = logSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('List Preview Debug')
    );
    expect(debugLogs).toHaveLength(0);

    logSpy.mockRestore();
  });
});
