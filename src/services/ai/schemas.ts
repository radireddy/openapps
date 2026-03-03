import { Type } from "@google/genai";

const componentEnum = [
  'LABEL', 'INPUT', 'BUTTON', 'IMAGE', 'TEXTAREA', 'SELECT', 'CHECKBOX',
  'DIVIDER', 'RADIO_GROUP', 'SWITCH', 'TABLE', 'CONTAINER', 'LIST',
  'DATE_PICKER', 'TIME_PICKER', 'SLIDER', 'FILE_UPLOAD', 'RATING', 'PROGRESS',
];
const variableTypeEnum = ['string', 'number', 'boolean', 'object', 'array'];

const componentPropertiesSchema = {
  type: Type.OBJECT,
  description: "Properties for the component, varies by type.",
  properties: {
    // Layout (flex item)
    width: { type: Type.STRING, description: "CSS width, e.g. '100%', '50%', 'auto', '300px'" },
    height: { type: Type.STRING, description: "CSS height, e.g. 'auto', '40px', '300px'" },
    order: { type: Type.NUMBER, description: "Flex item order (0-based sequence)" },
    flexGrow: { type: Type.NUMBER, description: "Flex grow factor (e.g. 1 to fill available space)" },
    padding: { type: Type.STRING, description: "Padding, e.g. '{{theme.spacing.md}}'" },
    margin: { type: Type.STRING, description: "Margin, e.g. '{{theme.spacing.sm}}'" },

    // Container flex props
    flexDirection: { type: Type.STRING, description: "'row' | 'column' | 'row-reverse' | 'column-reverse'" },
    flexWrap: { type: Type.STRING, description: "'nowrap' | 'wrap' | 'wrap-reverse'" },
    justifyContent: { type: Type.STRING, description: "'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'" },
    alignItems: { type: Type.STRING, description: "'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'" },
    gap: { type: Type.STRING, description: "Gap between children, e.g. '12px', '{{theme.spacing.md}}'" },
    minHeight: { type: Type.STRING, description: "Min height, e.g. '60px'" },

    // Common visual props
    hidden: { type: Type.STRING },
    disabled: { type: Type.STRING },
    backgroundColor: { type: Type.STRING },
    color: { type: Type.STRING },
    fontSize: { type: Type.STRING },
    fontWeight: { type: Type.STRING },
    fontFamily: { type: Type.STRING },
    textAlign: { type: Type.STRING },
    opacity: { type: Type.NUMBER },

    // Text / content
    text: { type: Type.STRING },
    label: { type: Type.STRING },
    placeholder: { type: Type.STRING },
    groupLabel: { type: Type.STRING },

    // Form field props
    inputType: { type: Type.STRING, description: "'text' | 'email' | 'password' | 'number' | 'tel' | 'url'" },
    options: { type: Type.STRING, description: "Comma-separated list of options" },
    rows: { type: Type.NUMBER },
    size: { type: Type.STRING, description: "'sm' | 'md' | 'lg'" },
    required: { type: Type.STRING },
    helpText: { type: Type.STRING },
    layout: { type: Type.STRING, description: "'vertical' | 'horizontal'" },

    // Input event handler props (for INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH, RADIO_GROUP, SLIDER, etc.)
    onChangeActionType: { type: Type.STRING, description: "'none' | 'executeCode' — action to perform when value changes" },
    onChangeCodeToExecute: { type: Type.STRING, description: "Expression to execute on value change, e.g. \"{{ actions.updateVariable('total', Number(event.target.value) * 2) }}\"" },
    onBlurActionType: { type: Type.STRING, description: "'none' | 'executeCode' — action on blur" },
    onBlurCodeToExecute: { type: Type.STRING, description: "Expression to execute on blur" },
    customValidator: { type: Type.STRING, description: "Expression returning error message string or empty string. e.g. \"{{ Number(dataStore.INPUT_age) < 18 ? 'Must be 18+' : '' }}\"" },
    errorMessage: { type: Type.STRING, description: "Custom error message for required field validation" },

    // Button props
    textColor: { type: Type.STRING },
    actionType: { type: Type.STRING, enum: ['alert', 'updateVariable', 'executeCode', 'submitForm', 'navigate'], description: "Button action type. Use 'executeCode' for calculations, 'updateVariable' for simple state updates, 'navigate' for page changes, 'submitForm' for form validation+submit, 'alert' for messages." },
    actionPageId: { type: Type.STRING, description: "Target page ID for navigate action (must match a page id)" },
    variant: { type: Type.STRING, description: "'solid' | 'outlined' | 'ghost' | 'text' (Button variant)" },
    loading: { type: Type.STRING, description: "Loading state (Button: boolean expression; Image: 'lazy'|'eager')" },
    iconLeft: { type: Type.STRING, description: "Icon text/emoji shown before button text" },
    iconRight: { type: Type.STRING, description: "Icon text/emoji shown after button text" },
    fullWidth: { type: Type.BOOLEAN, description: "Whether button takes full container width" },

    // Button action detail props
    actionAlertMessage: { type: Type.STRING, description: "Expression for alert message, e.g. \"Result: {{$vars.result}}\"" },
    actionVariableName: { type: Type.STRING, description: "Variable name to update (for 'updateVariable' action)" },
    actionVariableValue: { type: Type.STRING, description: "Expression for new variable value, e.g. \"{{dataStore.INPUT_a + dataStore.INPUT_b}}\"" },
    actionCodeToExecute: { type: Type.STRING, description: "JavaScript expression to execute, e.g. \"{{ actions.updateVariable('result', Number(dataStore.INPUT_a) + Number(dataStore.INPUT_b)) }}\"" },
    actionOnSubmitCode: { type: Type.STRING, description: "Code to run after successful form submission" },

    // DatePicker props
    dateFormat: { type: Type.STRING, description: "'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD-MM-YYYY'" },
    minDate: { type: Type.STRING, description: "Min selectable date (YYYY-MM-DD) or expression" },
    maxDate: { type: Type.STRING, description: "Max selectable date (YYYY-MM-DD) or expression" },

    // TimePicker props
    timeFormat: { type: Type.STRING, description: "'12h' | '24h'" },
    minuteStep: { type: Type.NUMBER, description: "Minute interval for time picker options (e.g. 15, 30)" },
    showSeconds: { type: Type.BOOLEAN, description: "Whether to show seconds in time picker" },

    // Slider props
    min: { type: Type.NUMBER, description: "Slider/progress minimum value" },
    max: { type: Type.NUMBER, description: "Slider/progress maximum value" },
    step: { type: Type.NUMBER, description: "Slider step increment" },
    defaultValue: { type: Type.NUMBER, description: "Default numeric value for slider/rating" },
    showValue: { type: Type.BOOLEAN, description: "Show current value label" },
    showMinMax: { type: Type.BOOLEAN, description: "Show min/max labels on slider" },

    // FileUpload props
    accept: { type: Type.STRING, description: "Accepted file types, e.g. '.jpg,.png,.pdf'" },
    multiple: { type: Type.BOOLEAN, description: "Allow multiple file uploads" },
    maxFileSize: { type: Type.NUMBER, description: "Max file size in bytes" },

    // Rating props
    maxStars: { type: Type.NUMBER, description: "Number of stars in rating (default 5)" },
    allowHalf: { type: Type.BOOLEAN, description: "Allow half-star ratings" },

    // Progress props
    value: { type: Type.STRING, description: "Current progress value or expression" },
    showLabel: { type: Type.BOOLEAN, description: "Show percentage label on progress bar" },
    barHeight: { type: Type.NUMBER, description: "Height of progress bar in pixels" },
    striped: { type: Type.BOOLEAN, description: "Show striped pattern on progress bar" },
    animated: { type: Type.BOOLEAN, description: "Animate progress bar stripes" },

    // Image props
    src: { type: Type.STRING, description: "Image source URL or expression" },
    alt: { type: Type.STRING, description: "Alt text for accessibility" },
    objectFit: { type: Type.STRING, description: "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'" },
    objectPosition: { type: Type.STRING, description: "Focal point: 'center', 'top', 'bottom left', etc." },
    aspectRatio: { type: Type.STRING, description: "Aspect ratio: 'auto', '1/1', '4/3', '16/9', '9/16'" },
    caption: { type: Type.STRING, description: "Image caption text" },
    captionPosition: { type: Type.STRING, description: "'below' | 'overlay-bottom'" },
    onClick: { type: Type.STRING, description: "Expression to execute on image click" },

    // Table props
    columns: { type: Type.STRING, description: "Format: 'Header:key,Header2:key2'" },

    // Border props
    borderRadius: { type: Type.STRING },
    borderWidth: { type: Type.STRING },
    borderColor: { type: Type.STRING },
    borderStyle: { type: Type.STRING },
  },
};

/**
 * NOTE: patchSchema and templateSchema are NOT sent to the Gemini API at runtime.
 * They exceed Gemini's structured output schema complexity limits (~81 properties per object).
 * Instead, `responseMimeType: "application/json"` ensures valid JSON, and the detailed system
 * instructions guide the model's output format. These schemas are retained for:
 * - Documentation of the expected response structure
 * - Unit test validation of schema completeness
 * - Potential future use if Gemini increases schema limits
 *
 * The themeSchema IS still sent to the API (~35 properties, within limits).
 */
export const patchSchema = {
  type: Type.OBJECT,
  properties: {
    add: {
      type: Type.ARRAY,
      description: "An array of new UI components to add to the page.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A NEW, unique identifier for the component, e.g., 'INPUT_12345'." },
          type: { type: Type.STRING, enum: componentEnum },
          parentId: { type: Type.STRING, description: "The ID of the parent container component. Omit or leave empty for root-level." },
          props: componentPropertiesSchema,
        },
        required: ['id', 'type', 'props']
      }
    },
    update: {
      type: Type.ARRAY,
      description: "An array of updates to apply to existing components.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The ID of the existing component to update." },
          props: componentPropertiesSchema
        },
        required: ['id', 'props']
      }
    },
    delete: {
      type: Type.ARRAY,
      description: "An array of component IDs to delete from the page.",
      items: { type: Type.STRING }
    },
    variables: {
      type: Type.ARRAY,
      description: "An array of new app-level state variables to add.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: variableTypeEnum },
          initialValue: { type: Type.STRING },
        },
        required: ['id', 'name', 'type', 'initialValue']
      }
    },
  },
};

const makeStringProp = (description?: string) => ({
  type: Type.STRING as const,
  ...(description ? { description } : {}),
});

const colorProps = [
  'primary', 'onPrimary', 'secondary', 'onSecondary',
  'background', 'surface', 'surfaceVariant', 'text', 'onSurface', 'onBackground',
  'border', 'outline',
  'primaryLight', 'primaryDark', 'secondaryLight', 'secondaryDark',
  'error', 'onError', 'warning', 'onWarning', 'success', 'onSuccess', 'info', 'onInfo',
  'hover', 'focus', 'disabled', 'onDisabled',
  'shadow', 'overlay', 'link',
];

const colorProperties: Record<string, any> = {};
for (const key of colorProps) {
  colorProperties[key] = { type: Type.STRING as const };
}

export const themeSchema = {
  type: Type.OBJECT,
  description: "A complete application theme with colors.",
  required: ['name', 'type', 'description', 'fontFamily', 'colors'],
  properties: {
    name: makeStringProp("Theme name, e.g. 'Ocean Breeze'"),
    type: { type: Type.STRING, enum: ['light', 'dark'], description: "light or dark theme" },
    description: makeStringProp("One-line description of the aesthetic"),
    fontFamily: makeStringProp("CSS font stack, e.g. 'Inter, system-ui, sans-serif'"),
    colors: {
      type: Type.OBJECT,
      required: colorProps,
      properties: colorProperties,
    },
  },
};

/**
 * Small schema for the second-pass "action wiring" call.
 * Only ~5 properties — well within Gemini's structured output limits.
 * Sent to the API at runtime with responseSchema enforcement.
 */
export const buttonActionSchema = {
  type: Type.OBJECT,
  required: ['buttonActions'],
  properties: {
    buttonActions: {
      type: Type.ARRAY,
      description: "Action code for each button that needs wiring.",
      items: {
        type: Type.OBJECT,
        required: ['buttonId', 'actionType', 'actionCodeToExecute'],
        properties: {
          buttonId: { type: Type.STRING, description: "The exact button component ID to wire, e.g. 'BUTTON_calc'" },
          actionType: { type: Type.STRING, enum: ['executeCode', 'updateVariable', 'submitForm', 'navigate', 'alert'], description: "Action type for the button" },
          actionCodeToExecute: { type: Type.STRING, description: "JavaScript expression wrapped in {{ }}. Use Number(dataStore.COMPONENT_ID) to read numeric inputs. Use actions.updateVariable('name', value) to write results." },
          actionVariableName: { type: Type.STRING, description: "Variable name for 'updateVariable' action type" },
          actionVariableValue: { type: Type.STRING, description: "Expression for 'updateVariable' action type" },
        },
      },
    },
  },
};

export const templateSchema = {
  type: Type.OBJECT,
  description: "An application template with pages, components, and theme. MUST include components for every page.",
  required: ['name', 'description', 'pages', 'components'],
  properties: {
    name: makeStringProp("Template name"),
    description: makeStringProp("What this template is for"),
    pages: {
      type: Type.ARRAY,
      description: "Pages in the application. Each page must have components defined in the components array.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: makeStringProp("Page ID, e.g. 'page_main', 'page_settings'"),
          name: makeStringProp("Page display name"),
        },
        required: ['id', 'name'],
      },
    },
    components: {
      type: Type.ARRAY,
      description: "ALL UI components for ALL pages. Every page must have at least one component. Use pageId to assign components to pages.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: makeStringProp("Unique component ID, e.g. 'LABEL_abc123'"),
          type: { type: Type.STRING, enum: componentEnum },
          parentId: makeStringProp("Parent container ID or empty string for root-level"),
          pageId: makeStringProp("Page ID this component belongs to — must match a page id"),
          props: componentPropertiesSchema,
        },
        required: ['id', 'type', 'pageId', 'props'],
      },
    },
    variables: {
      type: Type.ARRAY,
      description: "App state variables for computed values. Use these to store calculation results, display state, etc. Referenced in expressions as $vars.variableName or just variableName.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: makeStringProp("Unique variable ID, e.g. 'var_result'"),
          name: makeStringProp("Variable name used in expressions, e.g. 'emiResult'"),
          type: { type: Type.STRING, enum: variableTypeEnum, description: "Variable data type" },
          initialValue: makeStringProp("Initial value as string, e.g. '0' for numbers, '' for strings, 'false' for booleans"),
        },
        required: ['id', 'name', 'type', 'initialValue'],
      },
    },
  },
};
