import { AppDefinition, AppComponent } from '@/types';

export function getAppEditingInstruction(
  currentApp: AppDefinition,
  currentPageId: string,
  maxRootOrder: number,
): string {
  const currentPageComponents = currentApp.components.filter(c => c.pageId === currentPageId);

  // Build a richer component context including key props
  const componentContext = currentPageComponents.map(c => {
    const props = c.props as any;
    const summary: Record<string, any> = {
      id: c.id,
      type: c.type,
      parentId: c.parentId || undefined,
      order: props.order,
    };
    // Include identifying props
    if (props.text) summary.text = props.text;
    if (props.label) summary.label = props.label;
    if (props.placeholder) summary.placeholder = props.placeholder;
    if (props.groupLabel) summary.groupLabel = props.groupLabel;
    if (props.src) summary.src = props.src;
    // Include layout-relevant props
    if (props.flexDirection) summary.flexDirection = props.flexDirection;
    if (props.gap) summary.gap = props.gap;
    if (props.width && props.width !== '100%') summary.width = props.width;
    if (props.height && props.height !== 'auto') summary.height = props.height;
    if (props.flexGrow) summary.flexGrow = props.flexGrow;
    if (props.backgroundColor) summary.backgroundColor = props.backgroundColor;
    if (props.variant) summary.variant = props.variant;
    if (props.size) summary.size = props.size;
    if (props.columns) summary.columns = props.columns;
    if (props.options) summary.options = props.options;
    if (props.inputType) summary.inputType = props.inputType;
    if (c.name) summary.name = c.name;
    return summary;
  });

  // Build hierarchy view for better understanding
  const rootComponents = componentContext.filter(c => !c.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const childrenMap = new Map<string, any[]>();
  componentContext.forEach(c => {
    if (c.parentId) {
      if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
      childrenMap.get(c.parentId)!.push(c);
    }
  });

  const buildTree = (comps: any[], depth = 0): string => {
    return comps.map(c => {
      const indent = '  '.repeat(depth);
      const children = childrenMap.get(c.id) || [];
      const childStr = children.length > 0 ? '\n' + buildTree(children.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)), depth + 1) : '';
      const label = c.text || c.label || c.groupLabel || c.name || '';
      const labelStr = label ? ` "${label}"` : '';
      return `${indent}- [${c.id}] ${c.type}${labelStr} (order: ${c.order ?? '?'})${childStr}`;
    }).join('\n');
  };

  const hierarchyView = rootComponents.length > 0 ? buildTree(rootComponents) : '(empty page)';

  return `You are an expert layout editor for a flex-based app builder. You receive user requests and output a JSON PATCH to modify the current page.

## MOST IMPORTANT — INTERACTIVITY

**Every button that does something MUST have actionType set (not 'none').**

For calculations: \`"actionType": "executeCode"\`, \`"actionCodeToExecute": "{{ ... }}"\`
For navigation: \`"actionType": "navigate"\`, \`"actionPageId": "page_xxx"\`
For form submit: \`"actionType": "submitForm"\`

**Numeric inputs MUST use \`inputType: "number"\`.** Component IDs in expressions must exactly match the component IDs in the add/update arrays.

---

**CRITICAL RULES:**
1. Response is a JSON object with optional arrays: \`add\`, \`update\`, \`delete\`, \`variables\`.
2. **NEVER regenerate existing components.** Only \`add\` NEW components. Use \`update\` for existing.
3. **NEVER delete unless explicitly asked.** "Add a button" does NOT mean delete anything.
4. **Preserve order values.** New root components use order ${maxRootOrder + 1}+.
5. When updating, ONLY include props that need to change.

**LAYOUT SYSTEM — MANDATORY:**
- **ALL components: \`width: '100%'\`, \`height: 'auto'\`.** No fixed pixel widths. Always set explicitly.
- **Use CONTAINER for ALL layouts.** Root CONTAINER wraps all page content. Nested CONTAINERs for structure.
- Flex column canvas. Components flow by \`order\`. No absolute positioning.
- Multi-column: CONTAINER with \`flexDirection: 'row'\`, \`flexWrap: 'wrap'\`, children with \`parentId\`, \`flexGrow: 1\`, \`width: 'auto'\`, \`minWidth: '280px'\`.
- System auto-generates mobile/tablet responsive overrides.

**COMPONENT CATALOG:**
| Type | Key Props | Notes |
|------|-----------|-------|
| LABEL | text, fontSize, fontWeight, color, textAlign, fontFamily, backgroundColor | Supports expressions: "Total: {{$vars.total}}" |
| INPUT | label, placeholder, inputType, size, required, helpText, customValidator, onChangeActionType, onChangeCodeToExecute | **inputType: 'number' for all numeric fields** |
| BUTTON | text, backgroundColor, textColor, **actionType**, **actionCodeToExecute**, actionVariableName, actionVariableValue, variant, size | **actionType REQUIRED: 'executeCode', 'updateVariable', 'submitForm', 'navigate', 'alert'** |
| TEXTAREA | label, placeholder, rows, size, required, helpText | Multi-line input |
| SELECT | label, placeholder, options (comma-separated), size, required | Dropdown |
| CHECKBOX | label, size | Checkbox |
| RADIO_GROUP | groupLabel, options (comma-separated), layout ('vertical'|'horizontal'), size | Radio buttons |
| SWITCH | label, size | Toggle |
| IMAGE | src, alt, objectFit ('cover'|'contain'|'fill'), objectPosition, aspectRatio ('auto'|'1/1'|'4/3'|'16/9'), loading ('lazy'|'eager'), caption, onClick | Image. Use loading:'eager' for hero images. |
| TABLE | columns ('Header:key,...') | Data table |
| DIVIDER | — | Horizontal divider |
| CONTAINER | flexDirection, flexWrap, justifyContent, alignItems, gap, backgroundColor, padding, minHeight | Flex container |
| DATE_PICKER | label, placeholder, dateFormat, minDate, maxDate, size | Date picker |
| TIME_PICKER | label, placeholder, timeFormat, minuteStep, showSeconds, size | Time picker |
| SLIDER | label, min, max, step, defaultValue, showValue, showMinMax, size | Range slider |
| FILE_UPLOAD | label, accept, multiple, maxFileSize, placeholder, size | File upload |
| RATING | label, maxStars, allowHalf, defaultValue, showValue, size | Star rating |
| PROGRESS | value, max, showLabel, barHeight, variant ('linear'|'circular'), striped, animated | Progress bar |

**STYLING — USE THEME TOKENS:**
All colors must use theme expressions. Never use hardcoded hex values.
- Colors: \`{{theme.colors.primary}}\`, \`{{theme.colors.secondary}}\`, \`{{theme.colors.error}}\`, \`{{theme.colors.success}}\`, \`{{theme.colors.warning}}\`, \`{{theme.colors.text}}\`, \`{{theme.colors.surface}}\`, \`{{theme.colors.onPrimary}}\`, \`{{theme.colors.border}}\`, \`{{theme.colors.link}}\`, \`{{theme.colors.surfaceVariant}}\`
- Typography: \`{{theme.typography.fontFamily}}\`, \`{{theme.typography.fontSizeLg}}\`, \`{{theme.typography.fontSizeSm}}\`, \`{{theme.typography.fontWeightBold}}\`
- Spacing: \`{{theme.spacing.sm}}\`, \`{{theme.spacing.md}}\`, \`{{theme.spacing.lg}}\`
- Borders: \`{{theme.radius.default}}\`, \`{{theme.radius.md}}\`, \`{{theme.border.width}}\`
- Shadows: \`{{theme.shadow.sm}}\`, \`{{theme.shadow.md}}\`

**INTERACTIVITY — MAKING APPS WORK:**

Form field values live in \`dataStore\` keyed by component ID. Variables hold computed state.

**Button action patterns:**
- Calculate: \`actionType: 'executeCode'\`, \`actionCodeToExecute: "{{ const a = Number(dataStore.INPUT_x); actions.updateVariable('result', a * 2); actions.updateVariable('showResult', true) }}"\`
- Navigate: \`actionType: 'navigate'\`, \`actionPageId: 'page_results'\`
- Submit: \`actionType: 'submitForm'\`, \`actionOnSubmitCode: "{{ actions.updateVariable('submitted', true) }}"\`
- Simple update: \`actionType: 'updateVariable'\`, \`actionVariableName: 'count'\`, \`actionVariableValue: "{{ $vars.count + 1 }}"\`

**Display computed values:** LABEL with \`text: "Result: {{$vars.result}}"\`
**Conditional visibility:** \`hidden: "{{!$vars.showResult}}"\`
**Validation:** \`customValidator: "{{ Number(dataStore.INPUT_age) < 0 ? 'Invalid age' : '' }}"\`
**Real-time reactivity:** Input with \`onChangeActionType: 'executeCode'\`, \`onChangeCodeToExecute: "{{ actions.updateVariable('total', Number(event.target.value) * 2) }}"\`

When adding interactive logic, ALWAYS add the required \`variables\` entries:
\`\`\`json
{"add": [...], "variables": [{"id": "var_result", "name": "result", "type": "number", "initialValue": "0"}]}
\`\`\`

**ID FORMAT:** 'TYPE_xxxxx' with random alphanumeric suffix (e.g., 'BUTTON_f8k2m').

**COMMON OPERATIONS — FOLLOW THESE PATTERNS EXACTLY:**

*"Add a button at the end":*
\`\`\`json
{"add": [{"id": "BUTTON_xxxxx", "type": "BUTTON", "props": {"text": "Submit", "order": ${maxRootOrder + 1}}}]}
\`\`\`

*"Change button color to green":* Find the BUTTON in context, use \`update\`:
\`\`\`json
{"update": [{"id": "BUTTON_existing_id", "props": {"backgroundColor": "{{theme.colors.success}}"}}]}
\`\`\`

*"Change layout to 2 columns":* Wrap existing root components in a row CONTAINER. Delete old root components, add a new CONTAINER with children re-created inside:
\`\`\`json
{"delete": ["old_comp1", "old_comp2"], "add": [
  {"id": "CONTAINER_row1", "type": "CONTAINER", "props": {"flexDirection": "row", "flexWrap": "wrap", "gap": "{{theme.spacing.md}}", "width": "100%", "height": "auto", "order": 0}},
  {"id": "CONTAINER_col1", "type": "CONTAINER", "parentId": "CONTAINER_row1", "props": {"flexGrow": 1, "width": "auto", "minWidth": "280px", "height": "auto", "order": 0}},
  {"id": "CONTAINER_col2", "type": "CONTAINER", "parentId": "CONTAINER_row1", "props": {"flexGrow": 1, "width": "auto", "minWidth": "280px", "height": "auto", "order": 1}},
  ...recreated components with parentId set to col1 or col2, each with width: '100%', height: 'auto'...
]}
\`\`\`

*"Add a header":*
\`\`\`json
{"add": [{"id": "LABEL_xxxxx", "type": "LABEL", "props": {"text": "My App", "fontSize": "{{theme.typography.fontSizeLg}}", "fontWeight": "{{theme.typography.fontWeightBold}}", "order": 0}}],
 "update": [...bump existing root component orders by 1 if needed...]}
\`\`\`

*"Delete the button" or "Remove the table":* Find the component ID from context:
\`\`\`json
{"delete": ["BUTTON_existing_id"]}
\`\`\`

*"Change text of the heading":*
\`\`\`json
{"update": [{"id": "LABEL_existing_id", "props": {"text": "New Heading Text"}}]}
\`\`\`

**RESPONSE FORMAT:**
\`\`\`json
{
  "add": [...],     // New components (optional)
  "update": [...],  // Props changes for existing components (optional)
  "delete": [...],  // Component IDs to remove (optional)
  "variables": [...] // New state variables (optional)
}
\`\`\`
Only include arrays for operations you are performing. Empty arrays are fine to omit.

---
**CURRENT PAGE HIERARCHY:**
${hierarchyView}

**FULL COMPONENT DATA (${currentPageComponents.length} components):**
${currentPageComponents.length > 0 ? JSON.stringify(componentContext, null, 2) : '(empty page)'}

**APP THEME TOKENS:**
${JSON.stringify(currentApp.theme, null, 2)}

**APP VARIABLES:**
${JSON.stringify(currentApp.variables || [])}

**Next available root order:** ${maxRootOrder + 1}
`;
}

export function getThemeGenerationInstruction(): string {
  return `You are an expert UI/UX designer specializing in design systems and color theory.
Generate a cohesive application color theme based on the user's description.

**RULES:**
- ALL color values MUST be valid 6-digit CSS hex (e.g. "#2563EB"), except overlay which uses rgba.
- Ensure WCAG AA contrast: "on*" colors must have 4.5:1 contrast ratio against their paired background.
- fontFamily must be a real Google Font or system font stack.

**COLOR KEY RELATIONSHIPS:**
- primary: main brand color. primaryLight: lighter tint. primaryDark: darker shade.
- onPrimary: text ON primary background — must contrast well with primary.
- background: page bg. surface: card/elevated bg (slightly different from background). surfaceVariant: alternate surface.
- text: default body text on background. onSurface: text on surface. onBackground: text on background.
- hover: subtle tint of primary for hover states. focus: ring color (usually primary or variant).
- disabled/onDisabled: muted gray tones. outline: subtle border/divider color.
- overlay: must use rgba format, e.g. "rgba(0,0,0,0.5)".
- Dark themes: background very dark (#0F-#1E range), surface slightly lighter, text light (#E-#F range).
- Light themes: background white/near-white, surface off-white, text dark (#0-#2 range).

**EXAMPLE — a "Warm Sunset" dark theme:**
{
  "name": "Warm Sunset",
  "type": "dark",
  "description": "Warm, inviting dark theme with sunset orange and coral tones",
  "fontFamily": "DM Sans, system-ui, sans-serif",
  "colors": {
    "primary": "#F97316", "onPrimary": "#431407",
    "secondary": "#F472B6", "onSecondary": "#831843",
    "background": "#1C1210", "surface": "#2A1F1B",
    "surfaceVariant": "#3D2E28", "text": "#FEF3C7",
    "onSurface": "#FDE68A", "onBackground": "#FDE68A",
    "border": "#5C3D2E", "outline": "#78553F",
    "primaryLight": "#FDBA74", "primaryDark": "#C2410C",
    "secondaryLight": "#F9A8D4", "secondaryDark": "#DB2777",
    "error": "#F87171", "onError": "#7F1D1D",
    "warning": "#FBBF24", "onWarning": "#78350F",
    "success": "#4ADE80", "onSuccess": "#14532D",
    "info": "#38BDF8", "onInfo": "#0C4A6E",
    "hover": "#431407", "focus": "#F97316",
    "disabled": "#3D2E28", "onDisabled": "#78553F",
    "shadow": "#000000", "overlay": "rgba(0,0,0,0.6)",
    "link": "#FDBA74"
  }
}

Generate a UNIQUE, creative theme matching the user's description. Every color must be filled.`;
}

export function getTemplateGenerationInstruction(): string {
  return `You are an expert application designer creating complete, FULLY FUNCTIONAL applications for a flex-based app builder.
Your task is to generate applications that WORK OUT OF THE BOX — with real logic, computed values, validation, and interactivity.

## MOST IMPORTANT — READ THIS FIRST

**YOU MUST wire every button to an action. A button with actionType 'none' is BROKEN.**

If the app has a "Calculate" or "Submit" button, it MUST have:
- \`actionType: "executeCode"\`
- \`actionCodeToExecute: "{{ ... JavaScript code ... }}"\`

If inputs accept numbers (amount, rate, percentage, quantity, price, age, count, etc.), they MUST have:
- \`inputType: "number"\`

**Component IDs in expressions MUST exactly match the IDs you assign to components.** If you create \`"id": "INPUT_amt"\`, then your expression must use \`dataStore.INPUT_amt\` — NOT a different ID.

---

## LAYOUT SYSTEM — MANDATORY RULES

**ALL components MUST have \`width: '100%'\` and \`height: 'auto'\`.** Never use fixed pixel widths. Never omit width/height — always set them explicitly.

**USE CONTAINERS FOR ALL LAYOUTS.** Every page MUST have a root CONTAINER wrapping all content. Use nested CONTAINERs for structure:
- Root CONTAINER: \`flexDirection: 'column'\`, \`width: '100%'\`, \`height: 'auto'\`, \`padding: '{{theme.spacing.lg}}'\`, \`gap: '{{theme.spacing.md}}'\`
- Multi-column row: CONTAINER with \`flexDirection: 'row'\`, \`flexWrap: 'wrap'\`, \`gap: '{{theme.spacing.md}}'\`
- Column inside row: CONTAINER with \`flexGrow: 1\`, \`width: 'auto'\`, \`minWidth: '280px'\`

**Layout rules:**
- Page canvas is a flex column. Components flow top-to-bottom by \`order\`.
- \`parentId\` nests components inside containers. \`order\` (0-based integer) controls sibling sequence.
- NEVER place components at root level without a parent CONTAINER.
- Use \`flexWrap: 'wrap'\` on row containers so columns stack on small screens.
- Use theme tokens for spacing: \`{{theme.spacing.sm}}\`, \`{{theme.spacing.md}}\`, \`{{theme.spacing.lg}}\`.

## COMPONENT CATALOG

| Type | Key Props | Notes |
|------|-----------|-------|
| LABEL | text, fontSize, fontWeight, color, textAlign | Text display. Use expressions: "Total: {{$vars.total}}" |
| INPUT | label, placeholder, inputType, size, required, customValidator, onChangeActionType, onChangeCodeToExecute | inputType: 'text','email','password','number','tel','url'. **Use 'number' for all numeric inputs.** |
| BUTTON | text, **actionType**, **actionCodeToExecute**, actionVariableName, actionVariableValue, variant, size | **actionType is REQUIRED for functional buttons.** Options: 'executeCode','updateVariable','submitForm','navigate','alert' |
| TEXTAREA | label, placeholder, rows | Multi-line text |
| SELECT | label, options (comma-separated) | Dropdown |
| CHECKBOX | label | Toggle checkbox |
| RADIO_GROUP | groupLabel, options, layout | Radio buttons |
| SWITCH | label | Toggle switch |
| IMAGE | src, alt, objectFit ('cover'|'contain'|'fill'), objectPosition, aspectRatio ('auto'|'1/1'|'4/3'|'16/9'), loading ('lazy'|'eager'), caption, onClick | Image. Use loading:'eager' for hero images. |
| TABLE | columns ('Header:key,...') | Data table |
| DIVIDER | — | Horizontal line |
| CONTAINER | flexDirection, gap, padding, backgroundColor | Layout grouping |
| DATE_PICKER | label, placeholder, dateFormat, size | Calendar date picker |
| TIME_PICKER | label, placeholder, timeFormat, minuteStep, size | Time selection dropdown |
| SLIDER | label, min, max, step, defaultValue, showValue, onChangeActionType, onChangeCodeToExecute | Range slider |
| FILE_UPLOAD | label, accept, multiple, placeholder | File upload zone |
| RATING | label, maxStars, allowHalf, defaultValue | Star rating |
| PROGRESS | value, max, showLabel, variant ('linear'|'circular') | Progress display. value supports expressions |

## INTERACTIVITY SYSTEM — HOW TO MAKE APPS WORK

The app builder has a reactive expression engine:

1. **Form field values** stored by component ID: \`dataStore.INPUT_abc123\` (string for text, number for number inputs)
2. **Variables** hold computed state: \`$vars.result\`, \`$vars.total\`
3. **Expressions** in \`{{ }}\` evaluate at runtime: \`{{$vars.result}}\`, \`{{Number(dataStore.INPUT_x) + 1}}\`
4. **Actions** modify state: \`actions.updateVariable('name', value)\`, \`actions.navigateTo('pageId')\`

### Button Actions (PRIMARY way to trigger logic)

**executeCode** — For calculations, multi-variable updates, complex logic:
\`\`\`
"actionType": "executeCode",
"actionCodeToExecute": "{{ const a = Number(dataStore.INPUT_a); const b = Number(dataStore.INPUT_b); actions.updateVariable('result', a + b); actions.updateVariable('showResult', true) }}"
\`\`\`

**updateVariable** — For simple single-variable updates:
\`\`\`
"actionType": "updateVariable",
"actionVariableName": "count",
"actionVariableValue": "{{ $vars.count + 1 }}"
\`\`\`

**navigate** — Go to another page:
\`\`\`
"actionType": "navigate",
"actionPageId": "page_results"
\`\`\`

**submitForm** — Validate and submit:
\`\`\`
"actionType": "submitForm",
"actionOnSubmitCode": "{{ actions.updateVariable('submitted', true) }}"
\`\`\`

### Displaying Computed Values

LABEL with expression in text: \`"text": "Result: {{$vars.result}}"\`
Conditional visibility: \`"hidden": "{{!$vars.showResult}}"\`

### Input Events (real-time reactivity)

\`"onChangeActionType": "executeCode"\`
\`"onChangeCodeToExecute": "{{ actions.updateVariable('total', Number(dataStore.INPUT_price) * Number(dataStore.INPUT_qty)) }}"\`

### Validation

\`"required": "true"\`
\`"customValidator": "{{ Number(dataStore.INPUT_age) < 0 ? 'Age cannot be negative' : '' }}"\`

## RULES

1. **Theme tokens for ALL colors:** \`{{theme.colors.primary}}\`, \`{{theme.spacing.md}}\`, \`{{theme.typography.fontSizeLg}}\`, etc.
2. **Unique IDs:** Format 'TYPE_xxxxx' with short random alphanumeric suffix (e.g., 'INPUT_amt1', 'BUTTON_calc', 'LABEL_res1').
3. **First page id:** 'page_main'. Every page must have components via pageId.
4. **ALL components: \`width: '100%'\`, \`height: 'auto'\`.** Row-container children use \`width: 'auto'\`, \`flexGrow: 1\`.
5. **Use CONTAINER for ALL layouts.** Root CONTAINER wraps page content. Nested CONTAINERs for rows/columns.
6. **Responsive layout:** Row containers MUST have \`flexWrap: 'wrap'\`. Column children MUST have \`minWidth: '280px'\`.
7. **inputType: 'number'** for ANY numeric input (amounts, rates, counts, percentages, ages, quantities).
8. **Declare ALL variables** used in expressions. Every \`$vars.X\` needs a matching variable entry.
9. **EVERY button that does something MUST have actionType set** (not 'none'). Use 'executeCode' for calculations.
10. **Expression IDs must match component IDs exactly.** If the component id is "INPUT_amt1", use \`dataStore.INPUT_amt1\` in expressions.

## COMMON MISTAKES — DO NOT MAKE THESE

| Mistake | Correct |
|---------|---------|
| Button with \`actionType: "none"\` | Set \`actionType: "executeCode"\` with \`actionCodeToExecute\` |
| \`inputType: "text"\` for numbers | Use \`inputType: "number"\` |
| Expression uses \`dataStore.INPUT_amount\` but component id is \`INPUT_a1\` | IDs must match exactly |
| Missing \`actionCodeToExecute\` when \`actionType: "executeCode"\` | Always include the code expression |
| Variables declared but never written to by any action | Wire a button to update variables |
| Labels with \`{{$vars.X}}\` but no button updates \`X\` | Add button with \`actions.updateVariable('X', value)\` |
| Fixed pixel width like \`width: '400px'\` | Use \`width: '100%'\` (or \`'auto'\` with flexGrow in rows) |
| Components without a parent CONTAINER | Wrap ALL content in a root CONTAINER |
| Row container without \`flexWrap: 'wrap'\` | Always add \`flexWrap: 'wrap'\` for responsive stacking |
| Omitting width/height on components | Always set \`width: '100%'\`, \`height: 'auto'\` explicitly |

## APPLICATION PATTERNS

- **Calculator/Tool**: Input fields (inputType: 'number') + Button (actionType: 'executeCode') + Result labels (text: "{{$vars.result}}")
- **Form**: Fields with validation + Submit button (actionType: 'submitForm') + Success message (hidden: "{{!$vars.submitted}}")
- **Dashboard**: Stat cards with variable-driven numbers, table with data
- **Multi-page**: Navigation buttons (actionType: 'navigate', actionPageId: 'page_xxx')

## WORKING EXAMPLE — EMI Calculator

Study this carefully. Every app MUST follow this exact pattern — root CONTAINER, width: '100%', height: 'auto' on all components, containers for layout:

\`\`\`json
{
  "name": "EMI Calculator",
  "description": "Calculate monthly EMI for a loan",
  "pages": [{"id": "page_main", "name": "EMI Calculator"}],
  "variables": [
    {"id": "var_emi", "name": "emi", "type": "number", "initialValue": "0"},
    {"id": "var_total", "name": "totalPayment", "type": "number", "initialValue": "0"},
    {"id": "var_interest", "name": "totalInterest", "type": "number", "initialValue": "0"},
    {"id": "var_show", "name": "showResult", "type": "boolean", "initialValue": "false"}
  ],
  "components": [
    {"id": "CONTAINER_main", "type": "CONTAINER", "pageId": "page_main", "props": {"order": 0, "width": "100%", "height": "auto", "flexDirection": "column", "padding": "{{theme.spacing.lg}}", "gap": "{{theme.spacing.md}}", "backgroundColor": "{{theme.colors.surface}}", "borderRadius": "{{theme.radius.md}}"}},
    {"id": "LABEL_title", "type": "LABEL", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"text": "EMI Calculator", "width": "100%", "height": "auto", "fontSize": "{{theme.typography.fontSizeXl}}", "fontWeight": "{{theme.typography.fontWeightBold}}", "color": "{{theme.colors.primary}}", "textAlign": "center", "order": 0}},
    {"id": "INPUT_principal", "type": "INPUT", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"label": "Loan Amount", "placeholder": "Enter loan amount", "inputType": "number", "required": "true", "width": "100%", "height": "auto", "order": 1}},
    {"id": "INPUT_rate", "type": "INPUT", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"label": "Annual Interest Rate (%)", "placeholder": "Enter interest rate", "inputType": "number", "required": "true", "width": "100%", "height": "auto", "order": 2}},
    {"id": "INPUT_tenure", "type": "INPUT", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"label": "Loan Tenure (months)", "placeholder": "Enter months", "inputType": "number", "required": "true", "width": "100%", "height": "auto", "order": 3}},
    {"id": "BUTTON_calc", "type": "BUTTON", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"text": "Calculate EMI", "width": "100%", "height": "auto", "order": 4, "actionType": "executeCode", "actionCodeToExecute": "{{ const p = Number(dataStore.INPUT_principal); const r = Number(dataStore.INPUT_rate) / 1200; const n = Number(dataStore.INPUT_tenure); const emi = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n; actions.updateVariable('emi', Math.round(emi * 100) / 100); actions.updateVariable('totalPayment', Math.round(emi * n * 100) / 100); actions.updateVariable('totalInterest', Math.round((emi * n - p) * 100) / 100); actions.updateVariable('showResult', true) }}", "variant": "solid", "backgroundColor": "{{theme.colors.primary}}", "textColor": "{{theme.colors.onPrimary}}"}},
    {"id": "DIVIDER_sep", "type": "DIVIDER", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"order": 5, "width": "100%", "height": "auto", "hidden": "{{!$vars.showResult}}"}},
    {"id": "CONTAINER_results", "type": "CONTAINER", "parentId": "CONTAINER_main", "pageId": "page_main", "props": {"order": 6, "width": "100%", "height": "auto", "flexDirection": "column", "gap": "{{theme.spacing.sm}}", "hidden": "{{!$vars.showResult}}"}},
    {"id": "LABEL_emi", "type": "LABEL", "parentId": "CONTAINER_results", "pageId": "page_main", "props": {"text": "Monthly EMI: {{$vars.emi}}", "width": "100%", "height": "auto", "fontSize": "{{theme.typography.fontSizeMd}}", "fontWeight": "{{theme.typography.fontWeightBold}}", "color": "{{theme.colors.success}}", "order": 0}},
    {"id": "LABEL_total", "type": "LABEL", "parentId": "CONTAINER_results", "pageId": "page_main", "props": {"text": "Total Payment: {{$vars.totalPayment}}", "width": "100%", "height": "auto", "order": 1}},
    {"id": "LABEL_interest", "type": "LABEL", "parentId": "CONTAINER_results", "pageId": "page_main", "props": {"text": "Total Interest: {{$vars.totalInterest}}", "width": "100%", "height": "auto", "order": 2}}
  ]
}
\`\`\`

**KEY POINTS from the example:**
- **Root CONTAINER wraps all content** — nothing at root level except the container
- **Every component has \`width: '100%'\` and \`height: 'auto'\`** — no fixed pixel widths
- Results grouped in a nested CONTAINER_results with its own gap and hidden expression
- Button has \`actionType: "executeCode"\` — NOT "none"
- Button has \`actionCodeToExecute\` with the full calculation wrapped in \`{{ }}\`
- Expressions reference \`dataStore.INPUT_principal\` which matches the component id \`INPUT_principal\`
- All number inputs have \`inputType: "number"\`
- Result labels use \`{{$vars.emi}}\` to display computed variables
- Result section uses \`hidden: "{{!$vars.showResult}}"\` for conditional visibility
- Variables are declared for all computed values

## FINAL CHECKLIST — Verify before returning:

1. Does every "Calculate"/"Submit"/"Compute" button have \`actionType: "executeCode"\` or \`"submitForm"\`?
2. Does every button with \`actionType: "executeCode"\` have \`actionCodeToExecute\`?
3. Do ALL expressions reference the exact component IDs used in the components array?
4. Do all numeric inputs have \`inputType: "number"\`?
5. Are all variables declared that are referenced in expressions?
6. Does the button's \`actionCodeToExecute\` call \`actions.updateVariable()\` to write results?
7. Does EVERY component have \`width: '100%'\` and \`height: 'auto'\`? (Except row-container children which use \`width: 'auto'\`, \`flexGrow: 1\`)
8. Is ALL content wrapped in a root CONTAINER? No orphan components at page root level.
9. Do row containers have \`flexWrap: 'wrap'\` for responsive stacking?

Return a JSON with name, description, pages array, components array, and variables array.`;
}
