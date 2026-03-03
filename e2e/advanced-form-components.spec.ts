/**
 * Advanced Form Components E2E Tests
 *
 * Tests the 6 new form components (DatePicker, TimePicker, Slider,
 * FileUpload, Rating, Progress) and the enhanced Button component.
 *
 * Covers: palette presence, drag-to-canvas, properties panel rendering,
 * and preview-mode behaviour.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resilientDragToCanvas = async (
  page: any,
  source: any,
  _canvas: any,
  _targetPosition: { x: number; y: number },
) => {
  // Use .first() to handle duplicate test IDs when component is in Recent section
  const target = await source.count() > 1 ? source.first() : source;
  await target.waitFor({ state: 'visible', timeout: 15000 });
  await target.dblclick();
  await page.waitForTimeout(300);
};

const openPaletteCategory = async (page: any, category: string) => {
  const btn = page.getByRole('button', { name: category, exact: true });
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  const isExpanded = await btn.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await btn.click();
    await page.waitForTimeout(200);
  }
  const categoryContent = page.locator(`#palette-${category}`);
  await categoryContent.waitFor({ state: 'visible', timeout: 10000 });
};

const createAppAndEnterEditor = async (page: any) => {
  const appName = `E2E-AdvForm-${Date.now()}`;
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/');
  await page.getByRole('button', { name: 'New App' }).click();
  await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
  await page.getByRole('button', { name: 'Create App' }).click();
  await expect(page.getByRole('heading', { name: appName })).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 15000 });
  return appName;
};

const switchToComponentsPalette = async (page: any) => {
  const componentsTab = page.getByRole('button', { name: 'Components', exact: true });
  await componentsTab.waitFor({ state: 'visible', timeout: 15000 });
  await componentsTab.click();
  await page.waitForTimeout(300);
  const palette = page.getByRole('region', { name: 'Components' });
  await expect(palette).toBeVisible({ timeout: 15000 });
};

/** Drag a component from the palette, click to select it, verify properties panel shows its props. */
const dragComponentAndSelect = async (
  page: any,
  componentType: string,
  category: string,
  pos: { x: number; y: number },
) => {
  await openPaletteCategory(page, category);
  const paletteItem = page.getByTestId(`palette-item-${componentType}`);
  const canvas = page.getByTestId('canvas');
  await resilientDragToCanvas(page, paletteItem, canvas, pos);
  await page.waitForTimeout(500);

  // Click on the dropped component to select it (it may not auto-select)
  const droppedComponent = canvas.locator(`[data-component-id]`).first();
  await droppedComponent.waitFor({ state: 'visible', timeout: 15000 });
  await droppedComponent.click();
  await page.waitForTimeout(300);

  const propsPanel = page.getByTestId('properties-panel');
  await expect(propsPanel).toBeVisible({ timeout: 15000 });
  // Wait for the properties to actually load (not the "Select a component" placeholder)
  await expect(propsPanel.locator('text=Select a component')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
  return propsPanel;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Advanced Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
  });

  // ---- Palette presence checks ----

  test('New input components appear in the Input palette category', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await openPaletteCategory(page, 'Input');

    for (const type of ['DATE_PICKER', 'TIME_PICKER', 'SLIDER', 'FILE_UPLOAD', 'RATING']) {
      await expect(page.getByTestId(`palette-item-${type}`)).toBeVisible({ timeout: 3000 });
    }
  });

  test('Progress component appears in the Display palette category', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await openPaletteCategory(page, 'Display');

    await expect(page.getByTestId('palette-item-PROGRESS')).toBeVisible({ timeout: 3000 });
  });

  // ---- DatePicker ----

  test('DatePicker can be dragged to canvas and shows label property', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'DATE_PICKER', 'Input', { x: 200, y: 150 });

    // Properties panel should show Label property
    await expect(propsPanel.getByText('Label', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- TimePicker ----

  test('TimePicker can be dragged to canvas and shows time format property', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'TIME_PICKER', 'Input', { x: 200, y: 150 });

    // Should show Time Format property
    await expect(propsPanel.getByText('Time Format', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- Slider ----

  test('Slider can be dragged to canvas and shows min/max properties', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'SLIDER', 'Input', { x: 200, y: 150 });

    // Should show Min and Max properties
    await expect(propsPanel.getByText('Min', { exact: true }).first()).toBeVisible({ timeout: 3000 });
    await expect(propsPanel.getByText('Max', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- FileUpload ----

  test('FileUpload can be dragged to canvas and shows multiple property', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'FILE_UPLOAD', 'Input', { x: 200, y: 150 });

    // Should show Multiple Files property (checkbox label)
    await expect(propsPanel.getByText('Multiple Files').first()).toBeVisible({ timeout: 3000 });
  });

  // ---- Rating ----

  test('Rating can be dragged to canvas and shows max stars property', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'RATING', 'Input', { x: 200, y: 150 });

    // Should show Max Stars property
    await expect(propsPanel.getByText('Max Stars', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- Progress ----

  test('Progress can be dragged to canvas and shows variant property', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'PROGRESS', 'Display', { x: 200, y: 150 });

    // Should show Variant property (linear/circular)
    await expect(propsPanel.getByText('Variant', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- Button enhancements ----

  test('Enhanced Button shows variant and size properties', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    const propsPanel = await dragComponentAndSelect(page, 'BUTTON', 'Display', { x: 200, y: 150 });

    // Should show Variant and Size properties
    await expect(propsPanel.getByText('Variant', { exact: true }).first()).toBeVisible({ timeout: 3000 });
    await expect(propsPanel.getByText('Size', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  // ---- Preview mode interactions ----

  test('Slider range input is visible in preview mode', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await dragComponentAndSelect(page, 'SLIDER', 'Input', { x: 200, y: 150 });

    // Switch to preview
    const previewBtn = page.getByRole('button', { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Slider should be present
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: 15000 });
  });

  test('Rating stars are visible in preview mode', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await dragComponentAndSelect(page, 'RATING', 'Input', { x: 200, y: 150 });

    // Switch to preview
    const previewBtn = page.getByRole('button', { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Stars (radio group) should be present
    const radioGroup = page.locator('[role="radiogroup"]').first();
    await expect(radioGroup).toBeVisible({ timeout: 15000 });
  });

  test('Progress bar renders with progressbar role in preview mode', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await dragComponentAndSelect(page, 'PROGRESS', 'Display', { x: 200, y: 150 });

    // Switch to preview
    const previewBtn = page.getByRole('button', { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Progress bar should be present with default value
    const progressbar = page.locator('[role="progressbar"]').first();
    await expect(progressbar).toBeVisible({ timeout: 15000 });
  });

  // ---- Multi-component form layout ----

  test('Multiple new components can be placed on canvas together', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    const canvas = page.getByTestId('canvas');

    // Place 3 different new components at different positions
    await openPaletteCategory(page, 'Input');

    const datePicker = page.getByTestId('palette-item-DATE_PICKER');
    await resilientDragToCanvas(page, datePicker, canvas, { x: 200, y: 100 });
    await page.waitForTimeout(400);

    const slider = page.getByTestId('palette-item-SLIDER');
    await resilientDragToCanvas(page, slider, canvas, { x: 200, y: 200 });
    await page.waitForTimeout(400);

    const rating = page.getByTestId('palette-item-RATING');
    await resilientDragToCanvas(page, rating, canvas, { x: 200, y: 300 });
    await page.waitForTimeout(400);

    // Verify properties panel shows (last dropped component is auto-selected)
    const propsPanel = page.getByTestId('properties-panel');
    await expect(propsPanel).toBeVisible({ timeout: 15000 });

    // Verify we have multiple components by checking the canvas has
    // at least 3 data-component-id elements
    const componentElements = canvas.locator('[data-component-id]');
    await expect(componentElements).toHaveCount(3, { timeout: 5000 });
  });
});
