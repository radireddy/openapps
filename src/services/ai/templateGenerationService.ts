import { AppTemplate, AppDefinition, AppComponent, ComponentType, ComponentProps, DataStore } from '@/types';
import { componentRegistry } from '@/components/component-registry/registry';
import { generateAutoResponsiveDefaults } from '@/responsive';
import { defaultLightTheme } from '@/theme-presets';
import { generateStructuredContent } from './geminiClient';
import { buttonActionSchema } from './schemas';
import { getTemplateGenerationInstruction } from './systemInstructions';

const FORM_COMPONENT_TYPES = [
  'INPUT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'SWITCH', 'RADIO_GROUP',
  'DATE_PICKER', 'TIME_PICKER', 'SLIDER', 'FILE_UPLOAD', 'RATING',
];
const BOOLEAN_FORM_TYPES = ['CHECKBOX', 'SWITCH'];
const NUMERIC_FORM_TYPES = ['SLIDER', 'RATING'];

// Labels that suggest the input should be numeric
const NUMERIC_LABEL_PATTERNS = /\b(amount|rate|price|cost|salary|income|percentage|percent|%|number|count|quantity|qty|total|sum|age|year|month|day|weight|height|distance|duration|tenure|period|installment|emi|interest|principal|investment|budget|tax|discount|fee|balance|limit|min|max|score|gpa|celsius|fahrenheit|temperature)\b/i;

/**
 * Post-processes AI-generated components to fix common AI mistakes.
 * Mutates components in place.
 */
export function postProcessComponents(components: AppComponent[]): void {
  const hasVariables = components.length > 0; // Will be checked by caller context

  for (const comp of components) {
    const props = comp.props as any;

    // Fix 1: Auto-correct inputType for numeric inputs
    if (comp.type === 'INPUT' && (!props.inputType || props.inputType === 'text')) {
      const label = (props.label || '') as string;
      const placeholder = (props.placeholder || '') as string;
      if (NUMERIC_LABEL_PATTERNS.test(label) || NUMERIC_LABEL_PATTERNS.test(placeholder)) {
        console.debug(`[Post-Processing] Auto-fixing inputType to 'number' for ${comp.id} (label: "${label}")`);
        props.inputType = 'number';
      }
    }

    // Fix 2: Auto-fix buttons with actionType 'none' that have action-like text
    if (comp.type === 'BUTTON' && (!props.actionType || props.actionType === 'none')) {
      const text = (props.text || '') as string;
      if (/\b(calculate|compute|submit|convert|generate|process|run|execute|evaluate|check|search|find|apply|save|confirm|send|go|login|sign|register|reset|clear|add|remove|delete|update|refresh|load|fetch|pay|buy|order|book|reserve|transfer|compare|sort|filter|export|import|download|upload|verify|validate)\b/i.test(text)) {
        console.warn(`[Post-Processing] Auto-fixing button "${text}" (${comp.id}) from actionType '${props.actionType || 'undefined'}' to 'executeCode'.`);
        props.actionType = 'executeCode';
      }
    }

    // Fix 3: Warn about executeCode buttons missing actionCodeToExecute
    if (comp.type === 'BUTTON' && props.actionType === 'executeCode' && !props.actionCodeToExecute) {
      console.warn(`[Post-Processing] Button "${props.text}" (${comp.id}) has actionType 'executeCode' but no actionCodeToExecute.`);
    }

    // Fix 4: Sanitize garbled string props from Gemini 3 thinking leak
    // Gemini 3 Flash can leak reasoning into string values (e.g. "100%SourceCodeHeight: auto...")
    for (const key of Object.keys(props)) {
      if (typeof props[key] === 'string' && props[key].length > 200) {
        console.warn(`[Post-Processing] Sanitizing garbled prop "${key}" on ${comp.id} (length: ${props[key].length})`);
        delete props[key];
      }
    }

    // Fix 5: Enforce width: '100%' and height: 'auto' on all components
    // Row-container children with flexGrow should keep width: 'auto'
    const isRowChild = comp.parentId && components.some(
      c => c.id === comp.parentId && (c.props as any).flexDirection === 'row'
    );
    const isValidCssSize = (v: string) => /^(\d+(%|px|rem|em|vw|vh)|auto|fit-content|max-content|min-content|\{\{.+\}\})$/.test(v.trim());
    if (!props.width || (typeof props.width === 'string' && !isValidCssSize(props.width))) {
      props.width = isRowChild && props.flexGrow ? 'auto' : '100%';
    }
    if (!props.height || (typeof props.height === 'string' && !isValidCssSize(props.height))) {
      props.height = 'auto';
    }

    // Fix 6: Auto-set loading='eager' for the first IMAGE on a page (likely hero/LCP)
    if (comp.type === 'IMAGE' && !props.loading) {
      const isFirstImage = !components.slice(0, components.indexOf(comp)).some(c => c.type === 'IMAGE');
      props.loading = isFirstImage ? 'eager' : 'lazy';
    }
  }
}

/**
 * Second-pass AI call to wire button actions when the first pass fails to generate them.
 * Uses a tiny schema (~5 properties) that fits within Gemini's structured output limits.
 * Mutates components in place.
 */
export async function wireButtonActions(
  components: AppComponent[],
  variables: Array<{ name: string; type: string }>,
  originalPrompt: string,
): Promise<void> {
  const buttonsNeedingCode = components.filter(c =>
    c.type === 'BUTTON' &&
    (c.props as any).actionType === 'executeCode' &&
    !(c.props as any).actionCodeToExecute
  );

  if (buttonsNeedingCode.length === 0) return;

  // Build focused context: only the info needed to generate action code
  const inputComponents = components.filter(c =>
    FORM_COMPONENT_TYPES.includes(c.type)
  );

  const context = {
    buttons: buttonsNeedingCode.map(b => ({
      id: b.id,
      text: (b.props as any).text || '',
    })),
    inputs: inputComponents.map(i => ({
      id: i.id,
      type: i.type,
      label: (i.props as any).label || '',
      inputType: (i.props as any).inputType || 'text',
    })),
    variables: variables.map(v => ({
      name: v.name,
      type: v.type,
    })),
  };

  const systemInstruction = `You generate JavaScript action code for buttons in a low-code app builder.

RULES:
- Read input values with: Number(dataStore.COMPONENT_ID) for numbers, dataStore.COMPONENT_ID for strings
- Update variables with: actions.updateVariable('variableName', value)
- Wrap ALL code in {{ }}: "{{ const x = Number(dataStore.INPUT_a); actions.updateVariable('result', x * 2) }}"
- Use Number() to convert all dataStore values used in math
- Component IDs in dataStore MUST match exactly the input IDs provided
- Variable names in actions.updateVariable MUST match exactly the variable names provided

EXAMPLE — EMI Calculator button:
"{{ const p = Number(dataStore.INPUT_principal); const r = Number(dataStore.INPUT_rate) / 1200; const n = Number(dataStore.INPUT_tenure); const emi = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n; actions.updateVariable('emi', Math.round(emi * 100) / 100); actions.updateVariable('totalPayment', Math.round(emi * n * 100) / 100); actions.updateVariable('totalInterest', Math.round((emi * n - p) * 100) / 100); actions.updateVariable('showResult', true) }}"`;

  const prompt = `The user asked to build: "${originalPrompt}"

Here are the buttons that need action code, the available inputs, and the state variables:

${JSON.stringify(context, null, 2)}

Generate actionCodeToExecute for each button. The code must read from the input dataStore values and write computed results to the variables using actions.updateVariable().`;

  try {
    console.debug(`[Action Wiring] Making second-pass call for ${buttonsNeedingCode.length} button(s)...`);

    const result = await generateStructuredContent({
      systemInstruction,
      prompt,
      responseSchema: buttonActionSchema,
    });

    if (result?.buttonActions && Array.isArray(result.buttonActions)) {
      for (const action of result.buttonActions) {
        if (!action.buttonId || !action.actionCodeToExecute) continue;

        const button = components.find(c => c.id === action.buttonId);
        if (button) {
          const props = button.props as any;
          props.actionType = action.actionType || 'executeCode';
          props.actionCodeToExecute = action.actionCodeToExecute;
          if (action.actionVariableName) props.actionVariableName = action.actionVariableName;
          if (action.actionVariableValue) props.actionVariableValue = action.actionVariableValue;
          console.debug(`[Action Wiring] Wired button "${props.text}" (${button.id}) with actionType '${props.actionType}'`);
        }
      }
    }
  } catch (err) {
    console.warn('[Action Wiring] Second-pass call failed, buttons may lack actions:', err);
  }
}

/**
 * Generates an application template from a natural language description.
 */
export async function generateTemplate(prompt: string): Promise<AppTemplate> {
  const systemInstruction = getTemplateGenerationInstruction();

  const result = await generateStructuredContent({
    systemInstruction,
    prompt,
  });

  // Lightweight validation: result must be an object with components
  if (!result || typeof result !== 'object') {
    throw new Error('AI returned an invalid response: expected an object');
  }

  console.debug('[Template Generation] AI response:', JSON.stringify(result, null, 2));

  const pages = Array.isArray(result.pages) && result.pages.length > 0
    ? result.pages
    : [{ id: 'page_main', name: 'Main' }];

  // Build a set of valid page IDs for validation
  const validPageIds = new Set(pages.map((p: { id: string }) => p.id));

  const components: AppComponent[] = (result.components || [])
    .map((comp: any) => {
      if (!comp || !comp.id || !comp.type) return null;

      const plugin = componentRegistry[comp.type as ComponentType];
      if (!plugin) {
        console.warn(`[Template Generation] Unknown component type "${comp.type}", skipping.`);
        return null;
      }
      const defaultProps = plugin.paletteConfig.defaultProps || {};
      const aiProps = comp.props || {};

      delete aiProps.x;
      delete aiProps.y;

      // Validate pageId — fall back to first page if invalid
      const pageId = (comp.pageId && validPageIds.has(comp.pageId))
        ? comp.pageId
        : pages[0].id;

      const finalComp: AppComponent = {
        id: comp.id,
        type: comp.type,
        parentId: comp.parentId || null,
        pageId,
        props: {
          ...defaultProps,
          ...aiProps,
        } as ComponentProps,
      };

      // Generate auto-responsive defaults (mobile-first overrides)
      const autoResult = generateAutoResponsiveDefaults(finalComp);
      if (autoResult) {
        if (autoResult.baseOverrides) {
          finalComp.props = { ...finalComp.props, ...autoResult.baseOverrides } as ComponentProps;
        }
        if (autoResult.responsive) {
          const existing = (finalComp.props as any).responsive || {};
          finalComp.props = {
            ...finalComp.props,
            responsive: {
              tablet: { ...existing.tablet, ...autoResult.responsive.tablet },
              desktop: { ...existing.desktop, ...autoResult.responsive.desktop },
              large: { ...existing.large, ...autoResult.responsive.large },
            },
          } as ComponentProps;
        }
      }

      return finalComp;
    })
    .filter((c): c is AppComponent => c !== null);

  if (components.length === 0) {
    console.warn('[Template Generation] AI returned no valid components. The generated app will be empty.');
  } else {
    console.debug(`[Template Generation] Processed ${components.length} components across ${pages.length} pages.`);
  }

  // Post-processing: auto-fix common AI mistakes
  postProcessComponents(components);

  // Initialize dataStore for form components so they work immediately
  const dataStore: DataStore = {};
  components.forEach(comp => {
    if (FORM_COMPONENT_TYPES.includes(comp.type)) {
      if (BOOLEAN_FORM_TYPES.includes(comp.type)) {
        dataStore[comp.id] = false;
      } else if (NUMERIC_FORM_TYPES.includes(comp.type)) {
        dataStore[comp.id] = ((comp.props as any).defaultValue ?? 0);
      } else {
        dataStore[comp.id] = '';
      }
    }
  });
  // Process variables from AI response
  const variables = Array.isArray(result.variables)
    ? result.variables
        .filter((v: any) => v && v.id && v.name && v.type)
        .map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          initialValue: v.type === 'number' ? Number(v.initialValue) || 0
            : v.type === 'boolean' ? v.initialValue === 'true'
            : v.initialValue ?? '',
        }))
    : [];

  // Initialize dataStore with variable initial values (keyed by variable name)
  variables.forEach((v: any) => {
    dataStore[v.name] = v.initialValue;
  });

  // Second-pass: wire button actions if any buttons lack actionCodeToExecute
  await wireButtonActions(components, variables, prompt);

  const appDefinition: AppDefinition = {
    id: '',
    name: result.name || 'AI Generated App',
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    pages,
    mainPageId: pages[0].id,
    components,
    dataStore,
    variables,
    theme: defaultLightTheme,
  };

  return {
    id: `template_${Date.now()}`,
    name: result.name || 'AI Generated Template',
    description: result.description || `Generated from: "${prompt}"`,
    imageUrl: '',
    appDefinition,
  };
}
