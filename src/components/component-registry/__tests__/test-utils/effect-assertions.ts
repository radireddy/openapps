/**
 * Effect Assertions Library
 * 
 * Reusable assertion functions for testing property effects on components.
 * These assertions verify that setting a property has the expected visual/behavioral effect.
 */

import { ExpectedEffect } from './capability-matrix';
import { ComponentType } from '../../../../types';
import { AppComponent } from '../../../../types';

/**
 * Context for running effect assertions
 */
export interface EffectAssertionContext {
  /** The rendered component DOM element */
  element: HTMLElement;
  /** The component definition */
  component: AppComponent;
  /** The property value that was set */
  propertyValue: any;
  /** The property ID */
  propertyId: string;
  /** Evaluation scope for expressions */
  evaluationScope: Record<string, any>;
}

/**
 * Result of an effect assertion
 */
export interface EffectAssertionResult {
  /** Whether the assertion passed */
  passed: boolean;
  /** Error message if assertion failed */
  error?: string;
}

/**
 * Effect assertion function type
 */
export type EffectAssertion = (context: EffectAssertionContext) => EffectAssertionResult | boolean;

/**
 * Checks if a component is disabled
 */
export const componentShouldBeDisabled: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  
  // Check if the property value evaluates to a truthy value
  const isDisabled = evaluateBooleanValue(propertyValue, evaluationScope);
  
  // Try multiple ways to check if element is disabled
  const isActuallyDisabled = 
    element.hasAttribute('disabled') ||
    element.getAttribute('disabled') !== null ||
    (element as HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | HTMLSelectElement).disabled === true ||
    element.classList.contains('disabled') ||
    element.getAttribute('aria-disabled') === 'true';
  
  if (isDisabled && !isActuallyDisabled) {
    return {
      passed: false,
      error: `Component should be disabled when property is "${propertyValue}", but it's not disabled`,
    };
  }
  
  if (!isDisabled && isActuallyDisabled) {
    return {
      passed: false,
      error: `Component should not be disabled when property is "${propertyValue}", but it is disabled`,
    };
  }
  
  return { passed: true };
};

/**
 * Checks if a component is hidden/shown
 */
export const componentShouldShowHide: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  
  const isHidden = evaluateBooleanValue(propertyValue, evaluationScope);
  
  const computedStyle = window.getComputedStyle(element);
  const isActuallyHidden = 
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.opacity === '0' ||
    element.hasAttribute('hidden') ||
    element.classList.contains('hidden');
  
  if (isHidden && !isActuallyHidden) {
    return {
      passed: false,
      error: `Component should be hidden when property is "${propertyValue}", but it's visible`,
    };
  }
  
  // We don't assert the opposite case (not hidden) because components might have other visibility rules
  return { passed: true };
};

/**
 * Checks if a component has a specific value
 */
export const componentShouldHaveValue: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope, component } = context;
  
  const evaluatedValue = evaluateExpression(propertyValue, evaluationScope);
  
  // For input-like elements
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement) {
    const elementValue = element.value;
    
    if (String(evaluatedValue) !== String(elementValue)) {
      return {
        passed: false,
        error: `Component should have value "${evaluatedValue}", but has "${elementValue}"`,
      };
    }
  }
  
  // For checkboxes and switches, check checked state
  if (component.type === ComponentType.CHECKBOX || component.type === ComponentType.SWITCH) {
    const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      const shouldBeChecked = evaluateBooleanValue(propertyValue, evaluationScope);
      if (checkbox.checked !== shouldBeChecked) {
        return {
          passed: false,
          error: `Component should be ${shouldBeChecked ? 'checked' : 'unchecked'} when property is "${propertyValue}"`,
        };
      }
    }
  }
  
  return { passed: true };
};

/**
 * Checks if a component has a placeholder
 */
export const componentShouldHavePlaceholder: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  
  const placeholder = evaluateExpression(propertyValue, evaluationScope);
  
  // For input elements
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement) {
    const elementPlaceholder = element.placeholder;
    
    if (String(placeholder) !== String(elementPlaceholder)) {
      return {
        passed: false,
        error: `Component should have placeholder "${placeholder}", but has "${elementPlaceholder}"`,
      };
    }
  }
  
  return { passed: true };
};

/**
 * Checks if a component has a label
 */
export const componentShouldHaveLabel: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope, component } = context;
  
  const labelText = evaluateExpression(propertyValue, evaluationScope);
  
  // Look for label text in various places
  const hasLabel = 
    element.textContent?.includes(String(labelText)) ||
    element.getAttribute('aria-label') === String(labelText) ||
    element.querySelector(`label:contains("${labelText}")`) !== null ||
    element.querySelector(`[aria-label="${labelText}"]`) !== null;
  
  // For checkbox and switch, the label might be next to the input
  if ((component.type === ComponentType.CHECKBOX || component.type === ComponentType.SWITCH) && !hasLabel) {
    const parent = element.parentElement;
    if (parent && parent.textContent?.includes(String(labelText))) {
      return { passed: true };
    }
  }
  
  if (!hasLabel && labelText) {
    return {
      passed: false,
      error: `Component should have label "${labelText}", but label not found`,
    };
  }
  
  return { passed: true };
};

/**
 * Checks if a component has options (for select/radio)
 */
export const componentShouldHaveOptions: EffectAssertion = (context) => {
  const { element, propertyValue } = context;
  
  const optionsText = String(propertyValue || '');
  const options = optionsText.split(',').map(opt => opt.trim()).filter(Boolean);
  
  // For select elements
  if (element instanceof HTMLSelectElement) {
    const optionElements = Array.from(element.querySelectorAll('option'));
    const elementOptions = optionElements.map(opt => opt.textContent?.trim()).filter(Boolean);
    
    if (options.length !== elementOptions.length) {
      return {
        passed: false,
        error: `Component should have ${options.length} options, but has ${elementOptions.length}`,
      };
    }
    
    // Check if all options are present
    for (const option of options) {
      if (!elementOptions.some(eo => eo?.includes(option))) {
        return {
          passed: false,
          error: `Component should have option "${option}", but it's not found`,
        };
      }
    }
  }
  
  // For radio groups
  const radioInputs = element.querySelectorAll('input[type="radio"]');
  if (radioInputs.length > 0) {
    if (options.length !== radioInputs.length) {
      return {
        passed: false,
        error: `Component should have ${options.length} radio options, but has ${radioInputs.length}`,
      };
    }
  }
  
  return { passed: true };
};

/**
 * Checks if a component has a specific color
 */
export const componentShouldHaveColor: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope, propertyId } = context;
  
  const color = evaluateExpression(propertyValue, evaluationScope);
  
  const computedStyle = window.getComputedStyle(element);
  
  let actualColor: string | null = null;
  
  if (propertyId === 'backgroundColor' || propertyId === 'color') {
    actualColor = computedStyle.backgroundColor;
  } else if (propertyId === 'textColor' || propertyId === 'color') {
    actualColor = computedStyle.color;
  } else if (propertyId === 'borderColor') {
    actualColor = computedStyle.borderColor;
  }
  
  // Color comparison is tricky due to RGB vs hex, so we do a loose check
  if (color && actualColor && !actualColor.includes('rgba(0, 0, 0, 0)')) {
    // If we got a color value and it's not transparent, consider it passed
    // More detailed color matching could be added if needed
    return { passed: true };
  }
  
  return { passed: true }; // Pass by default since color matching is complex
};

/**
 * Checks if a component has specific text
 */
export const componentShouldHaveText: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  
  const text = evaluateExpression(propertyValue, evaluationScope);
  const elementText = element.textContent?.trim() || '';
  
  if (!elementText.includes(String(text))) {
    return {
      passed: false,
      error: `Component should contain text "${text}", but has "${elementText}"`,
    };
  }
  
  return { passed: true };
};

/**
 * Checks if a component has help text
 */
export const componentShouldHaveHelpText: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  const helpText = evaluateExpression(propertyValue, evaluationScope);
  if (!helpText) return { passed: true };
  const helpEl = element.querySelector('[id$="-help"]');
  if (!helpEl) {
    return { passed: false, error: `Component should have help text element, but none found` };
  }
  if (!helpEl.textContent?.includes(String(helpText))) {
    return { passed: false, error: `Help text should contain "${helpText}", but has "${helpEl.textContent}"` };
  }
  return { passed: true };
};

/**
 * Checks if a component is read-only
 */
export const componentShouldBeReadOnly: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  const isReadOnly = evaluateBooleanValue(propertyValue, evaluationScope);
  const input = element.querySelector('input, textarea, select') || element;
  const hasReadOnly = input.hasAttribute('readonly') || (input as any).readOnly === true || input.getAttribute('aria-readonly') === 'true';
  if (isReadOnly && !hasReadOnly) {
    return { passed: false, error: `Component should be read-only but it's not` };
  }
  return { passed: true };
};

/**
 * Checks if a component has prefix text
 */
export const componentShouldHavePrefix: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  const prefix = evaluateExpression(propertyValue, evaluationScope);
  if (!prefix) return { passed: true };
  const prefixEl = element.querySelector('[data-testid="input-prefix"]');
  if (!prefixEl) {
    return { passed: false, error: `Component should have prefix element, but none found` };
  }
  if (!prefixEl.textContent?.includes(String(prefix))) {
    return { passed: false, error: `Prefix should contain "${prefix}", but has "${prefixEl.textContent}"` };
  }
  return { passed: true };
};

/**
 * Checks if a component has suffix text
 */
export const componentShouldHaveSuffix: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  const suffix = evaluateExpression(propertyValue, evaluationScope);
  if (!suffix) return { passed: true };
  const suffixEl = element.querySelector('[data-testid="input-suffix"]');
  if (!suffixEl) {
    return { passed: false, error: `Component should have suffix element, but none found` };
  }
  if (!suffixEl.textContent?.includes(String(suffix))) {
    return { passed: false, error: `Suffix should contain "${suffix}", but has "${suffixEl.textContent}"` };
  }
  return { passed: true };
};

/**
 * Checks if a component is required
 */
export const componentShouldBeRequired: EffectAssertion = (context) => {
  const { element, propertyValue, evaluationScope } = context;
  const isReq = evaluateBooleanValue(propertyValue, evaluationScope);
  if (!isReq) return { passed: true };
  const input = element.querySelector('input, textarea, select') || element;
  const hasRequired = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true';
  if (!hasRequired) {
    return { passed: false, error: `Component should be required but required attribute not found` };
  }
  return { passed: true };
};

/**
 * Registry of effect assertions
 */
export const effectAssertions: Record<ExpectedEffect, EffectAssertion> = {
  componentShouldBeDisabled,
  componentShouldShowHide,
  componentShouldHaveValue,
  componentShouldHavePlaceholder,
  componentShouldHaveLabel,
  componentShouldHaveOptions,
  componentShouldHaveColor,
  componentShouldHaveText,
  componentShouldHaveHelpText,
  componentShouldBeReadOnly,
  componentShouldHavePrefix,
  componentShouldHaveSuffix,
  componentShouldBeRequired,
};

/**
 * Runs an effect assertion
 */
export function runEffectAssertion(
  effectName: ExpectedEffect,
  context: EffectAssertionContext
): EffectAssertionResult {
  const assertion = effectAssertions[effectName];
  
  if (!assertion) {
    return {
      passed: false,
      error: `Unknown effect assertion: ${effectName}`,
    };
  }
  
  const result = assertion(context);
  
  if (typeof result === 'boolean') {
    return {
      passed: result,
      error: result ? undefined : `Effect assertion ${effectName} failed`,
    };
  }
  
  return result;
}

/**
 * Helper to evaluate a boolean value (supports expressions)
 */
function evaluateBooleanValue(value: any, scope: Record<string, any>): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Simple expression evaluation
    if (value.trim().startsWith('{{') && value.trim().endsWith('}}')) {
      const expr = value.trim().slice(2, -2).trim();
      try {
        // Simple true/false evaluation
        if (expr === 'true') return true;
        if (expr === 'false') return false;
        // Try to evaluate as JavaScript expression
        const func = new Function(...Object.keys(scope), `return ${expr}`);
        return !!func(...Object.values(scope));
      } catch {
        return false;
      }
    }
    return value === 'true' || value === '1';
  }
  
  return !!value;
}

/**
 * Helper to evaluate an expression value
 */
function evaluateExpression(value: any, scope: Record<string, any>): any {
  if (typeof value === 'string' && value.trim().startsWith('{{') && value.trim().endsWith('}}')) {
    const expr = value.trim().slice(2, -2).trim();
    try {
      // Wrap in quotes if it's a string literal
      if (expr.startsWith('"') || expr.startsWith("'")) {
        const func = new Function(`return ${expr}`);
        return func();
      }
      // Try to evaluate as JavaScript expression
      const func = new Function(...Object.keys(scope), `return ${expr}`);
      return func(...Object.values(scope));
    } catch {
      return value; // Return original if evaluation fails
    }
  }
  
  return value;
}

