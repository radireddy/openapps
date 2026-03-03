import {
  evaluateEventExpression,
  handleChangeEvent,
  handleFocusEvent,
  handleBlurEvent,
  handleEnterKeyPressEvent,
  EventHandlerProps,
  EventHandlerOptions,
} from '@/components/component-registry/event-handlers';
import { safeEval } from '@/expressions/engine';

jest.mock('@/expressions/engine', () => ({
  safeEval: jest.fn(),
}));

const mockedSafeEval = safeEval as jest.MockedFunction<typeof safeEval>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

const makeOptions = (overrides?: Partial<EventHandlerOptions>): EventHandlerOptions => ({
  mode: 'preview',
  evaluationScope: { dataStore: {}, variables: {} },
  actions: { updateDataStore: jest.fn() },
  ...overrides,
});

const makeFocusRefs = (overrides?: any) => ({
  lastFocusTime: { current: 0 },
  lastFocusActionTime: { current: 0 },
  isHandlingFocus: { current: false },
  ...overrides,
});

const makeBlurRefs = (overrides?: any) => ({
  lastBlurTime: { current: 0 },
  lastBlurActionTime: { current: 0 },
  isHandlingBlur: { current: false },
  ...overrides,
});

describe('evaluateEventExpression', () => {
  it('returns without error for undefined expression', () => {
    evaluateEventExpression(undefined, {});
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('returns without error for empty string', () => {
    evaluateEventExpression('', {});
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('returns without error for non-string value', () => {
    evaluateEventExpression(42 as any, {});
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('strips {{ }} wrapper and evaluates', () => {
    evaluateEventExpression('{{x + 1}}', { x: 5 });
    expect(mockedSafeEval).toHaveBeenCalledWith('x + 1', { x: 5 });
  });

  it('evaluates raw expression without {{ }}', () => {
    evaluateEventExpression('x + 1', { x: 5 });
    expect(mockedSafeEval).toHaveBeenCalledWith('x + 1', { x: 5 });
  });

  it('handles empty {{ }} gracefully', () => {
    evaluateEventExpression('{{}}', {});
    // Empty trimmed expression - safeEval not called
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('logs error but does not throw when safeEval throws', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedSafeEval.mockImplementation(() => { throw new Error('eval failed'); });
    expect(() => evaluateEventExpression('badCode', {})).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('trims whitespace inside {{ }}', () => {
    evaluateEventExpression('{{  foo  }}', { foo: 1 });
    expect(mockedSafeEval).toHaveBeenCalledWith('foo', { foo: 1 });
  });
});

describe('handleChangeEvent', () => {
  const mockEvent = { target: { value: 'test' } } as any;

  it('does nothing in edit mode', () => {
    const options = makeOptions({ mode: 'edit' });
    handleChangeEvent({}, options, mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('executes alert action with message', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props: EventHandlerProps = {
      onChangeActionType: 'alert',
      onChangeAlertMessage: 'Changed!',
    };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalledWith('Changed!');
    alertSpy.mockRestore();
  });

  it('executes alert action with expression message', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockedSafeEval.mockReturnValue('evaluated message');
    const props: EventHandlerProps = {
      onChangeActionType: 'alert',
      onChangeAlertMessage: '{{getMessage()}}',
    };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalledWith('evaluated message');
    alertSpy.mockRestore();
  });

  it('executes alert action with template literal message', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockedSafeEval.mockReturnValue('World');
    const props: EventHandlerProps = {
      onChangeActionType: 'alert',
      onChangeAlertMessage: 'Hello {{name}}!',
    };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalledWith('Hello World!');
    alertSpy.mockRestore();
  });

  it('executes code action', () => {
    const props: EventHandlerProps = {
      onChangeActionType: 'executeCode',
      onChangeCodeToExecute: '{{doSomething()}}',
    };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('does nothing for none action type', () => {
    const props: EventHandlerProps = { onChangeActionType: 'none' };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('falls back to legacy onChange expression', () => {
    const props: EventHandlerProps = { onChange: '{{legacyHandler()}}' };
    handleChangeEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'legacyHandler()',
      expect.objectContaining({ event: expect.any(Object) })
    );
  });

  it('uses newValue parameter over event.target.value', () => {
    const props: EventHandlerProps = {
      onChangeActionType: 'executeCode',
      onChangeCodeToExecute: '{{handler()}}',
    };
    handleChangeEvent(props, makeOptions(), mockEvent, 'customValue');
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'handler()',
      expect.objectContaining({ event: { target: { value: 'customValue' } } })
    );
  });
});

describe('handleFocusEvent', () => {
  const mockEvent = { target: {} } as any;

  it('does nothing in edit mode', () => {
    handleFocusEvent({}, makeOptions({ mode: 'edit' }), mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('executes alert action', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props: EventHandlerProps = {
      onFocusActionType: 'alert',
      onFocusAlertMessage: 'Focused!',
    };
    handleFocusEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalledWith('Focused!');
    alertSpy.mockRestore();
  });

  it('executes code action', () => {
    const props: EventHandlerProps = {
      onFocusActionType: 'executeCode',
      onFocusCodeToExecute: '{{onFocusCode()}}',
    };
    handleFocusEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('falls back to legacy onFocus expression', () => {
    const props: EventHandlerProps = { onFocus: '{{legacyFocus()}}' };
    handleFocusEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('skips when isHandlingFocus is true', () => {
    const refs = makeFocusRefs({ isHandlingFocus: { current: true } });
    const props: EventHandlerProps = {
      onFocusActionType: 'alert',
      onFocusAlertMessage: 'test',
    };
    handleFocusEvent(props, makeOptions(), mockEvent, refs);
    // Alert should not be called due to debounce
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('skips when lastFocusActionTime is within 1000ms', () => {
    const now = Date.now();
    const refs = makeFocusRefs({ lastFocusActionTime: { current: now - 500 } });
    const props: EventHandlerProps = {
      onFocusActionType: 'executeCode',
      onFocusCodeToExecute: '{{code()}}',
    };
    handleFocusEvent(props, makeOptions(), mockEvent, refs);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('skips when lastFocusTime is within 200ms', () => {
    const now = Date.now();
    const refs = makeFocusRefs({
      lastFocusTime: { current: now - 100 },
      lastFocusActionTime: { current: 0 },
    });
    const props: EventHandlerProps = {
      onFocusActionType: 'executeCode',
      onFocusCodeToExecute: '{{code()}}',
    };
    handleFocusEvent(props, makeOptions(), mockEvent, refs);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('works without focusRefs', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props: EventHandlerProps = {
      onFocusActionType: 'alert',
      onFocusAlertMessage: 'test',
    };
    handleFocusEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('does nothing for none action type', () => {
    const props: EventHandlerProps = { onFocusActionType: 'none' };
    handleFocusEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });
});

describe('handleBlurEvent', () => {
  const mockEvent = { target: {} } as any;

  it('does nothing in edit mode', () => {
    handleBlurEvent({}, makeOptions({ mode: 'edit' }), mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('executes alert action', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props: EventHandlerProps = {
      onBlurActionType: 'alert',
      onBlurAlertMessage: 'Blurred!',
    };
    handleBlurEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalledWith('Blurred!');
    alertSpy.mockRestore();
  });

  it('executes code action', () => {
    const props: EventHandlerProps = {
      onBlurActionType: 'executeCode',
      onBlurCodeToExecute: '{{onBlurCode()}}',
    };
    handleBlurEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('falls back to legacy onBlur expression', () => {
    const props: EventHandlerProps = { onBlur: '{{legacyBlur()}}' };
    handleBlurEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('skips when isHandlingBlur is true', () => {
    const refs = makeBlurRefs({ isHandlingBlur: { current: true } });
    const props: EventHandlerProps = {
      onBlurActionType: 'alert',
      onBlurAlertMessage: 'test',
    };
    handleBlurEvent(props, makeOptions(), mockEvent, refs);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('skips when lastBlurActionTime is within 1000ms', () => {
    const now = Date.now();
    const refs = makeBlurRefs({ lastBlurActionTime: { current: now - 500 } });
    const props: EventHandlerProps = {
      onBlurActionType: 'executeCode',
      onBlurCodeToExecute: '{{code()}}',
    };
    handleBlurEvent(props, makeOptions(), mockEvent, refs);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('skips when lastBlurTime is within 100ms', () => {
    const now = Date.now();
    const refs = makeBlurRefs({
      lastBlurTime: { current: now - 50 },
      lastBlurActionTime: { current: 0 },
    });
    const props: EventHandlerProps = {
      onBlurActionType: 'executeCode',
      onBlurCodeToExecute: '{{code()}}',
    };
    handleBlurEvent(props, makeOptions(), mockEvent, refs);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('works without blurRefs', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const props: EventHandlerProps = {
      onBlurActionType: 'alert',
      onBlurAlertMessage: 'test',
    };
    handleBlurEvent(props, makeOptions(), mockEvent);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('does nothing for none action type', () => {
    const props: EventHandlerProps = { onBlurActionType: 'none' };
    handleBlurEvent(props, makeOptions(), mockEvent);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('resets isHandlingBlur synchronously for none action type', () => {
    const refs = makeBlurRefs();
    const props: EventHandlerProps = { onBlurActionType: 'none' };
    handleBlurEvent(props, makeOptions(), mockEvent, refs);
    expect(refs.isHandlingBlur.current).toBe(false);
  });

  it('resets isHandlingBlur synchronously when no actions configured', () => {
    const refs = makeBlurRefs();
    handleBlurEvent({}, makeOptions(), mockEvent, refs);
    expect(refs.isHandlingBlur.current).toBe(false);
  });
});

describe('handleEnterKeyPressEvent', () => {
  it('does nothing for non-Enter key', () => {
    const event = { key: 'a' } as any;
    const props: EventHandlerProps = {
      onEnterActionType: 'alert',
      onEnterAlertMessage: 'Enter!',
    };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('does nothing in edit mode', () => {
    const event = { key: 'Enter' } as any;
    handleEnterKeyPressEvent({}, makeOptions({ mode: 'edit' }), event);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('executes alert action on Enter key in preview mode', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const event = { key: 'Enter' } as any;
    const props: EventHandlerProps = {
      onEnterActionType: 'alert',
      onEnterAlertMessage: 'Entered!',
    };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(alertSpy).toHaveBeenCalledWith('Entered!');
    alertSpy.mockRestore();
  });

  it('executes code action on Enter key', () => {
    const event = { key: 'Enter' } as any;
    const props: EventHandlerProps = {
      onEnterActionType: 'executeCode',
      onEnterCodeToExecute: '{{submitForm()}}',
    };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('does nothing for none action type', () => {
    const event = { key: 'Enter' } as any;
    const props: EventHandlerProps = { onEnterActionType: 'none' };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('falls back to legacy onEnterKeyPress expression', () => {
    const event = { key: 'Enter' } as any;
    const props: EventHandlerProps = { onEnterKeyPress: '{{legacyEnter()}}' };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(mockedSafeEval).toHaveBeenCalled();
  });

  it('does nothing when no handlers configured', () => {
    const event = { key: 'Enter' } as any;
    handleEnterKeyPressEvent({}, makeOptions(), event);
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('includes event in scope', () => {
    const event = { key: 'Enter' } as any;
    const props: EventHandlerProps = {
      onEnterActionType: 'executeCode',
      onEnterCodeToExecute: '{{handler()}}',
    };
    handleEnterKeyPressEvent(props, makeOptions(), event);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'handler()',
      expect.objectContaining({ event })
    );
  });
});

describe('cross-cutting: actions propagation', () => {
  it('includes actions in event scope for change events', () => {
    const myActions = { updateDataStore: jest.fn() };
    const props: EventHandlerProps = {
      onChangeActionType: 'executeCode',
      onChangeCodeToExecute: '{{actions.updateDataStore("key", "val")}}',
    };
    handleChangeEvent(props, makeOptions({ actions: myActions }), { target: { value: '' } } as any);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'actions.updateDataStore("key", "val")',
      expect.objectContaining({ actions: myActions })
    );
  });

  it('includes console in event scope', () => {
    const props: EventHandlerProps = {
      onChangeActionType: 'executeCode',
      onChangeCodeToExecute: '{{console.log("test")}}',
    };
    handleChangeEvent(props, makeOptions(), { target: { value: '' } } as any);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'console.log("test")',
      expect.objectContaining({ console })
    );
  });
});
