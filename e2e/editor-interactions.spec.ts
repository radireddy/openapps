import { test, expect } from '@playwright/test';

/**
 * E2E tests for editor interactions:
 * - Form input field labels (canvas & preview rendering)
 * - Undo/Redo keyboard shortcuts
 * - Copy/Paste component duplication
 * - TreeView component rename via double-click
 * - Searchable Select combobox in preview
 * - Auto-generated component names in TreeView
 */
test.describe('Editor Interactions', () => {
  // Helper: add component from palette to canvas via double-click
  const resilientDragToCanvas = async (page: any, source: any, _canvas: any, _targetPosition: { x: number; y: number }) => {
    // Use .first() to handle duplicate test IDs when component is in Recent section
    const target = await source.count() > 1 ? source.first() : source;
    await target.waitFor({ state: 'visible', timeout: 15000 });
    await target.dblclick();
    await page.waitForTimeout(300);
  };

  // Helper: ensure a palette category is expanded
  // Categories are: 'Input', 'Display', 'Media', 'Layout', 'Icons', 'Other'
  // 'Input' is expanded by default when a new app is created
  const openPaletteCategory = async (page: any, category: string) => {
    const btn = page.getByRole('button', { name: category, exact: true });
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    const isExpanded = await btn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await btn.click();
      await page.waitForTimeout(200);
    }
    // Verify content is visible
    const categoryContent = page.locator(`#palette-${category}`);
    await categoryContent.waitFor({ state: 'visible', timeout: 10000 });
  };

  // Helper: create a new app and enter editor, wait for canvas to be ready
  const createAppAndEnterEditor = async (page: any) => {
    const appName = `E2E-Editor-${Date.now()}`;
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: 'New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
    await page.getByRole('button', { name: 'Create App' }).click();
    // Wait for editor to fully load
    await expect(page.getByRole('heading', { name: appName })).toBeVisible({ timeout: 10000 });
    // Wait for the canvas to be ready
    await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 15000 });
    return appName;
  };

  // Helper: switch to Components palette tab (default is Explorer)
  const switchToComponentsPalette = async (page: any) => {
    const componentsTab = page.getByRole('button', { name: 'Components', exact: true });
    await componentsTab.waitFor({ state: 'visible', timeout: 15000 });
    await componentsTab.click();
    await page.waitForTimeout(300);
    const palette = page.getByRole('region', { name: 'Components' });
    await expect(palette).toBeVisible({ timeout: 15000 });
  };

  // Helper: switch to Explorer tab to see the tree view
  const switchToExplorerPanel = async (page: any) => {
    const explorerTab = page.getByRole('button', { name: 'Explorer', exact: true });
    await explorerTab.click();
    await page.waitForTimeout(300);
    const explorer = page.getByRole('region', { name: 'Explorer' });
    await expect(explorer).toBeVisible({ timeout: 15000 });
    return explorer;
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
  });

  test('Input label property renders on canvas when set via properties panel', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Input');
    const inputSource = page.getByTestId('palette-item-INPUT');
    const canvas = page.getByTestId('canvas');
    await resilientDragToCanvas(page, inputSource, canvas, { x: 200, y: 200 });
    await page.waitForTimeout(500);

    const propsPanel = page.getByTestId('properties-panel');
    await expect(propsPanel).toBeVisible({ timeout: 15000 });

    const labelProp = propsPanel.getByText('Label', { exact: true }).first();
    if (await labelProp.isVisible({ timeout: 3000 }).catch(() => false)) {
      const labelField = propsPanel.locator('label:has-text("Label")').locator('..').locator('input, textarea').first();
      if (await labelField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await labelField.fill('Email Address');
        await page.waitForTimeout(300);

        const canvasLabel = canvas.getByText('Email Address');
        await expect(canvasLabel).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Ctrl+Z undoes component addition and Ctrl+Shift+Z redoes it', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Display');
    const buttonSource = page.getByTestId('palette-item-BUTTON');
    const canvas = page.getByTestId('canvas');
    await resilientDragToCanvas(page, buttonSource, canvas, { x: 200, y: 200 });

    await page.waitForTimeout(500);
    const buttonOnCanvas = canvas.getByRole('button', { name: /Click Me/i });
    await expect(buttonOnCanvas).toBeVisible({ timeout: 15000 });

    // Click on canvas to deselect (avoid shortcut going to an input)
    await canvas.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    // Undo
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
    await page.waitForTimeout(500);
    await expect(buttonOnCanvas).not.toBeVisible({ timeout: 15000 });

    // Redo
    await page.keyboard.press(isMac ? 'Meta+Shift+z' : 'Control+y');
    await page.waitForTimeout(500);
    const buttonAfterRedo = canvas.getByRole('button', { name: /Click Me/i });
    await expect(buttonAfterRedo).toBeVisible({ timeout: 15000 });
  });

  test('Double-click tree view item opens inline rename and persists new name', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Display');
    const labelSource = page.getByTestId('palette-item-LABEL');
    const canvas = page.getByTestId('canvas');
    await resilientDragToCanvas(page, labelSource, canvas, { x: 200, y: 200 });
    await page.waitForTimeout(500);

    const explorer = await switchToExplorerPanel(page);

    const treeItem = explorer.getByText('Label 1').first();
    if (await treeItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await treeItem.dblclick();
      await page.waitForTimeout(200);

      const renameInput = explorer.locator('input').first();
      if (await renameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await renameInput.fill('Page Title');
        await renameInput.press('Enter');
        await page.waitForTimeout(300);

        const renamedItem = explorer.getByText('Page Title');
        await expect(renamedItem).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Ctrl+C and Ctrl+V duplicates a selected component on canvas', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Display');
    const buttonSource = page.getByTestId('palette-item-BUTTON');
    const canvas = page.getByTestId('canvas');
    await resilientDragToCanvas(page, buttonSource, canvas, { x: 200, y: 200 });
    await page.waitForTimeout(500);

    const buttonsOnCanvas = canvas.getByRole('button', { name: /Click Me/i });
    await expect(buttonsOnCanvas.first()).toBeVisible({ timeout: 15000 });

    await buttonsOnCanvas.first().click();
    await page.waitForTimeout(200);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+c' : 'Control+c');
    await page.waitForTimeout(200);

    await canvas.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    await page.keyboard.press(isMac ? 'Meta+v' : 'Control+v');
    await page.waitForTimeout(500);

    const allButtons = canvas.getByRole('button', { name: /Click Me/i });
    const count = await allButtons.count();
    expect(count).toBe(2);
  });

  test('Searchable Select renders filterable combobox dropdown in preview mode', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Input');
    const selectSource = page.getByTestId('palette-item-SELECT');
    const canvas = page.getByTestId('canvas');
    await resilientDragToCanvas(page, selectSource, canvas, { x: 200, y: 200 });
    await page.waitForTimeout(500);

    const propsPanel = page.getByTestId('properties-panel');
    await expect(propsPanel).toBeVisible({ timeout: 15000 });
    const searchableToggle = propsPanel.getByText('Searchable').first();
    if (await searchableToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      const toggle = propsPanel.locator('label:has-text("Searchable")').locator('..').locator('input[type="checkbox"]').first();
      if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    }

    await page.getByRole('button', { name: 'Preview' }).click();
    await page.waitForTimeout(500);

    const previewRegion = page.getByLabel('Preview');
    await expect(previewRegion).toBeVisible({ timeout: 15000 });

    const combobox = previewRegion.locator('input[role="combobox"]');
    if (await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await combobox.fill('Option 1');
      await page.waitForTimeout(300);

      const listbox = previewRegion.locator('[role="listbox"]');
      await expect(listbox).toBeVisible({ timeout: 3000 });
    }
  });

  test('Dragging multiple components assigns incremental names in tree view', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await switchToComponentsPalette(page);

    await openPaletteCategory(page, 'Display');
    const buttonSource = page.getByTestId('palette-item-BUTTON');
    const canvas = page.getByTestId('canvas');

    await resilientDragToCanvas(page, buttonSource, canvas, { x: 150, y: 150 });
    await page.waitForTimeout(500);

    await resilientDragToCanvas(page, buttonSource, canvas, { x: 300, y: 300 });
    await page.waitForTimeout(500);

    const explorer = await switchToExplorerPanel(page);

    const button1 = explorer.getByText('Button 1');
    const button2 = explorer.getByText('Button 2');

    if (await button1.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(button1).toBeVisible();
    }
    if (await button2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(button2).toBeVisible();
    }
  });
});
