import { test, expect } from '@playwright/test';

/**
 * E2E tests for AI-generated app interactivity.
 *
 * These tests inject pre-built app definitions (simulating what AI generates)
 * into localStorage and verify the full runtime pipeline:
 * input → button action → variable update → expression evaluation → label update
 */

const CALCULATOR_APP = {
  id: 'test-calculator',
  name: 'E2E Calculator Test',
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  pages: [{ id: 'page_main', name: 'Calculator' }],
  mainPageId: 'page_main',
  components: [
    {
      id: 'CONTAINER_main',
      type: 'CONTAINER',
      parentId: null,
      pageId: 'page_main',
      props: {
        order: 0,
        padding: '16px',
        gap: '12px',
        flexDirection: 'column',
        width: '100%',
        height: 'auto',
        minHeight: '60px',
        backgroundColor: '#ffffff',
        borderWidth: '1px',
        borderColor: '#e0e0e0',
        borderRadius: '8px',
      },
    },
    {
      id: 'LABEL_title',
      type: 'LABEL',
      parentId: 'CONTAINER_main',
      pageId: 'page_main',
      props: {
        text: 'Simple Calculator',
        fontSize: '24px',
        fontWeight: 'bold',
        order: 0,
        width: '100%',
        height: 'auto',
      },
    },
    {
      id: 'INPUT_a',
      type: 'INPUT',
      parentId: 'CONTAINER_main',
      pageId: 'page_main',
      props: {
        label: 'Number A',
        placeholder: 'Enter first number',
        inputType: 'number',
        required: 'true',
        order: 1,
        width: '100%',
        height: 'auto',
        size: 'md',
      },
    },
    {
      id: 'INPUT_b',
      type: 'INPUT',
      parentId: 'CONTAINER_main',
      pageId: 'page_main',
      props: {
        label: 'Number B',
        placeholder: 'Enter second number',
        inputType: 'number',
        required: 'true',
        order: 2,
        width: '100%',
        height: 'auto',
        size: 'md',
      },
    },
    {
      id: 'BUTTON_add',
      type: 'BUTTON',
      parentId: 'CONTAINER_main',
      pageId: 'page_main',
      props: {
        text: 'Add',
        order: 3,
        actionType: 'executeCode',
        actionCodeToExecute: "{{ const a = Number($form.INPUT_a.value); const b = Number($form.INPUT_b.value); actions.updateVariable('result', a + b); actions.updateVariable('showResult', true) }}",
        variant: 'solid',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        width: '100%',
        height: 'auto',
        size: 'md',
      },
    },
    {
      id: 'LABEL_result',
      type: 'LABEL',
      parentId: 'CONTAINER_main',
      pageId: 'page_main',
      props: {
        text: 'Result: {{$vars.result}}',
        fontSize: '20px',
        fontWeight: 'bold',
        order: 4,
        hidden: '{{!$vars.showResult}}',
        width: '100%',
        height: 'auto',
      },
    },
  ],
  dataStore: {
    INPUT_a: '',
    INPUT_b: '',
    result: 0,
    showResult: false,
  },
  variables: [
    { id: 'var_result', name: 'result', type: 'number', initialValue: 0 },
    { id: 'var_show', name: 'showResult', type: 'boolean', initialValue: false },
  ],
  theme: {
    colors: {
      primary: '#2563eb', onPrimary: '#ffffff', secondary: '#7c3aed', onSecondary: '#ffffff',
      background: '#ffffff', surface: '#f9fafb', surfaceVariant: '#f3f4f6',
      text: '#111827', onSurface: '#1f2937', onBackground: '#1f2937',
      border: '#e5e7eb', outline: '#d1d5db',
      primaryLight: '#93bbfd', primaryDark: '#1d4ed8',
      secondaryLight: '#c4b5fd', secondaryDark: '#5b21b6',
      error: '#ef4444', onError: '#ffffff', warning: '#f59e0b', onWarning: '#ffffff',
      success: '#10b981', onSuccess: '#ffffff', info: '#3b82f6', onInfo: '#ffffff',
      hover: '#eff6ff', focus: '#2563eb', disabled: '#e5e7eb', onDisabled: '#9ca3af',
      shadow: '#000000', overlay: 'rgba(0,0,0,0.5)', link: '#2563eb',
    },
    font: { family: 'Inter, system-ui, sans-serif' },
    border: { width: '1px', widthThin: '1px', widthMedium: '2px', widthThick: '3px' },
    radius: { default: '6px', none: '0px', sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px', xxxl: '64px', xxxxl: '96px' },
    typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSizeSm: '14px', fontSizeMd: '16px', fontSizeLg: '24px', fontWeightBold: 'bold', fontWeightNormal: 'normal' },
    shadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.15)', inner: 'inset 0 2px 4px rgba(0,0,0,0.05)' },
    transition: { durationFast: '150ms', durationNormal: '200ms', durationSlow: '300ms', easing: 'ease-in-out' },
  },
};

test.describe('AI-Generated App Interactivity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('Calculator: inputs accept values, button computes result, label displays it', async ({ page }) => {
    // Inject the calculator app into localStorage using the correct storage keys
    await page.evaluate((app) => {
      const metadata = { id: app.id, name: app.name, createdAt: app.createdAt, lastModifiedAt: app.lastModifiedAt };
      window.localStorage.setItem('gemini-low-code-apps-index', JSON.stringify([metadata]));
      window.localStorage.setItem(`gemini-low-code-app-${app.id}`, JSON.stringify(app));
    }, CALCULATOR_APP);

    await page.goto('/');

    // Open the calculator app
    const appCard = page.locator('text=E2E Calculator Test').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });
    await appCard.click();

    // Wait for editor to load
    await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 10000 });

    // Switch to preview mode
    const previewBtn = page.getByRole('button', { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Find inputs and fill them
    const inputA = page.locator('input[type="number"]').first();
    const inputB = page.locator('input[type="number"]').nth(1);

    await inputA.click();
    await inputA.fill('10');
    await page.waitForTimeout(200);
    await inputB.click();
    await inputB.fill('20');
    await page.waitForTimeout(300);

    // Click the Add button
    const addButton = page.getByRole('button', { name: 'Add' });
    await addButton.click();

    // Verify the result label appears and shows correct value
    await expect(page.locator('text=Result: 30')).toBeVisible({ timeout: 5000 });
  });

  test('Calculator: result label is hidden before calculation', async ({ page }) => {
    await page.evaluate((app) => {
      const metadata = { id: app.id, name: app.name, createdAt: app.createdAt, lastModifiedAt: app.lastModifiedAt };
      window.localStorage.setItem('gemini-low-code-apps-index', JSON.stringify([metadata]));
      window.localStorage.setItem(`gemini-low-code-app-${app.id}`, JSON.stringify(app));
    }, CALCULATOR_APP);

    await page.goto('/');

    const appCard = page.locator('text=E2E Calculator Test').first();
    await expect(appCard).toBeVisible({ timeout: 5000 });
    await appCard.click();

    await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 10000 });

    // Switch to preview
    const previewBtn = page.getByRole('button', { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Result label should NOT be visible initially (hidden: "{{!$vars.showResult}}")
    const resultLabel = page.locator('text=/Result:.*0/');
    await expect(resultLabel).not.toBeVisible({ timeout: 2000 });
  });
});
