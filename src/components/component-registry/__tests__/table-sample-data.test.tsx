/**
 * Table Sample Data (IMP-010)
 *
 * Tests that the Table component uses sampleData as a fallback
 * when no real data is bound.
 */

import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentType } from '../../../types';
import { componentRegistry } from '../registry';
import {
  createTestComponent,
  createDefaultEvaluationScope,
} from './test-utils/component-renderer';

describe('Table sample data (IMP-010)', () => {
  const scope = createDefaultEvaluationScope();

  it('displays sample data when provided and no real data exists', () => {
    const sampleJson = JSON.stringify([
      { name: 'Alice', email: 'alice@test.com', role: 'Admin' },
      { name: 'Bob', email: 'bob@test.com', role: 'User' },
    ]);

    const component = createTestComponent(ComponentType.TABLE, {
      data: '{{[]}}',
      columns: 'Name:name,Email:email,Role:role',
      sampleData: sampleJson,
    });
    const Renderer = componentRegistry[ComponentType.TABLE].renderer;

    render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('shows empty state when no data and no sampleData', () => {
    const component = createTestComponent(ComponentType.TABLE, {
      data: '{{[]}}',
      columns: 'Name:name,Email:email,Role:role',
    });
    const Renderer = componentRegistry[ComponentType.TABLE].renderer;

    render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      />
    );

    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
  });

  it('uses real data over sample data when real data exists', () => {
    const sampleJson = JSON.stringify([
      { name: 'Sample', email: 'sample@test.com', role: 'Test' },
    ]);

    const component = createTestComponent(ComponentType.TABLE, {
      data: '{{[]}}',
      columns: 'Name:name,Email:email,Role:role',
      sampleData: sampleJson,
    });
    const Renderer = componentRegistry[ComponentType.TABLE].renderer;

    const scopeWithData = createDefaultEvaluationScope({
      myUsers: [
        { name: 'RealUser', email: 'real@test.com', role: 'Manager' },
      ],
    });

    const realDataComponent = createTestComponent(ComponentType.TABLE, {
      data: '{{myUsers}}',
      columns: 'Name:name,Email:email,Role:role',
      sampleData: sampleJson,
    });

    render(
      <Renderer
        component={realDataComponent}
        mode="preview"
        evaluationScope={scopeWithData}
        dataStore={{}}
      />
    );

    expect(screen.getByText('RealUser')).toBeInTheDocument();
    expect(screen.queryByText('Sample')).not.toBeInTheDocument();
  });

  it('handles invalid sampleData JSON gracefully', () => {
    const component = createTestComponent(ComponentType.TABLE, {
      data: '{{[]}}',
      columns: 'Name:name,Email:email,Role:role',
      sampleData: 'not valid json{{{',
    });
    const Renderer = componentRegistry[ComponentType.TABLE].renderer;

    render(
      <Renderer
        component={component}
        mode="preview"
        evaluationScope={scope}
        dataStore={{}}
      />
    );

    // Should fall through to empty state since JSON parse fails
    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
  });
});
