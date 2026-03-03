import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../geminiClient', () => ({
  generateStructuredContent: jest.fn(),
}));

jest.mock('@/responsive', () => ({
  generateAutoResponsiveDefaults: jest.fn(() => null),
}));

import { generateAppLayout } from '../appGenerationService';
import { generateStructuredContent } from '../geminiClient';
import { AppDefinition } from '@/types';
import { defaultLightTheme } from '@/theme-presets';

const mockGenerate = generateStructuredContent as jest.MockedFunction<typeof generateStructuredContent>;

function createBaseApp(overrides: Partial<AppDefinition> = {}): AppDefinition {
  return {
    id: 'test-app',
    name: 'Test App',
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    pages: [{ id: 'page_main', name: 'Main' }],
    mainPageId: 'page_main',
    components: [],
    dataStore: {},
    variables: [],
    theme: defaultLightTheme,
    ...overrides,
  };
}

describe('App Generation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn() as any;
  });

  it('adds components with action properties from patch', async () => {
    const app = createBaseApp();
    mockGenerate.mockResolvedValue({
      add: [
        {
          id: 'BUTTON_calc',
          type: 'BUTTON',
          props: {
            text: 'Calculate',
            order: 0,
            actionType: 'executeCode',
            actionCodeToExecute: '{{ actions.updateVariable("result", 42) }}',
          },
        },
      ],
    });

    const result = await generateAppLayout('add a calculate button', app, 'page_main');

    expect(result).not.toBeNull();
    const button = result!.components.find(c => c.id === 'BUTTON_calc');
    expect(button).toBeDefined();
    expect((button!.props as any).actionType).toBe('executeCode');
    expect((button!.props as any).actionCodeToExecute).toContain('updateVariable');
  });

  it('processes variables and initializes their dataStore entries', async () => {
    const app = createBaseApp();
    mockGenerate.mockResolvedValue({
      add: [
        { id: 'LABEL_result', type: 'LABEL', props: { text: '{{$vars.result}}', order: 0 } },
      ],
      variables: [
        { id: 'var_result', name: 'result', type: 'number', initialValue: '0' },
        { id: 'var_show', name: 'showResult', type: 'boolean', initialValue: 'false' },
      ],
    });

    const result = await generateAppLayout('add result display', app, 'page_main');

    expect(result).not.toBeNull();
    expect(result!.variables).toHaveLength(2);
    expect(result!.variables[0]).toEqual({
      id: 'var_result',
      name: 'result',
      type: 'number',
      initialValue: 0,
    });
    expect(result!.dataStore['result']).toBe(0);
    expect(result!.dataStore['showResult']).toBe(false);
  });

  it('merges new variables with existing variables', async () => {
    const app = createBaseApp({
      variables: [{ id: 'var_existing', name: 'existing', type: 'string' as any, initialValue: 'hi' }],
    });
    mockGenerate.mockResolvedValue({
      add: [],
      variables: [
        { id: 'var_new', name: 'newVar', type: 'number', initialValue: '10' },
      ],
    });

    const result = await generateAppLayout('add variable', app, 'page_main');

    expect(result!.variables).toHaveLength(2);
    expect(result!.variables[0].name).toBe('existing');
    expect(result!.variables[1].name).toBe('newVar');
  });

  it('preserves input event properties from patch', async () => {
    const app = createBaseApp();
    mockGenerate.mockResolvedValue({
      add: [
        {
          id: 'INPUT_price',
          type: 'INPUT',
          props: {
            label: 'Price',
            order: 0,
            inputType: 'number',
            onChangeActionType: 'executeCode',
            onChangeCodeToExecute: '{{ actions.updateVariable("total", Number(event.target.value) * 2) }}',
            customValidator: '{{ Number(dataStore.INPUT_price) < 0 ? "Must be positive" : "" }}',
          },
        },
      ],
    });

    const result = await generateAppLayout('add price input', app, 'page_main');

    const input = result!.components.find(c => c.id === 'INPUT_price');
    expect((input!.props as any).onChangeActionType).toBe('executeCode');
    expect((input!.props as any).onChangeCodeToExecute).toContain('updateVariable');
    expect((input!.props as any).customValidator).toContain('Must be positive');
  });

  it('initializes dataStore for both form fields and variables', async () => {
    const app = createBaseApp();
    mockGenerate.mockResolvedValue({
      add: [
        { id: 'INPUT_name', type: 'INPUT', props: { label: 'Name', order: 0 } },
        { id: 'CHECKBOX_agree', type: 'CHECKBOX', props: { label: 'Agree', order: 1 } },
      ],
      variables: [
        { id: 'var_count', name: 'count', type: 'number', initialValue: '5' },
      ],
    });

    const result = await generateAppLayout('add form with variable', app, 'page_main');

    expect(result!.dataStore['INPUT_name']).toBe('');
    expect(result!.dataStore['CHECKBOX_agree']).toBe(false);
    expect(result!.dataStore['count']).toBe(5);
  });

  it('handles patch with no variables gracefully', async () => {
    const app = createBaseApp();
    mockGenerate.mockResolvedValue({
      add: [
        { id: 'LABEL_h1', type: 'LABEL', props: { text: 'Hello', order: 0 } },
      ],
    });

    const result = await generateAppLayout('add header', app, 'page_main');

    expect(result!.variables).toEqual([]);
  });

  it('returns null when API call fails', async () => {
    const app = createBaseApp();
    mockGenerate.mockRejectedValue(new Error('API error'));

    const result = await generateAppLayout('test', app, 'page_main');

    expect(result).toBeNull();
  });
});
