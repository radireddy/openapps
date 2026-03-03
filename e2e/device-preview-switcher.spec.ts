import { test, expect } from '@playwright/test';

/**
 * E2E tests for the device preview switcher:
 * - Clicking each device button changes the canvas width constraint
 * - Device buttons show active state
 * - Canvas transitions smoothly between widths
 */
test.describe('Device Preview Switcher', () => {
  const createAppAndEnterEditor = async (page: any) => {
    const appName = `E2E-Device-${Date.now()}`;
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

  test('device switcher is visible in the editor header', async ({ page }) => {
    await createAppAndEnterEditor(page);
    const switcher = page.getByTestId('device-preview-switcher');
    await expect(switcher).toBeVisible();
  });

  test('clicking Mobile button constrains canvas to mobile width', async ({ page }) => {
    await createAppAndEnterEditor(page);
    const mobileBtn = page.getByTestId('device-mobile');
    await mobileBtn.click();
    await page.waitForTimeout(500); // wait for transition

    // The canvas wrapper should have a max-width constraint
    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    // Mobile width is 375px
    expect(style).toContain('375px');
  });

  test('clicking Tablet button constrains canvas to tablet width', async ({ page }) => {
    await createAppAndEnterEditor(page);
    const tabletBtn = page.getByTestId('device-tablet');
    await tabletBtn.click();
    await page.waitForTimeout(500);

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    expect(style).toContain('768px');
  });

  test('clicking Desktop button constrains canvas to desktop width', async ({ page }) => {
    await createAppAndEnterEditor(page);
    const desktopBtn = page.getByTestId('device-desktop');
    await desktopBtn.click();
    await page.waitForTimeout(500);

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    expect(style).toContain('1280px');
  });

  test('clicking Full Width button removes width constraint', async ({ page }) => {
    await createAppAndEnterEditor(page);

    // First switch to mobile, then back to full
    await page.getByTestId('device-mobile').click();
    await page.waitForTimeout(300);
    await page.getByTestId('device-fullWidth').click();
    await page.waitForTimeout(500);

    // Full width should not have a restrictive max-width
    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    // Full width mode should not have the small pixel constraints
    if (style) {
      expect(style).not.toContain('375px');
      expect(style).not.toContain('768px');
    }
  });

  test('active device button has distinct styling', async ({ page }) => {
    await createAppAndEnterEditor(page);

    // Full Width is the default active device
    const fullWidthBtn = page.getByTestId('device-fullWidth');
    const mobileBtn = page.getByTestId('device-mobile');

    // Check that fullWidth has the active class
    const fullWidthClasses = await fullWidthBtn.getAttribute('class');
    expect(fullWidthClasses).toContain('bg-ed-bg');

    // Click mobile
    await mobileBtn.click();
    await page.waitForTimeout(300);

    // Now mobile should be active
    const mobileClasses = await mobileBtn.getAttribute('class');
    expect(mobileClasses).toContain('bg-ed-bg');
  });

  test('all four device buttons are present', async ({ page }) => {
    await createAppAndEnterEditor(page);
    await expect(page.getByTestId('device-mobile')).toBeVisible();
    await expect(page.getByTestId('device-tablet')).toBeVisible();
    await expect(page.getByTestId('device-desktop')).toBeVisible();
    await expect(page.getByTestId('device-fullWidth')).toBeVisible();
  });
});
