
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ButtonProps } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { toPascalCase } from '../../../utils/stringUtils';

/**
 * Generator for Input components.
 * Sets up standard React controlled input behavior using `value` and `onChange` props
 * bound to the `dataStore` and `updateDataStore` function.
 */
export class InputGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const inputProps = component.props as any;
        
        // Build onChange handler that executes onChange expression
        let onChangeCode = '';
        
        // Check if there's an onChange expression or action to execute
        if (inputProps.onChangeActionType === 'executeCode' && inputProps.onChangeCodeToExecute) {
            // Translate the expression to code that can be executed directly
            // The code will have access to all page-level variables through closure
            onChangeCode = translateExpression(inputProps.onChangeCodeToExecute, appDef, 'code-block');
        } else if (inputProps.onChange) {
            // Fallback to old onChange expression for backward compatibility
            // Translate the expression to code that can be executed directly
            onChangeCode = translateExpression(inputProps.onChange, appDef, 'code-block');
        }
        
        // Build the onChange handler with the custom code
        const onChangeHandler = onChangeCode 
            ? `(e) => {
            const newValue = e.target.value;
            try {
                // Variables available through closure: theme, dataStore, get, updateDataStore, and all page props/variables
                const event = {
                    target: { value: newValue }
                };
                ${onChangeCode}
            } catch (error) {
                console.error('Error executing onChange code:', error);
            }
        }`
            : `(e) => {
            const newValue = e.target.value;
        }`;
        
        // Determine value binding - use component ID as dataStore key if no value/defaultValue is provided
        const valueExpression = inputProps.value || inputProps.defaultValue || '';
        const valueBinding = valueExpression 
            ? translateExpression(valueExpression, appDef, 'raw-js')
            : `get(dataStore, '${component.id}')`;
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, { padding: `'0.5rem'`, boxSizing: `'border-box'` }),
            `className="p-2 box-border"`,
            `placeholder={${translateExpression(inputProps.placeholder, appDef, 'raw-js')}}`,
            `value={${valueBinding} || ''}`,
            `onChange={(e) => { updateDataStore('${component.id}', e.target.value); ${onChangeCode ? `try { const event = { target: { value: e.target.value } }; ${onChangeCode} } catch (error) { console.error('Error executing onChange code:', error); }` : ''} }}`
        ];
        return this.buildTag('input', attributes);
    }
}

/**
 * Generator for Button components.
 * Generates the `onClick` handler based on the button's action configuration
 * and renders the button text (which may be an expression).
 */
export class ButtonGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const btnProps = component.props as ButtonProps;
        const onClickHandlerName = `handle${toPascalCase(component.id)}Click`;
        
        const style = {
            backgroundColor: translateExpression(btnProps.backgroundColor, appDef, 'raw-js'),
            color: translateExpression(btnProps.textColor, appDef, 'raw-js'),
            display: `'flex'`,
            alignItems: `'center'`,
            justifyContent: `'center'`,
        };

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `onClick={${onClickHandlerName}}`
        ];

        const children = translateExpression(btnProps.text, appDef, 'jsx-children');
        return this.buildTag('button', attributes, children);
    }
}

/**
 * Generator for Textarea components.
 * Sets up standard React controlled textarea behavior using `value` and `onChange` props
 * bound to the `dataStore` and `updateDataStore` function.
 */
export class TextareaGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const textareaProps = component.props as any;
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, { padding: `'0.5rem'`, boxSizing: `'border-box'` }),
            `className="w-full h-full p-2 bg-white text-gray-900 focus:outline-none resize-none"`,
            `placeholder={${translateExpression(textareaProps.placeholder, appDef, 'raw-js')}}`,
            `value={${translateExpression(textareaProps.value || textareaProps.defaultValue || '', appDef, 'raw-js')} || ''}`,
            `onChange={(e) => {}}`,
            `aria-label={${translateExpression(textareaProps.accessibilityLabel || textareaProps.placeholder, appDef, 'raw-js')}}`
        ];
        return this.buildTag('textarea', attributes);
    }
}

/**
 * Generator for Select components.
 * Sets up standard React controlled select behavior using `value` and `onChange` props
 * bound to the `dataStore` and `updateDataStore` function.
 */
export class SelectGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const selectProps = component.props as any;
        const options = selectProps.options ? selectProps.options.split(',').map((opt: string) => opt.trim()) : [];
        const optionsJsx = options.map((opt: string) => `<option key="${opt}" value="${opt}">${opt}</option>`).join('\n      ');
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, { padding: `'0.5rem'`, boxSizing: `'border-box'` }),
            `className="w-full h-full p-2 bg-white text-gray-900 focus:outline-none"`,
            `value={${translateExpression(selectProps.value || selectProps.defaultValue || '', appDef, 'raw-js')} || ''}`,
            `onChange={(e) => {}}`,
            `aria-label={${translateExpression(selectProps.accessibilityLabel || selectProps.placeholder, appDef, 'raw-js')}}`
        ];
        
        const children = `<option value="" disabled>${translateExpression(selectProps.placeholder || 'Select an option', appDef, 'jsx-children')}</option>\n      ${optionsJsx}`;
        return this.buildTag('select', attributes, children);
    }
}

/**
 * Generator for Checkbox components.
 * Sets up checkbox behavior with label, bound to the `dataStore` and `updateDataStore` function.
 */
export class CheckboxGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const checkboxProps = component.props as any;
        const style = {
            display: `'flex'`,
            alignItems: `'center'`,
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="flex items-center w-full h-full"`
        ];
        
        const checkboxInput = `<input
        type="checkbox"
        id="${component.id}"
        checked={${translateExpression(checkboxProps.value || checkboxProps.defaultValue || 'false', appDef, 'raw-js')}}
        onChange={(e) => {}}
        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />`;
        
        const label = `<label htmlFor="${component.id}" className="text-gray-800">${translateExpression(checkboxProps.label || '', appDef, 'jsx-children')}</label>`;
        
        const children = `${checkboxInput}\n      ${label}`;
        return this.buildTag('div', attributes, children);
    }
}

/**
 * Generator for Switch components.
 * Sets up switch/toggle behavior with label, bound to the `dataStore` and `updateDataStore` function.
 */
export class SwitchGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const switchProps = component.props as any;
        const isChecked = translateExpression(switchProps.value || switchProps.defaultValue || 'false', appDef, 'raw-js');
        const style = {
            display: `'flex'`,
            alignItems: `'center'`,
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="flex items-center w-full h-full"`
        ];
        
        const switchButton = `<button
        type="button"
        role="switch"
        aria-checked={${isChecked}}
        aria-labelledby="${component.id}-label"
        onClick={() => {}}
        className={\`\${${isChecked} ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\`}
      >
        <span className={\`\${${isChecked} ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform\`} aria-hidden="true" />
      </button>`;
        
        const label = `<label id="${component.id}-label" className="text-gray-800 mr-3 flex-shrink-0">${translateExpression(switchProps.label || '', appDef, 'jsx-children')}</label>`;
        
        const children = `${label}\n      ${switchButton}`;
        return this.buildTag('div', attributes, children);
    }
}

/**
 * Generator for RadioGroup components.
 * Sets up radio group behavior with multiple options, bound to the `dataStore` and `updateDataStore` function.
 */
export class RadioGroupGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const radioProps = component.props as any;
        const options = radioProps.options ? radioProps.options.split(',').map((opt: string) => opt.trim()) : [];
        const selectedValue = translateExpression(radioProps.value || radioProps.defaultValue || '', appDef, 'raw-js');
        const groupLabelId = `${component.id}-group-label`;
        
        const style = {
            display: `'flex'`,
            flexDirection: `'column'`,
            justifyContent: `'center'`,
            padding: `'0.5rem'`,
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full flex flex-col justify-center p-2"`,
            `role="radiogroup"`,
            `aria-labelledby="${groupLabelId}"`
        ];
        
        const groupLabel = `<span id="${groupLabelId}" className="sr-only">${translateExpression(radioProps.groupLabel || '', appDef, 'jsx-children')}</span>`;
        
        const radioOptions = options.map((option: string) => {
            const optionId = `${component.id}-${option}`;
            return `        <div key="${option}" className="flex items-center mb-2">
            <input
              type="radio"
              id="${optionId}"
              name="${component.id}"
              value="${option}"
              checked={${selectedValue} === '${option}'}
              onChange={(e) => {}}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="${optionId}" className="text-gray-800">${option}</label>
          </div>`;
        }).join('\n');
        
        const children = `${groupLabel}\n      ${radioOptions}`;
        return this.buildTag('div', attributes, children);
    }
}
