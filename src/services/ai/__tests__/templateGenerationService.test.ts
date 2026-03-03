import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../geminiClient', () => ({
  generateStructuredContent: jest.fn(),
}));

jest.mock('@/responsive', () => ({
  generateAutoResponsiveDefaults: jest.fn(() => null),
}));

import { generateTemplate, postProcessComponents, wireButtonActions } from '../templateGenerationService';
import { generateStructuredContent } from '../geminiClient';
import { AppComponent } from '@/types';

const mockGenerateStructuredContent = generateStructuredContent as jest.MockedFunction<typeof generateStructuredContent>;

describe('Template Generation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a basic app with pages and components', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Test App',
      description: 'A test application',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        {
          id: 'LABEL_h1',
          type: 'LABEL',
          pageId: 'page_main',
          props: { text: 'Hello', order: 0 },
        },
      ],
    });

    const result = await generateTemplate('Build a test app');

    expect(result.appDefinition.pages).toHaveLength(1);
    expect(result.appDefinition.components).toHaveLength(1);
    expect(result.appDefinition.components[0].props).toHaveProperty('text', 'Hello');
  });

  it('processes variables from AI response', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Calculator',
      description: 'A calculator',
      pages: [{ id: 'page_main', name: 'Calculator' }],
      components: [
        { id: 'INPUT_a', type: 'INPUT', pageId: 'page_main', props: { label: 'A', order: 0, inputType: 'number' } },
      ],
      variables: [
        { id: 'var_result', name: 'result', type: 'number', initialValue: '0' },
        { id: 'var_show', name: 'showResult', type: 'boolean', initialValue: 'false' },
      ],
    });

    const result = await generateTemplate('Build a calculator');

    expect(result.appDefinition.variables).toHaveLength(2);
    expect(result.appDefinition.variables[0]).toEqual({
      id: 'var_result',
      name: 'result',
      type: 'number',
      initialValue: 0,
    });
    expect(result.appDefinition.variables[1]).toEqual({
      id: 'var_show',
      name: 'showResult',
      type: 'boolean',
      initialValue: false,
    });
  });

  it('initializes dataStore with variable initial values', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'App',
      description: 'Test',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        { id: 'LABEL_x', type: 'LABEL', pageId: 'page_main', props: { text: '{{$vars.count}}', order: 0 } },
      ],
      variables: [
        { id: 'var_count', name: 'count', type: 'number', initialValue: '0' },
        { id: 'var_msg', name: 'message', type: 'string', initialValue: 'Hello' },
      ],
    });

    const result = await generateTemplate('app with variables');

    expect(result.appDefinition.dataStore['count']).toBe(0);
    expect(result.appDefinition.dataStore['message']).toBe('Hello');
  });

  it('initializes dataStore for form components', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Form',
      description: 'Form app',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        { id: 'INPUT_name', type: 'INPUT', pageId: 'page_main', props: { label: 'Name', order: 0 } },
        { id: 'CHECKBOX_agree', type: 'CHECKBOX', pageId: 'page_main', props: { label: 'Agree', order: 1 } },
        { id: 'SLIDER_val', type: 'SLIDER', pageId: 'page_main', props: { label: 'Value', order: 2, defaultValue: 50 } },
      ],
      variables: [],
    });

    const result = await generateTemplate('form');

    expect(result.appDefinition.dataStore['INPUT_name']).toBe('');
    expect(result.appDefinition.dataStore['CHECKBOX_agree']).toBe(false);
    expect(result.appDefinition.dataStore['SLIDER_val']).toBe(50);
  });

  it('preserves action properties on components', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Interactive App',
      description: 'App with actions',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        {
          id: 'BUTTON_calc',
          type: 'BUTTON',
          pageId: 'page_main',
          props: {
            text: 'Calculate',
            order: 0,
            actionType: 'executeCode',
            actionCodeToExecute: '{{ actions.updateVariable("result", 42) }}',
          },
        },
        {
          id: 'INPUT_val',
          type: 'INPUT',
          pageId: 'page_main',
          props: {
            label: 'Value',
            order: 1,
            onChangeActionType: 'executeCode',
            onChangeCodeToExecute: '{{ actions.updateVariable("live", event.target.value) }}',
            customValidator: '{{ !dataStore.INPUT_val ? "Required" : "" }}',
          },
        },
      ],
      variables: [],
    });

    const result = await generateTemplate('interactive app');
    const button = result.appDefinition.components.find(c => c.id === 'BUTTON_calc');
    const input = result.appDefinition.components.find(c => c.id === 'INPUT_val');

    expect((button!.props as any).actionType).toBe('executeCode');
    expect((button!.props as any).actionCodeToExecute).toBe('{{ actions.updateVariable("result", 42) }}');
    expect((input!.props as any).onChangeActionType).toBe('executeCode');
    expect((input!.props as any).onChangeCodeToExecute).toContain('actions.updateVariable');
    expect((input!.props as any).customValidator).toContain('Required');
  });

  it('handles missing variables array gracefully', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Simple App',
      description: 'No variables',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        { id: 'LABEL_h1', type: 'LABEL', pageId: 'page_main', props: { text: 'Hello', order: 0 } },
      ],
    });

    const result = await generateTemplate('simple app');

    expect(result.appDefinition.variables).toEqual([]);
  });

  it('filters out variables with missing fields', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'App',
      description: 'Test',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        { id: 'LABEL_x', type: 'LABEL', pageId: 'page_main', props: { text: 'X', order: 0 } },
      ],
      variables: [
        { id: 'var_ok', name: 'ok', type: 'number', initialValue: '0' },
        { id: '', name: 'bad', type: 'number', initialValue: '0' },
        { id: 'var_no_name', name: '', type: 'string', initialValue: '' },
        null,
      ],
    });

    const result = await generateTemplate('app');

    expect(result.appDefinition.variables).toHaveLength(1);
    expect(result.appDefinition.variables[0].name).toBe('ok');
  });

  it('auto-fixes inputType to number for numeric-labeled inputs', async () => {
    mockGenerateStructuredContent.mockResolvedValue({
      name: 'Calculator',
      description: 'Test',
      pages: [{ id: 'page_main', name: 'Main' }],
      components: [
        { id: 'INPUT_amt', type: 'INPUT', pageId: 'page_main', props: { label: 'Monthly Investment (INR)', inputType: 'text', order: 0 } },
        { id: 'INPUT_rate', type: 'INPUT', pageId: 'page_main', props: { label: 'Interest Rate (%)', order: 1 } },
        { id: 'INPUT_name', type: 'INPUT', pageId: 'page_main', props: { label: 'Your Name', inputType: 'text', order: 2 } },
      ],
      variables: [],
    });

    const result = await generateTemplate('calculator');
    const amtInput = result.appDefinition.components.find(c => c.id === 'INPUT_amt');
    const rateInput = result.appDefinition.components.find(c => c.id === 'INPUT_rate');
    const nameInput = result.appDefinition.components.find(c => c.id === 'INPUT_name');

    expect((amtInput!.props as any).inputType).toBe('number');
    expect((rateInput!.props as any).inputType).toBe('number');
    expect((nameInput!.props as any).inputType).toBe('text');
  });
});

describe('postProcessComponents', () => {
  it('auto-fixes inputType to number for inputs with numeric labels', () => {
    const components: AppComponent[] = [
      { id: 'INPUT_amt', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Loan Amount', inputType: 'text' } as any },
      { id: 'INPUT_rate', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Annual Rate (%)', inputType: 'text' } as any },
      { id: 'INPUT_tenure', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Time Period (Years)', inputType: 'text' } as any },
      { id: 'INPUT_email', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Email Address', inputType: 'text' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).inputType).toBe('number');
    expect((components[1].props as any).inputType).toBe('number');
    expect((components[2].props as any).inputType).toBe('number');
    expect((components[3].props as any).inputType).toBe('text'); // Email stays text
  });

  it('does not change inputs already set to number', () => {
    const components: AppComponent[] = [
      { id: 'INPUT_amt', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Amount', inputType: 'number' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).inputType).toBe('number');
  });

  it('does not affect non-INPUT components', () => {
    const components: AppComponent[] = [
      { id: 'LABEL_x', type: 'LABEL', parentId: null, pageId: 'page_main', props: { text: 'Amount' } as any },
      { id: 'BUTTON_x', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Calculate', actionType: 'executeCode', actionCodeToExecute: '{{ 1+1 }}' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).inputType).toBeUndefined();
    expect((components[1].props as any).actionType).toBe('executeCode');
  });

  it('detects numeric inputs from placeholder text', () => {
    const components: AppComponent[] = [
      { id: 'INPUT_x', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Enter value', placeholder: 'e.g., 5000 (amount)', inputType: 'text' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).inputType).toBe('number');
  });

  it('enforces width 100% and height auto on components missing them', () => {
    const components: AppComponent[] = [
      { id: 'LABEL_x', type: 'LABEL', parentId: null, pageId: 'page_main', props: { text: 'Hello' } as any },
      { id: 'INPUT_x', type: 'INPUT', parentId: null, pageId: 'page_main', props: { label: 'Name' } as any },
      { id: 'BUTTON_x', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Go', actionType: 'alert' } as any },
    ];

    postProcessComponents(components);

    components.forEach(c => {
      expect((c.props as any).width).toBe('100%');
      expect((c.props as any).height).toBe('auto');
    });
  });

  it('does not override existing width and height values', () => {
    const components: AppComponent[] = [
      { id: 'CONTAINER_x', type: 'CONTAINER', parentId: null, pageId: 'page_main', props: { width: '50%', height: '200px' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).width).toBe('50%');
    expect((components[0].props as any).height).toBe('200px');
  });

  it('auto-fixes buttons with actionType none to executeCode when text suggests action', () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_calc', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Calculate EMI', actionType: 'none' } as any },
      { id: 'BUTTON_submit', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Submit Form', actionType: 'none' } as any },
      { id: 'BUTTON_nav', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Next', actionType: 'none' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).actionType).toBe('executeCode');
    expect((components[1].props as any).actionType).toBe('executeCode');
    // "Next" doesn't match action patterns, stays as 'none'
    expect((components[2].props as any).actionType).toBe('none');
  });

  it('auto-fixes buttons with missing actionType when text suggests action', () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_save', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Save Changes' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).actionType).toBe('executeCode');
  });

  it('does not change buttons that already have a valid actionType', () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_x', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Calculate', actionType: 'executeCode', actionCodeToExecute: '{{ 1+1 }}' } as any },
      { id: 'BUTTON_y', type: 'BUTTON', parentId: null, pageId: 'page_main', props: { text: 'Go Home', actionType: 'navigate', actionPageId: 'page_home' } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).actionType).toBe('executeCode');
    expect((components[1].props as any).actionType).toBe('navigate');
  });

});

describe('wireButtonActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls AI to wire buttons that have executeCode but no actionCodeToExecute', async () => {
    const components: AppComponent[] = [
      { id: 'INPUT_a', type: 'INPUT', parentId: null, pageId: 'p1', props: { label: 'Amount', inputType: 'number' } as any },
      { id: 'BUTTON_calc', type: 'BUTTON', parentId: null, pageId: 'p1', props: { text: 'Calculate', actionType: 'executeCode' } as any },
    ];
    const variables = [{ name: 'result', type: 'number' }];

    mockGenerateStructuredContent.mockResolvedValue({
      buttonActions: [{
        buttonId: 'BUTTON_calc',
        actionType: 'executeCode',
        actionCodeToExecute: '{{ actions.updateVariable("result", Number(dataStore.INPUT_a) * 2) }}',
      }],
    });

    await wireButtonActions(components, variables, 'a calculator');

    const button = components.find(c => c.id === 'BUTTON_calc');
    expect((button!.props as any).actionCodeToExecute).toContain('actions.updateVariable');
    expect((button!.props as any).actionType).toBe('executeCode');
    expect(mockGenerateStructuredContent).toHaveBeenCalledTimes(1);
  });

  it('skips second-pass when all buttons already have actionCodeToExecute', async () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_ok', type: 'BUTTON', parentId: null, pageId: 'p1', props: { text: 'Go', actionType: 'executeCode', actionCodeToExecute: '{{ 1+1 }}' } as any },
    ];

    await wireButtonActions(components, [], 'test');

    expect(mockGenerateStructuredContent).not.toHaveBeenCalled();
  });

  it('skips second-pass when no buttons exist', async () => {
    const components: AppComponent[] = [
      { id: 'LABEL_x', type: 'LABEL', parentId: null, pageId: 'p1', props: { text: 'Hi' } as any },
    ];

    await wireButtonActions(components, [], 'test');

    expect(mockGenerateStructuredContent).not.toHaveBeenCalled();
  });

  it('handles second-pass API failure gracefully', async () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_calc', type: 'BUTTON', parentId: null, pageId: 'p1', props: { text: 'Calculate', actionType: 'executeCode' } as any },
    ];

    mockGenerateStructuredContent.mockRejectedValue(new Error('API error'));

    // Should not throw
    await wireButtonActions(components, [], 'test');

    // Button still has no code, but no crash
    expect((components[0].props as any).actionCodeToExecute).toBeUndefined();
  });

  it('passes responseSchema to the second-pass call', async () => {
    const components: AppComponent[] = [
      { id: 'BUTTON_x', type: 'BUTTON', parentId: null, pageId: 'p1', props: { text: 'Submit', actionType: 'executeCode' } as any },
    ];

    mockGenerateStructuredContent.mockResolvedValue({ buttonActions: [] });

    await wireButtonActions(components, [{ name: 'result', type: 'number' }], 'test');

    const callArg = mockGenerateStructuredContent.mock.calls[0][0];
    expect(callArg.responseSchema).toBeDefined();
    expect(callArg.responseSchema.properties.buttonActions).toBeDefined();
  });
});

describe('postProcessComponents (continued)', () => {
  it('uses width auto for row-container children with flexGrow', () => {
    const components: AppComponent[] = [
      { id: 'CONTAINER_row', type: 'CONTAINER', parentId: null, pageId: 'page_main', props: { flexDirection: 'row' } as any },
      { id: 'CONTAINER_col1', type: 'CONTAINER', parentId: 'CONTAINER_row', pageId: 'page_main', props: { flexGrow: 1 } as any },
      { id: 'CONTAINER_col2', type: 'CONTAINER', parentId: 'CONTAINER_row', pageId: 'page_main', props: { flexGrow: 1 } as any },
    ];

    postProcessComponents(components);

    expect((components[0].props as any).width).toBe('100%');
    expect((components[1].props as any).width).toBe('auto');
    expect((components[2].props as any).width).toBe('auto');
  });
});
