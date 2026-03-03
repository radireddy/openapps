import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunMode } from './RunMode';
import { AppDefinition, ComponentType } from './types';
import { defaultLightTheme } from '@/theme-presets';
import { useRuntimeStore } from './stores/runtimeStore';

// Mock RenderedComponent to avoid pulling in the full component tree
jest.mock('./components/RenderedComponent', () => ({
  RenderedComponent: ({ component, mode }: any) => (
    <div data-testid={`rendered-${component.id}`} data-mode={mode}>
      {component.id}
    </div>
  ),
}));

// Mock responsive CSS generators
jest.mock('@/responsive', () => ({
  generateMediaQueryCSS: () => '',
  generateGlobalBaseStyles: () => '',
}));

// Mock query execution hook
jest.mock('./hooks/useQueryExecution', () => ({
  useQueryExecution: () => ({ runQuery: jest.fn() }),
}));

const createTestAppDef = (overrides?: Partial<AppDefinition>): AppDefinition => {
  const pageId = 'page_1';
  return {
    id: 'app_test',
    name: 'Test App',
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    pages: [{ id: pageId, name: 'Main Page' }, { id: 'page_2', name: 'Settings' }],
    mainPageId: pageId,
    components: [
      {
        id: 'Label1',
        type: ComponentType.LABEL,
        props: { text: 'Hello World', fontSize: 16, fontWeight: 'normal', color: '#000', width: 200, height: 40 },
        pageId,
      },
      {
        id: 'Button1',
        type: ComponentType.BUTTON,
        props: { text: 'Click Me', backgroundColor: '#4F46E5', textColor: '#fff', actionType: 'none', width: 120, height: 40 },
        pageId,
      },
      {
        id: 'Label2',
        type: ComponentType.LABEL,
        props: { text: 'Settings Page', fontSize: 16, fontWeight: 'normal', color: '#000', width: 200, height: 40 },
        pageId: 'page_2',
      },
    ],
    dataStore: {},
    variables: [],
    theme: defaultLightTheme,
    ...overrides,
  };
};

beforeEach(() => {
  useRuntimeStore.getState().reset();
});

describe('RunMode', () => {
  it('renders the app name in the header', () => {
    const appDef = createTestAppDef();
    render(<RunMode appDefinition={appDef} onBack={jest.fn()} />);
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('renders root components on the main page', () => {
    const appDef = createTestAppDef();
    render(<RunMode appDefinition={appDef} onBack={jest.fn()} />);

    // Main page has Label1 and Button1
    expect(screen.getByTestId('rendered-Label1')).toBeInTheDocument();
    expect(screen.getByTestId('rendered-Button1')).toBeInTheDocument();
    // Settings page component should NOT be rendered
    expect(screen.queryByTestId('rendered-Label2')).not.toBeInTheDocument();
  });

  it('renders components in preview mode', () => {
    const appDef = createTestAppDef();
    render(<RunMode appDefinition={appDef} onBack={jest.fn()} />);

    const renderedComponent = screen.getByTestId('rendered-Label1');
    expect(renderedComponent.getAttribute('data-mode')).toBe('preview');
  });

  it('calls onBack when the Back button is clicked', () => {
    const onBack = jest.fn();
    const appDef = createTestAppDef();
    render(<RunMode appDefinition={appDef} onBack={onBack} />);

    fireEvent.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not show editor chrome (no Canvas, PropertiesPanel, etc.)', () => {
    const appDef = createTestAppDef();
    render(<RunMode appDefinition={appDef} onBack={jest.fn()} />);

    // Run mode should have minimal UI — just header + content
    expect(screen.queryByText('Components')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties')).not.toBeInTheDocument();
    expect(screen.queryByText('Explorer')).not.toBeInTheDocument();
  });

  it('initializes runtime store variables on mount', () => {
    const appDef = createTestAppDef({
      variables: [
        { id: 'v1', name: 'counter', type: 'number' as any, initialValue: 0 },
      ],
    });
    render(<RunMode appDefinition={appDef} onBack={jest.fn()} />);

    const state = useRuntimeStore.getState();
    expect(state.variableState).toHaveProperty('counter', 0);
  });
});
