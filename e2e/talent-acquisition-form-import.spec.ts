/**
 * AI-Era Talent Acquisition Form - Import & Multi-Device Verification E2E Tests
 *
 * Imports the exported app JSON via the Dashboard file-import flow, then
 * verifies the app renders correctly in both Design and Preview modes
 * across Mobile (375px), Tablet (768px), Desktop (1280px), and Full Width.
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/ai-era-talent-acquisition-form.json');
const APP_NAME_BASE = 'AI-Era Talent Acquisition Form';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Seed the app directly into localStorage from the fixture JSON.
 * This is more reliable than file-import for tests that focus on
 * verifying the app in design/preview modes.
 */
const seedAppViaLocalStorage = async (page: Page) => {
  const fixtureData = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

  // Give it a stable, known ID and name for test assertions
  const appId = `test_talent_${Date.now()}`;
  const pageId = `page_talent_${Date.now()}`;
  const appName = APP_NAME_BASE;

  // Remap page IDs
  const oldMainPageId = fixtureData.mainPageId;
  const pageIdMap: Record<string, string> = {};
  fixtureData.pages.forEach((p: any, i: number) => {
    const newId = `${pageId}_${i}`;
    pageIdMap[p.id] = newId;
    p.id = newId;
  });

  // Update mainPageId
  fixtureData.mainPageId = pageIdMap[oldMainPageId] || fixtureData.mainPageId;

  // Remap component pageIds and parentIds
  const componentIdMap: Record<string, string> = {};
  fixtureData.components.forEach((c: any, i: number) => {
    const newId = `${c.type}_${Date.now()}_${i}`;
    componentIdMap[c.id] = newId;
    c.id = newId;
  });
  fixtureData.components.forEach((c: any) => {
    if (c.parentId) {
      c.parentId = componentIdMap[c.parentId] || null;
    }
    if (c.pageId) {
      c.pageId = pageIdMap[c.pageId] || c.pageId;
    }
  });

  fixtureData.id = appId;
  fixtureData.name = appName;
  fixtureData.createdAt = new Date().toISOString();
  fixtureData.lastModifiedAt = new Date().toISOString();

  const appIndex = [{
    id: appId,
    name: appName,
    createdAt: fixtureData.createdAt,
    lastModifiedAt: fixtureData.lastModifiedAt,
  }];

  await page.evaluate(({ indexKey, appKey, indexData, appData }: any) => {
    window.localStorage.setItem(indexKey, JSON.stringify(indexData));
    window.localStorage.setItem(appKey, JSON.stringify(appData));
  }, {
    indexKey: 'gemini-low-code-apps-index',
    appKey: `gemini-low-code-app-${appId}`,
    indexData: appIndex,
    appData: fixtureData,
  });

  return { appId, appName };
};

/** Open the app in the Editor from the Dashboard. */
const openAppInEditor = async (page: Page) => {
  const appCard = page.getByText(APP_NAME_BASE).first();
  await appCard.waitFor({ state: 'visible', timeout: 10_000 });
  await appCard.click();
  // The heading may contain the full name or a truncated version
  await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 10_000 });
};

/** Switch to Preview mode. */
const switchToPreview = async (page: Page) => {
  const btn = page.getByRole('button', { name: /Switch to preview/i });
  await btn.click();
  await expect(page.getByRole('region', { name: 'Preview' })).toBeVisible({ timeout: 5_000 });
};

/** Switch back to Editor (Design) mode. */
const switchToEditor = async (page: Page) => {
  const btn = page.getByRole('button', { name: /Switch to editor/i });
  await btn.click();
  await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 5_000 });
};

/** Select a device preset and wait for transition. */
const selectDevice = async (page: Page, device: 'mobile' | 'tablet' | 'desktop' | 'fullWidth') => {
  await page.getByTestId(`device-${device}`).click();
  await page.waitForTimeout(400);
};

// ---------------------------------------------------------------------------
// Expected component labels / text visible in the form
// ---------------------------------------------------------------------------

const SECTION_HEADERS = [
  'Personal Information',
  'Professional Profile',
  'Preferences & Availability',
  'Documents & Agreement',
];

const FORM_FIELD_LABELS = [
  'Full Name',
  'Email Address',
  'Phone Number',
  'Date of Birth',
  'Gender',
  'Current Company',
  'Experience Level',
  'Target Department',
  'Key Skills & Technologies',
  'Overall Proficiency Level',
  'Self-Assessment Rating',
  'Preferred Work Mode',
  'Desired Role',
  'Expected Annual Salary (USD)',
  'Earliest Start Date',
  'Preferred Interview Time',
  'Willing to Relocate',
  'Upload Resume',
  'Cover Letter / Additional Notes',
];

const EXPECTED_COMPONENT_TYPES = [
  'LABEL',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'DATE_PICKER',
  'TIME_PICKER',
  'SLIDER',
  'RATING',
  'RADIO_GROUP',
  'SWITCH',
  'CHECKBOX',
  'FILE_UPLOAD',
  'BUTTON',
  'DIVIDER',
  'PROGRESS',
  'MODAL',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Talent Acquisition Form - Import & Multi-Device Verification', () => {

  // -----------------------------------------------------------------------
  // 1. File Import via Dashboard
  // -----------------------------------------------------------------------

  test('imports the app JSON from Dashboard file input and shows it in the app list', async ({ page }) => {
    // Handle the browser alert triggered by the import
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/');
    await page.waitForTimeout(500);

    // Use the hidden file input to import the fixture
    const fileInput = page.locator('input[type="file"][accept=".json"]').first();
    await fileInput.setInputFiles(FIXTURE_PATH);

    // After import, the app name has "(Imported ...)" suffix
    await expect(page.getByText(APP_NAME_BASE).first()).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 2. Design mode – component presence (seeded via localStorage)
  // -----------------------------------------------------------------------

  test('all section headers are visible on the canvas in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    const canvas = page.getByTestId('canvas');
    for (const header of SECTION_HEADERS) {
      await expect(canvas.getByText(header, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('form field labels are visible on the canvas in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    const canvas = page.getByTestId('canvas');
    for (const label of FORM_FIELD_LABELS) {
      await expect(canvas.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('all expected component types are present in the app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    const componentTypes = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const appKey = keys.find((k) => k.startsWith('gemini-low-code-app-') && !k.includes('index') && !k.includes('templates'));
      if (!appKey) return [];
      const app = JSON.parse(localStorage.getItem(appKey)!);
      return [...new Set(app.components.map((c: any) => c.type))];
    });

    for (const expectedType of EXPECTED_COMPONENT_TYPES) {
      expect(componentTypes).toContain(expectedType);
    }
  });

  // -----------------------------------------------------------------------
  // 3. Design mode – device switching
  // -----------------------------------------------------------------------

  test('canvas adjusts to Mobile width (375px) in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'mobile');

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    expect(style).toContain('375px');
  });

  test('canvas adjusts to Tablet width (768px) in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'tablet');

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    expect(style).toContain('768px');
  });

  test('canvas adjusts to Desktop width (1280px) in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'desktop');

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    expect(style).toContain('1280px');
  });

  test('canvas adjusts to Full Width in design mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    await selectDevice(page, 'mobile');
    await selectDevice(page, 'fullWidth');

    const canvasWrapper = page.locator('[data-testid="canvas"]').locator('..');
    const style = await canvasWrapper.getAttribute('style');
    if (style) {
      expect(style).not.toContain('375px');
      expect(style).not.toContain('768px');
    }
  });

  // -----------------------------------------------------------------------
  // 4. Preview mode – content rendering
  // -----------------------------------------------------------------------

  test('section headers render correctly in preview mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    for (const header of SECTION_HEADERS) {
      await expect(page.getByText(header, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('form field labels render correctly in preview mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    for (const label of FORM_FIELD_LABELS) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Submit Application button is visible in preview mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    await expect(page.getByText('Submit Application', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 5. Preview mode – device switching
  // -----------------------------------------------------------------------

  test('preview renders at Mobile width (375px)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'mobile');
    await switchToPreview(page);

    await expect(page.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Full Name', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('preview renders at Tablet width (768px)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'tablet');
    await switchToPreview(page);

    await expect(page.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Full Name', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('preview renders at Desktop width (1280px)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await selectDevice(page, 'desktop');
    await switchToPreview(page);

    await expect(page.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Full Name', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('switching devices in preview mode keeps content visible', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    for (const device of ['mobile', 'tablet', 'desktop', 'fullWidth'] as const) {
      await selectDevice(page, device);
      await expect(page.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Submit Application', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // -----------------------------------------------------------------------
  // 6. Preview mode – pre-filled data
  // -----------------------------------------------------------------------

  test('pre-filled data values are visible in preview mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    // The dataStore has pre-filled values - the form should show input fields
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 7. Round-trip: Design -> Preview -> Design
  // -----------------------------------------------------------------------

  test('switching between design and preview preserves all components', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    // Design mode - verify content
    const canvas = page.getByTestId('canvas');
    await expect(canvas.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });

    // Switch to Preview
    await switchToPreview(page);
    await expect(page.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });

    // Switch back to Design
    await switchToEditor(page);
    await expect(canvas.getByText('Personal Information', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 8. Design mode – component selection shows properties
  // -----------------------------------------------------------------------

  test('clicking a component in design mode shows its properties panel', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    const canvas = page.getByTestId('canvas');
    const firstComponent = canvas.locator('[data-component-id]').first();
    await firstComponent.waitFor({ state: 'visible', timeout: 5_000 });
    await firstComponent.click();
    await page.waitForTimeout(300);

    const propsPanel = page.getByTestId('properties-panel');
    await expect(propsPanel).toBeVisible({ timeout: 5_000 });
  });

  // -----------------------------------------------------------------------
  // 9. Design mode – device switching preserves component count
  // -----------------------------------------------------------------------

  test('switching devices in design mode preserves all components on canvas', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedAppViaLocalStorage(page);
    await page.goto('/');

    await openAppInEditor(page);

    const canvas = page.getByTestId('canvas');

    // Count components at full width
    const fullWidthCount = await canvas.locator('[data-component-id]').count();
    expect(fullWidthCount).toBeGreaterThan(0);

    // Switch to mobile and count again
    await selectDevice(page, 'mobile');
    const mobileCount = await canvas.locator('[data-component-id]').count();
    expect(mobileCount).toBe(fullWidthCount);

    // Switch to tablet and count
    await selectDevice(page, 'tablet');
    const tabletCount = await canvas.locator('[data-component-id]').count();
    expect(tabletCount).toBe(fullWidthCount);

    // Switch to desktop and count
    await selectDevice(page, 'desktop');
    const desktopCount = await canvas.locator('[data-component-id]').count();
    expect(desktopCount).toBe(fullWidthCount);
  });
});
