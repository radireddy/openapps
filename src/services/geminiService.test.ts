import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAppLayout } from '@/services/geminiService';
import { AppDefinition, ComponentType } from '@/types';

// Use the manual mock in __mocks__/@google/genai.ts
jest.mock('@google/genai');
const { mockGenerateContent } = jest.requireMock('@google/genai') as { mockGenerateContent: jest.Mock };

const mockCurrentApp: AppDefinition = {
  id: 'app1', name: 'Test App', createdAt: '', lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [],
  dataStore: {},
  variables: [],
  theme: {} as any,
};

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockClear();
    process.env.API_KEY = 'test-key';
  });

  it('should call the Gemini API with flex-layout system instruction and schema', async () => {
    const mockResponse = {
      text: JSON.stringify({
        add: [{
          id: 'LABEL_1',
          type: 'LABEL',
          props: { text: 'Hello', order: 0 },
        }],
      }),
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    await generateAppLayout('a simple label', mockCurrentApp, 'page1');

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0][0];

    expect(callArg.model).toBe('gemini-2.5-flash');
    expect(callArg.contents).toBe('a simple label');
    expect(callArg.config.systemInstruction).toContain('COMPONENT CATALOG');
    expect(callArg.config.responseMimeType).toBe('application/json');
    // responseSchema is no longer sent for patch calls (exceeds Gemini schema limits)
    expect(callArg.config.responseSchema).toBeUndefined();
  });

  it('should include new component types in the system instruction', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ add: [] }),
    });

    await generateAppLayout('a form', mockCurrentApp, 'page1');

    const callArg = mockGenerateContent.mock.calls[0][0];
    const instruction = callArg.config.systemInstruction;

    expect(instruction).toContain('DATE_PICKER');
    expect(instruction).toContain('TIME_PICKER');
    expect(instruction).toContain('SLIDER');
    expect(instruction).toContain('FILE_UPLOAD');
    expect(instruction).toContain('RATING');
    expect(instruction).toContain('PROGRESS');
  });

  it('should process the API response and return a new AppDefinition with flex props', async () => {
    const mockApiResponse = {
      add: [
        { id: 'INPUT_1', type: 'INPUT', props: { label: 'Name', placeholder: 'Enter name', order: 0 } },
        { id: 'CONTAINER_1', type: 'CONTAINER', props: { flexDirection: 'row', gap: '12px', order: 1 } },
        { id: 'BUTTON_1', type: 'BUTTON', parentId: 'CONTAINER_1', props: { text: 'Submit', order: 0 } },
      ],
      variables: [
        { id: 'var1', name: 'isLoading', type: 'boolean', initialValue: 'false' },
      ]
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });

    const result = await generateAppLayout('a form', mockCurrentApp, 'page1');

    expect(result).not.toBeNull();
    expect(result?.components.length).toBe(3);
    expect(result?.variables.length).toBe(1);

    // Check that pageId was added
    expect(result?.components[0].pageId).toBe('page1');

    // Check that dataStore was populated with component ID as key
    expect(result?.dataStore.INPUT_1).toBe('');

    // Check that parentId is preserved for nested components
    const button = result?.components.find(c => c.id === 'BUTTON_1');
    expect(button?.parentId).toBe('CONTAINER_1');
  });

  it('should process new component types correctly', async () => {
    const mockApiResponse = {
      add: [
        { id: 'DATE_PICKER_1', type: 'DATE_PICKER', props: { label: 'Birth Date', dateFormat: 'MM/DD/YYYY', order: 0 } },
        { id: 'SLIDER_1', type: 'SLIDER', props: { label: 'Volume', min: 0, max: 100, defaultValue: 50, order: 1 } },
        { id: 'RATING_1', type: 'RATING', props: { label: 'Rate us', maxStars: 5, order: 2 } },
        { id: 'PROGRESS_1', type: 'PROGRESS', props: { value: '75', max: 100, showLabel: true, order: 3 } },
        { id: 'FILE_UPLOAD_1', type: 'FILE_UPLOAD', props: { label: 'Documents', accept: '.pdf,.doc', order: 4 } },
        { id: 'TIME_PICKER_1', type: 'TIME_PICKER', props: { label: 'Meeting Time', timeFormat: '12h', order: 5 } },
      ],
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });

    const result = await generateAppLayout('a modern form', mockCurrentApp, 'page1');

    expect(result).not.toBeNull();
    expect(result?.components.length).toBe(6);

    // Check new form types get dataStore entries
    expect(result?.dataStore.DATE_PICKER_1).toBe('');
    expect(result?.dataStore.SLIDER_1).toBe(50); // numeric default
    expect(result?.dataStore.RATING_1).toBe(0);  // numeric default (no defaultValue)
    expect(result?.dataStore.FILE_UPLOAD_1).toBe('');
    expect(result?.dataStore.TIME_PICKER_1).toBe('');

    // PROGRESS is display-only, should not have dataStore entry
    expect(result?.dataStore.PROGRESS_1).toBeUndefined();

    // Check component props are preserved
    const datePicker = result?.components.find(c => c.id === 'DATE_PICKER_1');
    expect((datePicker?.props as any).dateFormat).toBe('MM/DD/YYYY');
    expect((datePicker?.props as any).label).toBe('Birth Date');

    const slider = result?.components.find(c => c.id === 'SLIDER_1');
    expect((slider?.props as any).min).toBe(0);
    expect((slider?.props as any).max).toBe(100);
  });

  it('should handle double-stringified JSON responses', async () => {
    const mockApiResponse = {
      add: [{ id: 'LABEL_1', type: 'LABEL', props: { text: 'Hello' } }],
    };
    const doubleStringifiedResponse = JSON.stringify(JSON.stringify(mockApiResponse));

    mockGenerateContent.mockResolvedValue({ text: doubleStringifiedResponse });

    const result = await generateAppLayout('a prompt', mockCurrentApp, 'page1');
    expect(result).not.toBeNull();
    expect(result?.components.length).toBe(1);
    expect((result?.components[0].props as any).text).toBe('Hello');
  });

  it('should strip x/y coordinates and merge with plugin defaults', async () => {
    const mockApiResponse = {
        add: [
            { id: 'INPUT_1', type: 'INPUT', props: { x: 100, y: 200, label: 'Email', inputType: 'email' } },
        ]
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });
    const result = await generateAppLayout('an email input', mockCurrentApp, 'page1');

    const input = result?.components.find(c => c.id === 'INPUT_1');
    // x/y should be stripped
    expect((input?.props as any).x).toBeUndefined();
    expect((input?.props as any).y).toBeUndefined();
    // Plugin defaults should be merged (width: '100%' from Input defaults)
    expect((input?.props as any).width).toBe('100%');
    // AI-provided props should be applied
    expect((input?.props as any).label).toBe('Email');
    expect((input?.props as any).inputType).toBe('email');
  });

  it('should auto-assign order for root-level components', async () => {
    const appWithExisting: AppDefinition = {
      ...mockCurrentApp,
      components: [
        { id: 'LABEL_existing', type: ComponentType.LABEL, pageId: 'page1', parentId: null, props: { text: 'Hi', width: '100%', height: 40, fontSize: 16, fontWeight: 'normal', color: '#000', order: 0 } },
      ],
    };
    const mockApiResponse = {
      add: [
        { id: 'INPUT_1', type: 'INPUT', props: { label: 'Name' } },
        { id: 'INPUT_2', type: 'INPUT', props: { label: 'Email' } },
      ]
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });
    const result = await generateAppLayout('two inputs', appWithExisting, 'page1');

    const input1 = result?.components.find(c => c.id === 'INPUT_1');
    const input2 = result?.components.find(c => c.id === 'INPUT_2');
    // Should start from order 1 (maxRootOrder 0 + 1)
    expect((input1?.props as any).order).toBe(1);
    expect((input2?.props as any).order).toBe(2);
  });

  it('should cascade delete to child components', async () => {
    const appWithNested: AppDefinition = {
      ...mockCurrentApp,
      components: [
        { id: 'CONTAINER_1', type: ComponentType.CONTAINER, pageId: 'page1', parentId: null, props: { width: '100%', height: 'auto' } as any },
        { id: 'INPUT_1', type: ComponentType.INPUT, pageId: 'page1', parentId: 'CONTAINER_1', props: { width: '100%', height: 40, placeholder: '' } as any },
      ],
    };
    const mockApiResponse = {
      delete: ['CONTAINER_1'],
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });
    const result = await generateAppLayout('delete the container', appWithNested, 'page1');

    expect(result?.components.length).toBe(0);
  });

  it('should return null and alert on API error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('API failed'));

    const result = await generateAppLayout('a prompt', mockCurrentApp, 'page1');

    expect(result).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith('AI generation failed: API failed');
    alertSpy.mockRestore();
  });

  it('should return null when API returns undefined text', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockGenerateContent.mockResolvedValue({ text: undefined });

    const result = await generateAppLayout('a prompt', mockCurrentApp, 'page1');

    expect(result).toBeNull();
    alertSpy.mockRestore();
  });

  it('should handle container with children in a single form layout', async () => {
    const mockApiResponse = {
      add: [
        { id: 'CONTAINER_form', type: 'CONTAINER', props: { flexDirection: 'column', gap: '12px', padding: '16px', order: 0 } },
        { id: 'INPUT_name', type: 'INPUT', parentId: 'CONTAINER_form', props: { label: 'Name', order: 0 } },
        { id: 'INPUT_email', type: 'INPUT', parentId: 'CONTAINER_form', props: { label: 'Email', inputType: 'email', order: 1 } },
        { id: 'DATE_PICKER_dob', type: 'DATE_PICKER', parentId: 'CONTAINER_form', props: { label: 'Date of Birth', order: 2 } },
        { id: 'SLIDER_age', type: 'SLIDER', parentId: 'CONTAINER_form', props: { label: 'Age', min: 18, max: 100, order: 3 } },
        { id: 'BUTTON_submit', type: 'BUTTON', parentId: 'CONTAINER_form', props: { text: 'Submit', variant: 'solid', order: 4 } },
      ],
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockApiResponse) });

    const result = await generateAppLayout('create a modern form', mockCurrentApp, 'page1');

    expect(result).not.toBeNull();
    expect(result?.components.length).toBe(6);

    // Container should be root-level
    const container = result?.components.find(c => c.id === 'CONTAINER_form');
    expect(container?.parentId).toBeNull();

    // Children should reference the container
    const children = result?.components.filter(c => c.parentId === 'CONTAINER_form');
    expect(children?.length).toBe(5);
  });
});
