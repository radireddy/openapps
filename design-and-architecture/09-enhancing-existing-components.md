# Enhancing Existing Components with New Properties

This guide walks you through adding new properties to an existing component. For creating entirely new components, see [07-creating-new-components.md](./07-creating-new-components.md).

## Overview

Adding properties to an existing component touches multiple layers of the system. Unlike creating a new component (which is mostly additive), enhancing an existing one requires updating the AI generation layer, maintaining backward compatibility, and ensuring theme integration.

## Step-by-Step Process

### Step 1: Update Type Definition

Add new optional properties to the component's interface in `src/types.ts`:

```typescript
// Before
export interface ImageProps extends BaseProps, BorderProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

// After — all new properties are OPTIONAL to maintain backward compatibility
export interface ImageProps extends BaseProps, BorderProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;  // NEW
  aspectRatio?: string;     // NEW
}
```

**Rules:**
- All new properties MUST be optional (`?`) to preserve backward compatibility with saved `AppDefinition` objects
- Use union types for constrained values (e.g., `'lazy' | 'eager'`)
- Group related properties with comments

### Step 2: Update Property Schema

Add `PropertyMetadata` entries to the component's schema file in `src/components/properties/schemas/<component>.ts`:

```typescript
const newProperties: PropertyMetadata[] = [
  {
    id: 'objectPosition',           // Must match the props interface field name
    label: 'Object Position',
    type: 'dropdown',
    defaultValue: 'center',
    group: 'Basic',                  // Existing or new group
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 3,                // Order within the group (after existing properties)
    applicableTo: [ComponentType.IMAGE],
    options: [
      { value: 'center', label: 'Center' },
      { value: 'top', label: 'Top' },
      // ...
    ],
    tooltip: 'Which part of the image is visible when cropped',
  },
];
```

**Adding new groups:**

If your properties need a new group, define it and add to the schema:

```typescript
const newGroups: PropertyGroup[] = [
  { id: 'Filters', label: 'Filters', tab: 'General', order: 2, collapsible: true },
];

export const imageSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.IMAGE,
  [...existingProperties, ...newProperties],
  commonTabs,
  [...commonGroups, ...existingGroups, ...newGroups]
);
```

**Conditional visibility:**

Properties that depend on other property values:

```typescript
{
  id: 'captionPosition',
  label: 'Caption Position',
  type: 'dropdown',
  visibleIf: (props) => !!(props as any).caption,  // Only show when caption is set
  // ...
}
```

### Step 3: Update Default Props

In the component's plugin file (`src/components/component-registry/<Component>.tsx`), update `paletteConfig.defaultProps`:

```typescript
defaultProps: {
  ...commonStylingProps,
  // Existing defaults
  src: 'https://picsum.photos/200/200',
  // New defaults — use theme tokens where applicable
  objectPosition: 'center',
  loading: 'lazy',
  captionPosition: 'below',
  backgroundColor: '{{theme.colors.surfaceVariant}}',  // Theme token
},
```

**Theming rules:**
- Colors MUST use theme tokens: `{{theme.colors.*}}`
- Shadows SHOULD map to theme tokens: `{{theme.shadow.*}}`
- Spacing SHOULD use theme tokens: `{{theme.spacing.*}}`
- Numeric values (blur, scale, opacity) use raw numbers (no theming needed)

### Step 4: Update Renderer

Modify the component's renderer to use the new properties:

```typescript
const ImageRenderer: React.FC<{...}> = ({ component, evaluationScope }) => {
  const p = component.props;

  // Evaluate expression-supported properties
  const caption = useJavaScriptRenderer(p.caption, evaluationScope, '');

  // Build conditional styles
  const filterStyle = buildFilterString(p.filterBlur, p.filterGrayscale, p.filterBrightness);

  // Conditionally wrap in <figure> for caption
  const Wrapper = caption ? 'figure' : 'div';

  return (
    <Wrapper>
      <img
        src={src}
        alt={alt}
        loading={p.loading || 'lazy'}
        style={{ objectFit: p.objectFit, objectPosition: p.objectPosition, ...filterStyle }}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </Wrapper>
  );
};
```

**Pattern guidelines:**
- Use `useJavaScriptRenderer` for properties that support expressions
- Only add DOM elements conditionally (don't render empty wrappers)
- Add event listeners only when handlers are non-empty
- Use CSS transitions for hover effects (not JS animations)

### Step 5: Update AI System Instructions

In `src/services/ai/systemInstructions.ts`, update the component's entry in the component catalog:

```typescript
// In the component catalog table within getAppEditingInstruction()
// Before:
// | IMAGE | src, alt, objectFit |

// After:
// | IMAGE | src, alt, objectFit, objectPosition, aspectRatio, loading, caption, onClick |
```

**Rules:**
- Only list properties the AI should commonly generate
- Skip design-time-only properties (filters, hover effects) — these are for manual design, not AI generation
- Include properties that affect layout and content (caption, loading, aspectRatio)
- Include event properties (onClick) so AI can wire interactivity

### Step 6: Update AI Schema

In `src/services/ai/schemas.ts`, add new properties to `componentPropertiesSchema`:

```typescript
// Add to the properties object in componentPropertiesSchema
objectPosition: { type: 'STRING', description: 'Image focal point: center, top, bottom, left, right' },
aspectRatio: { type: 'STRING', description: 'Aspect ratio: auto, 1/1, 4/3, 16/9' },
loading: { type: 'STRING', description: 'Loading strategy: lazy (default) or eager (for hero images)' },
caption: { type: 'STRING', description: 'Image caption text' },
```

### Step 7: Update AI Post-Processing (if needed)

In `src/services/ai/templateGenerationService.ts`, add auto-correction rules if the AI commonly makes mistakes with the new properties:

```typescript
// Example: Auto-set loading="eager" for the first image on a page (likely hero/LCP)
if (comp.type === 'IMAGE' && isFirstImageOnPage) {
  comp.props.loading = 'eager';
}
```

Only add post-processing when there's a clear pattern of AI mistakes to correct. Don't over-engineer this step.

### Step 8: Write Unit Tests

Expand the component's test file in `src/components/component-registry/<Component>.test.tsx`:

```typescript
describe('New property: objectPosition', () => {
  it('should apply object-position style', () => {
    const comp = { ...baseComponent, props: { ...baseComponent.props, objectPosition: 'top-left' } };
    render(<ImageRenderer component={comp} evaluationScope={{}} />);
    const img = screen.getByAltText('An example image');
    expect(img).toHaveStyle('object-position: top left');
  });

  it('should default to center when not specified', () => {
    render(<ImageRenderer component={baseComponent} evaluationScope={{}} />);
    const img = screen.getByAltText('An example image');
    expect(img).toHaveStyle('object-position: center');
  });
});
```

**Test categories for new properties:**
1. Property applies the expected CSS/attribute/behavior
2. Default value works correctly when property is omitted (backward compatibility)
3. Expression evaluation works (if `supportsExpression: true`)
4. Conditional rendering (e.g., caption only shows when non-empty)
5. Edge cases (empty strings, boundary values for sliders)

### Step 9: Update Capability Matrix (if applicable)

If the component is in the capability matrix (`src/components/component-registry/__tests__/test-utils/capability-matrix.ts`), add effect mappings for new properties:

```typescript
// Add expected effects for properties
{ id: 'caption', expectedEffects: ['componentShouldHaveText'] },
{ id: 'onClick', expectedEffects: [] },  // Custom assertion needed
```

If the component is NOT in the matrix, consider adding it.

### Step 10: Write E2E Tests

Create or update E2E tests in `e2e/`:

```typescript
test('Image: objectPosition property changes focal point', async ({ page }) => {
  // 1. Add Image to canvas
  // 2. Select it
  // 3. Change objectPosition in properties panel
  // 4. Verify the image style updates in canvas/preview
});
```

**E2E test naming convention:** `<Component>: <property> <expected behavior>`

### Step 11: Update Documentation

- Add `// DOCS_IMPACT:` comment at the top of changed files
- Update the component's section in `USER_GUIDE.md` if it affects user-facing behavior
- Update `DEVELOPER_GUIDE.md` if architectural patterns changed

## Complete Checklist

Copy this checklist when enhancing a component:

```
- [ ] 1. Update props interface in `src/types.ts` (all new props optional)
- [ ] 2. Update property schema in `src/components/properties/schemas/<component>.ts`
- [ ] 3. Update `defaultProps` in component plugin (use theme tokens for colors/shadows/spacing)
- [ ] 4. Update renderer in `src/components/component-registry/<Component>.tsx`
- [ ] 5. Update AI component catalog in `src/services/ai/systemInstructions.ts`
- [ ] 6. Update AI schema in `src/services/ai/schemas.ts`
- [ ] 7. Update AI post-processing in `src/services/ai/templateGenerationService.ts` (if needed)
- [ ] 8. Write/expand unit tests in `<Component>.test.tsx`
- [ ] 9. Update capability matrix (if component is in the matrix)
- [ ] 10. Write/expand E2E tests
- [ ] 11. Update documentation (DOCS_IMPACT comments, user guide, dev guide)
- [ ] 12. Run full test suite (`npm test`) to verify no regressions
```

## Backward Compatibility

**Golden rule:** Saved `AppDefinition` objects that don't include the new properties must continue to work without any changes.

This is automatically satisfied when:
1. All new properties are optional in the TypeScript interface
2. The renderer handles missing/undefined properties gracefully (uses defaults)
3. Default props are set in `paletteConfig.defaultProps` (for newly created components)
4. Property schema has `defaultValue` set (for the properties panel)

## Theming Integration

When adding properties, consider whether they should use theme tokens:

| Property type | Should use theme? | Example |
|---|---|---|
| Colors | Yes, always | `{{theme.colors.text}}` |
| Shadows | Yes, prefer presets | Map `sm`/`md`/`lg` to `theme.shadow.*` |
| Spacing | Yes, for defaults | `{{theme.spacing.md}}` |
| Border radius | Yes, for defaults | `{{theme.radius.default}}` |
| Font size/weight | Yes, for text | `{{theme.typography.fontSizeMd}}` |
| Numeric values | No | Blur amount, scale factor, opacity |
| Enum values | No | Object-fit, loading strategy |

## Common Patterns

### Adding a slider property

```typescript
// Schema
{
  id: 'filterBlur',
  label: 'Blur',
  type: 'number',
  defaultValue: 0,
  group: 'Filters',
  tab: 'General',
  // min/max/step control the slider behavior
  validationRules: [{ type: 'range', min: 0, max: 20 }],
  tooltip: 'Blur amount in pixels',
}
```

### Adding an expression property

```typescript
// Schema
{
  id: 'caption',
  label: 'Caption',
  type: 'expression',
  defaultValue: '',
  supportsExpression: true,
  tooltip: 'Caption text (supports {{expressions}})',
}

// Renderer
const caption = useJavaScriptRenderer(p.caption, evaluationScope, '');
```

### Adding a conditional property

```typescript
{
  id: 'captionPosition',
  label: 'Position',
  type: 'dropdown',
  visibleIf: (props) => !!(props as any).caption,
  options: [
    { value: 'below', label: 'Below' },
    { value: 'overlay-bottom', label: 'Overlay Bottom' },
  ],
}
```

### Adding a click event

```typescript
// Schema
{
  id: 'onClick',
  label: 'On Click',
  type: 'expression',
  supportsExpression: true,
  group: 'Events',
  tab: 'General',
  tooltip: 'JavaScript expression to execute on click',
}

// Renderer
const handleClick = p.onClick ? () => safeEval(p.onClick, evaluationScope) : undefined;
return <img onClick={handleClick} style={{ cursor: p.onClick ? 'pointer' : undefined }} />;
```
