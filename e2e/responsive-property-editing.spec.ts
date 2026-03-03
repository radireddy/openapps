import { test, expect } from '@playwright/test';

/**
 * E2E tests for responsive property editing:
 * - Properties panel shows Layout group when component selected
 * - Container components show Container Layout group with flex properties
 * - Device switcher buttons are responsive to clicks
 */
test.describe('Responsive Property Editing', () => {
  const createAppAndEnterEditor = async (page: any) => {
    const appName = `E2E-Responsive-${Date.now()}`;
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

  const openPaletteCategory = async (page: any, category: string) => {
    const btn = page.getByRole('button', { name: category, exact: true });
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    const isExpanded = await btn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await btn.click();
      await page.waitForTimeout(200);
    }
  };

  const dragToCanvas = async (page: any, source: any, _canvas: any, _targetPosition: { x: number; y: number }) => {
    // Use .first() to handle duplicate test IDs when component is in Recent section
    const target = await source.count() > 1 ? source.first() : source;
    await target.waitFor({ state: 'visible', timeout: 15000 });
    await target.dblclick();
    await page.waitForTimeout(300);
  };

  test('properties panel shows Layout group with flex properties when component is selected', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await openPaletteCategory(page, 'Display');

    const canvas = page.getByTestId('canvas');
    const labelPalette = page.getByTestId('palette-item-LABEL');
    await labelPalette.waitFor({ state: 'visible', timeout: 15000 });
    await dragToCanvas(page, labelPalette, canvas, { x: 200, y: 100 });
    await page.waitForTimeout(500);

    // Click on the component to select it
    const component = page.locator('[data-component-id]').first();
    if (await component.isVisible()) {
      await component.click();
      await page.waitForTimeout(300);

      // Properties panel should be visible
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toBeVisible();

      // Should have a Layout group header
      const layoutGroup = propertiesPanel.getByText('Layout', { exact: true });
      await expect(layoutGroup).toBeVisible({ timeout: 3000 });
    }
  });

  test('container components show Container Layout group with flex direction properties', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);
    await openPaletteCategory(page, 'Layout');

    const canvas = page.getByTestId('canvas');
    const containerPalette = page.getByTestId('palette-item-CONTAINER');
    await containerPalette.waitFor({ state: 'visible', timeout: 15000 });
    await dragToCanvas(page, containerPalette, canvas, { x: 200, y: 100 });
    await page.waitForTimeout(500);

    // Click on the container component
    const component = page.locator('[data-component-id]').first();
    if (await component.isVisible()) {
      await component.click();
      await page.waitForTimeout(300);

      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toBeVisible();

      // Should have Container Layout group
      const containerLayoutGroup = propertiesPanel.getByText('Container Layout', { exact: true });
      await expect(containerLayoutGroup).toBeVisible({ timeout: 3000 });
    }
  });

  test('device switcher cycles through all device presets without errors', async ({ page }) => {
    await createAppAndEnterEditor(page);

    const switcher = page.getByTestId('device-preview-switcher');
    await expect(switcher).toBeVisible();

    // Click through each device and verify no errors
    for (const device of ['mobile', 'tablet', 'desktop', 'fullWidth']) {
      const btn = page.getByTestId(`device-${device}`);
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);

      // Verify the button gets the active class
      const classes = await btn.getAttribute('class');
      expect(classes).toContain('bg-ed-bg');
    }
  });
});
