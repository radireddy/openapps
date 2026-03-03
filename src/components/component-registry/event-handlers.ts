import React from 'react';
import { safeEval } from '../../expressions/engine';
import { InputActionType } from '../../types';

/**
 * Shared utility to evaluate event expressions
 * Used by all input components for consistent event handling
 */
export const evaluateEventExpression = (expression: string | undefined, scope: Record<string, any>): void => {
  if (!expression || typeof expression !== 'string') return;

  try {
    const expr = expression.startsWith('{{') && expression.endsWith('}}')
      ? expression.substring(2, expression.length - 2).trim()
      : expression;
    if (expr) {
      try {
        safeEval(expr, scope);
      } catch (evalError) {
        console.error('Event expression error:', expr, evalError instanceof Error ? evalError.message : evalError);
      }
    }
  } catch (error) {
    console.error('Event expression parse error:', expression, error instanceof Error ? error.message : error);
  }
};

/**
 * Interface for event handler props
 */
export interface EventHandlerProps {
  onChangeActionType?: InputActionType;
  onChangeAlertMessage?: string;
  onChangeCodeToExecute?: string;
  onChange?: string; // Legacy - deprecated
  onFocusActionType?: InputActionType;
  onFocusAlertMessage?: string;
  onFocusCodeToExecute?: string;
  onFocus?: string; // Legacy - deprecated
  onBlurActionType?: InputActionType;
  onBlurAlertMessage?: string;
  onBlurCodeToExecute?: string;
  onBlur?: string; // Legacy - deprecated
  onEnterActionType?: InputActionType;
  onEnterAlertMessage?: string;
  onEnterCodeToExecute?: string;
  onEnterKeyPress?: string; // Legacy - deprecated
}

/**
 * Interface for event handler options
 */
export interface EventHandlerOptions {
  mode: 'edit' | 'preview';
  evaluationScope: Record<string, any>;
  actions?: any;
  onUpdateDataStore?: (key: string, value: any) => void;
}

/**
 * Creates event scope with common variables
 */
const createEventScope = (
  evaluationScope: Record<string, any>,
  event: any,
  actions?: any
): Record<string, any> => {
  return {
    ...evaluationScope,
    console, // Explicitly ensure console is available
    event,
    actions,
  };
};

/**
 * Executes an alert action with expression support
 */
const executeAlertAction = (
  message: string | undefined,
  eventScope: Record<string, any>
): void => {
  if (!message) return;
  
  try {
    let finalMessage = message;
    // If it's an expression, evaluate it
    if (message.startsWith('{{') && message.endsWith('}}')) {
      const expr = message.substring(2, message.length - 2).trim();
      finalMessage = safeEval(expr, eventScope);
    } else if (message.includes('{{')) {
      // Template literal
      finalMessage = message.replace(/{{\s*(.*?)\s*}}/g, (match, expression) => {
        const result = safeEval(expression, eventScope);
        return result !== undefined && result !== null ? String(result) : '';
      });
    }
    alert(String(finalMessage));
  } catch (error) {
    console.error('Error executing alert action:', error);
  }
};

/**
 * Executes a code action
 */
const executeCodeAction = (
  code: string | undefined,
  eventScope: Record<string, any>
): void => {
  if (!code) return;
  evaluateEventExpression(code, eventScope);
};

/**
 * Handles onChange event with action type support
 */
export const handleChangeEvent = (
  props: EventHandlerProps,
  options: EventHandlerOptions,
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  newValue?: any
): void => {
  if (options.mode !== 'preview') return;
  
  const value = newValue !== undefined ? newValue : event.target.value;
  
  
  const eventScope = createEventScope(
    options.evaluationScope,
    { target: { value } },
    options.actions
  );
  
  // Handle new actionType-based onChange
  if (props.onChangeActionType) {
    switch (props.onChangeActionType) {
      case 'alert':
        executeAlertAction(props.onChangeAlertMessage, eventScope);
        break;
      case 'executeCode':
        executeCodeAction(props.onChangeCodeToExecute, eventScope);
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  } else if (props.onChange) {
    // Fallback to old onChange expression for backward compatibility
    evaluateEventExpression(props.onChange, eventScope);
  }
};

/**
 * Handles onFocus event with action type support
 * Includes debouncing to prevent infinite loops
 */
export const handleFocusEvent = (
  props: EventHandlerProps,
  options: EventHandlerOptions,
  event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  focusRefs?: {
    lastFocusTime: React.MutableRefObject<number>;
    lastFocusActionTime: React.MutableRefObject<number>;
    isHandlingFocus: React.MutableRefObject<boolean>;
  }
): void => {
  if (options.mode !== 'preview') return;
  
  // Prevent multiple rapid focus events (e.g., when alert causes focus loss/regain)
  if (focusRefs) {
    const now = Date.now();
    const timeSinceLastFocus = now - focusRefs.lastFocusTime.current;
    const timeSinceLastAction = now - focusRefs.lastFocusActionTime.current;
    
    // If we're already handling a focus event, ignore this one
    if (focusRefs.isHandlingFocus.current) {
      return;
    }
    
    // Only fire if at least 1000ms have passed since last focus action was executed
    // This prevents infinite loops when alerts cause focus loss/regain
    if (timeSinceLastAction < 1000) {
      return;
    }
    
    // Only fire if at least 200ms have passed since last focus event (increased debounce to prevent label click cycles)
    if (timeSinceLastFocus < 200) {
      return;
    }
    
    // Set flags and timestamps IMMEDIATELY to prevent duplicate events
    focusRefs.lastFocusTime.current = now;
    focusRefs.lastFocusActionTime.current = now;
    focusRefs.isHandlingFocus.current = true;
  }
  
  const eventScope = createEventScope(
    options.evaluationScope,
    event,
    options.actions
  );
  
  // Handle new actionType-based onFocus
  if (props.onFocusActionType) {
    switch (props.onFocusActionType) {
      case 'alert':
        executeAlertAction(props.onFocusAlertMessage, eventScope);
        if (focusRefs) {
          setTimeout(() => {
            focusRefs.isHandlingFocus.current = false;
          }, 200);
        }
        break;
      case 'executeCode':
        executeCodeAction(props.onFocusCodeToExecute, eventScope);
        if (focusRefs) {
          setTimeout(() => {
            focusRefs.isHandlingFocus.current = false;
          }, 200);
        }
        break;
      case 'none':
      default:
        if (focusRefs) {
          // Even for 'none', wait a bit before resetting to prevent rapid focus/blur cycles
          setTimeout(() => {
            focusRefs.isHandlingFocus.current = false;
          }, 100);
        }
        break;
    }
  } else if (props.onFocus) {
    // Fallback to old onFocus expression for backward compatibility
    evaluateEventExpression(props.onFocus, eventScope);
    if (focusRefs) {
      setTimeout(() => {
        focusRefs.isHandlingFocus.current = false;
      }, 200);
    }
  } else {
    if (focusRefs) {
      // Even when no action, wait a bit before resetting to prevent rapid focus/blur cycles
      setTimeout(() => {
        focusRefs.isHandlingFocus.current = false;
      }, 100);
    }
  }
};

/**
 * Handles onBlur event with action type support
 * Includes debouncing to prevent multiple rapid blur events
 */
export const handleBlurEvent = (
  props: EventHandlerProps,
  options: EventHandlerOptions,
  event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  blurRefs?: {
    lastBlurTime: React.MutableRefObject<number>;
    lastBlurActionTime: React.MutableRefObject<number>;
    isHandlingBlur: React.MutableRefObject<boolean>;
  }
): void => {
  if (options.mode !== 'preview') return;
  
  // Prevent multiple rapid blur events (e.g., when clicking checkbox causes focus/blur cycle)
  if (blurRefs) {
    const now = Date.now();
    const timeSinceLastBlur = now - blurRefs.lastBlurTime.current;
    const timeSinceLastAction = now - blurRefs.lastBlurActionTime.current;
    
    // If we're already handling a blur event, ignore this one
    if (blurRefs.isHandlingBlur.current) {
      return;
    }
    
    // Only fire if at least 1000ms have passed since last blur action was executed
    // This prevents infinite loops when alerts cause focus loss/regain
    if (timeSinceLastAction < 1000) {
      return;
    }
    
    // Only fire if at least 100ms have passed since last blur event (basic debounce)
    if (timeSinceLastBlur < 100) {
      return;
    }
    
    // Set flags and timestamps IMMEDIATELY to prevent duplicate events
    blurRefs.lastBlurTime.current = now;
    blurRefs.lastBlurActionTime.current = now;
    blurRefs.isHandlingBlur.current = true;
  }
  
  const eventScope = createEventScope(
    options.evaluationScope,
    event,
    options.actions
  );
  
  // Handle new actionType-based onBlur
  if (props.onBlurActionType) {
    switch (props.onBlurActionType) {
      case 'alert':
        executeAlertAction(props.onBlurAlertMessage, eventScope);
        if (blurRefs) {
          setTimeout(() => {
            blurRefs.isHandlingBlur.current = false;
          }, 200);
        }
        break;
      case 'executeCode':
        executeCodeAction(props.onBlurCodeToExecute, eventScope);
        if (blurRefs) {
          setTimeout(() => {
            blurRefs.isHandlingBlur.current = false;
          }, 200);
        }
        break;
      case 'none':
      default:
        if (blurRefs) {
          blurRefs.isHandlingBlur.current = false;
        }
        break;
    }
  } else if (props.onBlur) {
    // Fallback to old onBlur expression for backward compatibility
    evaluateEventExpression(props.onBlur, eventScope);
    if (blurRefs) {
      setTimeout(() => {
        blurRefs.isHandlingBlur.current = false;
      }, 200);
    }
  } else {
    if (blurRefs) {
      blurRefs.isHandlingBlur.current = false;
    }
  }
};

/**
 * Handles onEnterKeyPress event with action type support
 */
export const handleEnterKeyPressEvent = (
  props: EventHandlerProps,
  options: EventHandlerOptions,
  event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
): void => {
  if (event.key !== 'Enter' || options.mode !== 'preview') return;
  
  const eventScope = createEventScope(
    options.evaluationScope,
    event,
    options.actions
  );
  
  // Handle new actionType-based onEnter
  if (props.onEnterActionType) {
    switch (props.onEnterActionType) {
      case 'alert':
        executeAlertAction(props.onEnterAlertMessage, eventScope);
        break;
      case 'executeCode':
        executeCodeAction(props.onEnterCodeToExecute, eventScope);
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  } else if (props.onEnterKeyPress) {
    // Fallback to old onEnterKeyPress expression for backward compatibility
    evaluateEventExpression(props.onEnterKeyPress, eventScope);
  }
};

