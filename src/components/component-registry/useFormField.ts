import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormFieldCommonProps, ActionHandlers } from '@/types';
import { get } from '@/utils/data-helpers';
import { useJavaScriptRenderer } from '@/property-renderers/useJavaScriptRenderer';
import { useRuntimeStore } from '@/stores/runtimeStore';
import {
  coerceToBoolean,
  parseOpacity,
  evaluateCustomValidator,
  useSizeVariant,
  useFormValidation,
} from './form-utils';
import {
  handleChangeEvent,
  handleFocusEvent,
  handleBlurEvent,
  handleEnterKeyPressEvent,
  EventHandlerProps,
} from './event-handlers';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface UseFormFieldOptions {
  /** The component instance (needs id + props) */
  component: { id: string; props: FormFieldCommonProps & Record<string, any> };
  /** Current mode */
  mode: 'edit' | 'preview';
  /** Global data store */
  dataStore: Record<string, any>;
  /** Callback to persist value into data store */
  onUpdateDataStore?: (key: string, value: any) => void;
  /** Evaluation scope for expressions */
  evaluationScope: Record<string, any>;
  /** CRUD / state-update action handlers */
  actions?: ActionHandlers;
  /**
   * Optional component-specific validation that runs *after* required check
   * and *before* customValidator.
   */
  validate?: (value: any) => string;
  /** 'string' uses '' as empty default; 'boolean' uses false. Default: 'string' */
  valueType?: 'string' | 'boolean';
}

export interface UseFormFieldReturn {
  // Evaluated boolean states
  isDisabled: boolean;
  isDisabledInPreview: boolean;
  isReadOnly: boolean;
  isRequired: boolean;

  // Value management
  currentValue: any;
  setLocalValue: React.Dispatch<React.SetStateAction<any>>;

  // Validation
  validationError: string;
  validateOnBlur: (value: any) => void;
  validateOnChange: (value: any) => void;
  forceValidate: (value: any) => string;

  // Evaluated style/display values
  sizeVariant: { fontSize: string; padding: string; height: number };
  finalOpacity: number;
  helpText: string;
  labelText: string;
  boxShadowValue: any;
  errorMessageValue: string;

  // Style helpers
  pointerEventsStyle: React.CSSProperties;

  // Focus/blur refs (for advanced components that need them)
  focusBlurRefs: {
    lastFocusTimeRef: React.MutableRefObject<number>;
    isHandlingFocusRef: React.MutableRefObject<boolean>;
    lastFocusActionTimeRef: React.MutableRefObject<number>;
    lastBlurTimeRef: React.MutableRefObject<number>;
    isHandlingBlurRef: React.MutableRefObject<boolean>;
    lastBlurActionTimeRef: React.MutableRefObject<number>;
    lastClickTimeRef: React.MutableRefObject<number>;
    focusBlurCycleRef: React.MutableRefObject<{ focusTime: number; blurTime: number | null } | null>;
  };

  // Pre-built event handler factories
  eventHandlers: {
    /** Generic handleFocus for any focusable element */
    handleFocus: (e: React.FocusEvent<any>) => void;
    /** Generic handleBlur for any focusable element */
    handleBlur: (e: React.FocusEvent<any>) => void;
    /** Generic handleKeyDown (delegates to onEnter) for any element */
    handleKeyDown: (e: React.KeyboardEvent<any>) => void;
  };

  // aria-describedby string (empty string when nothing to describe)
  ariaDescribedBy: string;
}

// ────────────────────────────────────────────────────────────
// Hook implementation
// ────────────────────────────────────────────────────────────

export function useFormField(options: UseFormFieldOptions): UseFormFieldReturn {
  const {
    component,
    mode,
    dataStore,
    onUpdateDataStore,
    evaluationScope,
    actions,
    validate,
    valueType = 'string',
  } = options;

  const p = component.props;
  const emptyDefault = valueType === 'boolean' ? false : '';

  // ── Refs for focus/blur cycle detection ──────────────────
  const lastFocusTimeRef = useRef<number>(0);
  const isHandlingFocusRef = useRef<boolean>(false);
  const lastFocusActionTimeRef = useRef<number>(0);
  const lastBlurTimeRef = useRef<number>(0);
  const isHandlingBlurRef = useRef<boolean>(false);
  const lastBlurActionTimeRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const focusBlurCycleRef = useRef<{ focusTime: number; blurTime: number | null } | null>(null);

  // ── Expression keys for dependency graph caching ─────────
  const cid = component.id;

  // ── Evaluate boolean expressions ─────────────────────────
  const disabledValue = useJavaScriptRenderer(p.disabled, evaluationScope, false, `${cid}:disabled`);
  const isDisabled = coerceToBoolean(disabledValue);
  const isDisabledInPreview = mode === 'preview' && isDisabled;

  const readOnlyValue = useJavaScriptRenderer(p.readOnly, evaluationScope, false, `${cid}:readOnly`);
  const isReadOnly = coerceToBoolean(readOnlyValue);

  const requiredValue = useJavaScriptRenderer(p.required, evaluationScope, false, `${cid}:required`);
  const isRequired = coerceToBoolean(requiredValue);

  // ── Evaluate common display props ────────────────────────
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1, `${cid}:opacity`);
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '', `${cid}:boxShadow`);
  const helpTextRaw = useJavaScriptRenderer(p.helpText, evaluationScope, '', `${cid}:helpText`);
  const helpText = String(helpTextRaw || '');
  const labelTextRaw = useJavaScriptRenderer(p.label, evaluationScope, '', `${cid}:label`);
  const labelText = String(labelTextRaw || '');
  const errorMessageRaw = useJavaScriptRenderer(p.errorMessage, evaluationScope, '', `${cid}:errorMessage`);
  const errorMessageValue = String(errorMessageRaw || '');

  // ── Size variant ─────────────────────────────────────────
  const sizeVariant = useSizeVariant(p.size, evaluationScope);

  // ── Opacity ──────────────────────────────────────────────
  const finalOpacity = parseOpacity(opacityValue, isDisabled);

  // ── Pointer events helper ────────────────────────────────
  const pointerEventsStyle: React.CSSProperties =
    mode === 'edit' && isDisabled ? { pointerEvents: 'none' as const } : {};

  // ── Value binding ────────────────────────────────────────
  const evaluatedDefaultValue = useJavaScriptRenderer(
    p.defaultValue ?? emptyDefault,
    evaluationScope,
    emptyDefault,
    `${cid}:defaultValue`
  );
  const valueProp = useJavaScriptRenderer(p.value, evaluationScope, undefined, `${cid}:value`);
  const hasValueProp = p.value !== undefined && p.value !== null && p.value !== '';
  const prevValuePropRef = useRef<any>(undefined);

  const coerceValue = valueType === 'boolean'
    ? (v: any) => !!v
    : (v: any) => (v !== undefined && v !== null ? v : '');

  const [localValue, setLocalValue] = useState<any>(() => {
    // When an explicit value binding exists (e.g., value="{{loanAmount}}"),
    // the evaluated expression takes priority over stale stored values.
    if (hasValueProp && valueProp !== undefined && valueProp !== null)
      return coerceValue(valueProp);
    const stored = get(dataStore, component.id);
    if (stored !== undefined && stored !== null) return coerceValue(stored);
    if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '')
      return coerceValue(evaluatedDefaultValue);
    return emptyDefault;
  });

  useEffect(() => {
    const stored = get(dataStore, component.id);
    const valuePropChanged = hasValueProp && valueProp !== prevValuePropRef.current;

    if (hasValueProp) {
      prevValuePropRef.current = valueProp;
    }

    // In edit mode, inputs are readOnly — always prefer the expression value
    // so that variable default changes are immediately reflected on canvas.
    if (mode === 'edit' && hasValueProp && valueProp !== undefined && valueProp !== null) {
      setLocalValue(coerceValue(valueProp));
    } else if (valuePropChanged && valueProp !== undefined && valueProp !== null) {
      // Value binding expression produced a NEW result (external variable change)
      setLocalValue(coerceValue(valueProp));
    } else if (stored !== undefined && stored !== null) {
      // Stored value (user typed or dataStore updated) — preserves user typing
      setLocalValue(coerceValue(stored));
    } else if (hasValueProp && valueProp !== undefined && valueProp !== null) {
      // Value binding exists, hasn't changed, no stored value — use valueProp
      setLocalValue(coerceValue(valueProp));
    } else if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
      setLocalValue(coerceValue(evaluatedDefaultValue));
    }
  }, [hasValueProp, valueProp, p.defaultValue, evaluatedDefaultValue, dataStore, component.id, mode]);

  // ── Sync initial/default value to dataStore on preview mount ──
  // handleSubmitForm reads values from dataStore. Without this sync,
  // fields with defaultValue or expression-evaluated initial values
  // would appear empty in dataStore and fail required validation.
  const hasSyncedInitialRef = useRef(false);

  useEffect(() => {
    if (mode === 'preview' && !hasSyncedInitialRef.current && onUpdateDataStore) {
      const stored = get(dataStore, component.id);
      if (stored === undefined || stored === null) {
        const isMeaningful = valueType === 'boolean'
          ? localValue === true
          : (localValue !== '' && localValue !== undefined && localValue !== null);
        if (isMeaningful) {
          onUpdateDataStore(component.id, localValue);
        }
      }
      hasSyncedInitialRef.current = true;
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps -- fire once on mount

  const currentValue = localValue;

  // ── Validation ───────────────────────────────────────────
  const validateField = useCallback(
    (value: any): string => {
      const stringValue = String(value ?? '');

      // 1. Required check
      if (valueType === 'boolean') {
        if (isRequired && !value) {
          return errorMessageValue || 'This field is required';
        }
      } else {
        if (isRequired && (!stringValue || stringValue.trim() === '')) {
          return errorMessageValue || 'This field is required';
        }
      }

      // 2. Component-specific validation
      if (validate) {
        const err = validate(value);
        if (err) return err;
      }

      // 3. Custom validator expression
      if (p.customValidator) {
        const customErr = evaluateCustomValidator(p.customValidator, value, evaluationScope);
        if (customErr) return customErr;
      }

      return '';
    },
    [isRequired, errorMessageValue, validate, p.customValidator, evaluationScope, valueType]
  );

  const { validationError, validateOnBlur, validateOnChange, forceValidate } = useFormValidation(
    p.validationTiming,
    validateField
  );

  // ── Form submit validation trigger ────────────────────────
  // When a form submit button is clicked, triggerFormValidation() is called on the
  // runtime store. All form fields subscribe to the validation trigger timestamp
  // and force-validate their current value, showing inline errors regardless of
  // validationTiming setting.
  const formValidationTrigger = useRuntimeStore(s => s.formState.validationTrigger);
  const prevFormTriggerRef = useRef(formValidationTrigger);
  useEffect(() => {
    if (mode === 'preview' && formValidationTrigger && formValidationTrigger !== prevFormTriggerRef.current) {
      prevFormTriggerRef.current = formValidationTrigger;
      forceValidate(currentValue);
    }
  }, [formValidationTrigger, mode, forceValidate, currentValue]);

  // ── Event handlers ───────────────────────────────────────
  const eventHandlerOptions = {
    mode,
    evaluationScope,
    actions,
    onUpdateDataStore,
  };

  const handleFocus = useCallback(
    (e: React.FocusEvent<any>) => {
      const now = Date.now();

      // Ignore focus within 300ms of click (click-related focus)
      if (now - lastClickTimeRef.current < 300) {
        if (!focusBlurCycleRef.current) {
          focusBlurCycleRef.current = { focusTime: now, blurTime: null };
        }
        return;
      }

      // Check for focus/blur cycle
      if (focusBlurCycleRef.current) {
        const cycle = focusBlurCycleRef.current;
        const timeSinceCycleStart = now - cycle.focusTime;
        if (cycle.blurTime !== null && timeSinceCycleStart < 200) {
          focusBlurCycleRef.current = null;
          return;
        }
        if (timeSinceCycleStart > 200) {
          focusBlurCycleRef.current = null;
        }
      }

      handleFocusEvent(p as EventHandlerProps, eventHandlerOptions, e, {
        lastFocusTime: lastFocusTimeRef,
        lastFocusActionTime: lastFocusActionTimeRef,
        isHandlingFocus: isHandlingFocusRef,
      });

      focusBlurCycleRef.current = null;
    },
    [p, eventHandlerOptions]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<any>) => {
      const now = Date.now();

      // Always validate on blur regardless of debouncing
      if (mode === 'preview') {
        // When value is bound to an expression, prefer the evaluated expression value
        // over localValue which may not have synced yet on first blur (BUG-003).
        const freshValue = (() => {
          // If explicit value binding exists and has a value, use it
          if (hasValueProp && valueProp !== undefined && valueProp !== null && String(valueProp) !== '') {
            return coerceValue(valueProp);
          }
          // If default value is expression-evaluated and current value appears empty,
          // check the evaluated default as a fallback
          if (!currentValue && evaluatedDefaultValue !== undefined && evaluatedDefaultValue !== null && String(evaluatedDefaultValue) !== '') {
            return coerceValue(evaluatedDefaultValue);
          }
          return currentValue;
        })();
        validateOnBlur(freshValue);
      }

      // Ignore blur within 300ms of click (for action handler debouncing only)
      if (now - lastClickTimeRef.current < 300) {
        if (focusBlurCycleRef.current) {
          focusBlurCycleRef.current.blurTime = now;
        } else {
          focusBlurCycleRef.current = {
            focusTime: lastFocusTimeRef.current || now,
            blurTime: now,
          };
        }
        return;
      }

      // Ignore rapid blur after focus (click cycle) for action handler debouncing only
      const timeSinceFocus = now - lastFocusTimeRef.current;
      if (timeSinceFocus < 50) {
        if (!focusBlurCycleRef.current) {
          focusBlurCycleRef.current = { focusTime: lastFocusTimeRef.current, blurTime: now };
        } else {
          focusBlurCycleRef.current.blurTime = now;
        }
        return;
      }

      handleBlurEvent(p as EventHandlerProps, eventHandlerOptions, e, {
        lastBlurTime: lastBlurTimeRef,
        lastBlurActionTime: lastBlurActionTimeRef,
        isHandlingBlur: isHandlingBlurRef,
      });
    },
    [p, eventHandlerOptions, mode, validateOnBlur, currentValue, hasValueProp, valueProp, coerceValue, evaluatedDefaultValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<any>) => {
      handleEnterKeyPressEvent(p as EventHandlerProps, eventHandlerOptions, e);
    },
    [p, eventHandlerOptions]
  );

  // ── aria-describedby ─────────────────────────────────────
  const describedByIds: string[] = [];
  if (validationError) describedByIds.push(`${component.id}-error`);
  if (helpText) describedByIds.push(`${component.id}-help`);
  if (p.ariaDescribedBy) describedByIds.push(p.ariaDescribedBy);
  const ariaDescribedBy = describedByIds.join(' ');

  // ── Return ───────────────────────────────────────────────
  return {
    isDisabled,
    isDisabledInPreview,
    isReadOnly,
    isRequired,

    currentValue,
    setLocalValue,

    validationError,
    validateOnBlur,
    validateOnChange,
    forceValidate,

    sizeVariant,
    finalOpacity,
    helpText,
    labelText,
    boxShadowValue,
    errorMessageValue,

    pointerEventsStyle,

    focusBlurRefs: {
      lastFocusTimeRef,
      isHandlingFocusRef,
      lastFocusActionTimeRef,
      lastBlurTimeRef,
      isHandlingBlurRef,
      lastBlurActionTimeRef,
      lastClickTimeRef,
      focusBlurCycleRef,
    },

    eventHandlers: {
      handleFocus,
      handleBlur,
      handleKeyDown,
    },

    ariaDescribedBy,
  };
}
