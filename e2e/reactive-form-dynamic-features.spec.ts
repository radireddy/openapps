/**
 * E2E tests for dynamic form features: cascading visibility, expression-driven
 * props, variable updates via event handlers, form submission, and conditional
 * post-submit UI.
 *
 * Uses the reactive-form-app.json fixture which defines an "International
 * Registration Form" with 4 variables and ~22 components.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/reactive-form-app.json');

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Seed the reactive-form-app fixture into localStorage so the dashboard
 * can discover and open it.
 */
async function seedApp(page: Page) {
  const fixtureData = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

  const appId = `test_reactive_${Date.now()}`;
  const pageId = `page_reactive_${Date.now()}`;

  // Remap page IDs
  const oldMainPageId = fixtureData.mainPageId;
  const pageIdMap: Record<string, string> = {};
  fixtureData.pages.forEach((p: any, i: number) => {
    const newId = `${pageId}_${i}`;
    pageIdMap[p.id] = newId;
    p.id = newId;
  });
  fixtureData.mainPageId = pageIdMap[oldMainPageId] || fixtureData.mainPageId;

  // Remap component IDs and parent references
  const componentIdMap: Record<string, string> = {};
  fixtureData.components.forEach((c: any, i: number) => {
    const newId = `${c.type}_${Date.now()}_${i}`;
    componentIdMap[c.id] = newId;
    c.id = newId;
  });
  fixtureData.components.forEach((c: any) => {
    if (c.parentId) c.parentId = componentIdMap[c.parentId] || null;
    if (c.pageId) c.pageId = pageIdMap[c.pageId] || c.pageId;
  });

  fixtureData.id = appId;
  fixtureData.createdAt = new Date().toISOString();
  fixtureData.lastModifiedAt = new Date().toISOString();

  const appIndex = [{
    id: appId,
    name: fixtureData.name,
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

  return { appId, appName: fixtureData.name };
}

async function openAppInEditor(page: Page) {
  const card = page.getByText('International Registration Form').first();
  await card.waitFor({ state: 'visible', timeout: 10_000 });
  await card.click();
  await expect(page.getByTestId('canvas')).toBeVisible({ timeout: 10_000 });
}

async function switchToPreview(page: Page) {
  await page.getByRole('button', { name: /Switch to preview/i }).click();
  await expect(page.getByRole('region', { name: 'Preview' })).toBeVisible({ timeout: 5_000 });
}

// ── Tests ────────────────────────────────────────────────────────

test.describe('Reactive Form Dynamic Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await seedApp(page);
    await page.goto('/');
    await openAppInEditor(page);
    await switchToPreview(page);
  });

  test('conditional dropdowns are hidden when no country is selected', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    // Country select should be visible
    await expect(preview.getByRole('combobox', { name: /country/i })).toBeVisible();

    // State/Region selects should not be visible (hidden by expression).
    // When no country is selected, the state selects for US/UK/India are hidden via display:none.
    // Only the Country combobox should be visible among all selects.
    const visibleComboboxes = preview.getByRole('combobox');
    await expect(visibleComboboxes).toHaveCount(1);
  });

  test('selecting India shows India-specific state dropdown and hides others', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });
    const countrySelect = preview.getByRole('combobox', { name: /country/i });

    await countrySelect.selectOption('India');

    // India state dropdown should appear with Indian states
    await expect(preview.getByRole('combobox', { name: /Select a state/i })).toBeVisible({ timeout: 3_000 });
    const indiaStateSelect = preview.getByRole('combobox', { name: /Select a state/i });
    await expect(indiaStateSelect.getByRole('option', { name: 'Maharashtra' })).toBeAttached();
    await expect(indiaStateSelect.getByRole('option', { name: 'Karnataka' })).toBeAttached();
  });

  test('selecting United States shows US-specific state dropdown', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });
    const countrySelect = preview.getByRole('combobox', { name: /country/i });

    await countrySelect.selectOption('United States');

    // US state dropdown should have US states
    const usStateSelect = preview.getByRole('combobox', { name: /Select a state/i });
    await expect(usStateSelect).toBeVisible({ timeout: 3_000 });
    await expect(usStateSelect.getByRole('option', { name: 'California' })).toBeAttached();
    await expect(usStateSelect.getByRole('option', { name: 'New York' })).toBeAttached();
  });

  test('selecting United Kingdom shows UK-specific region dropdown', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });
    const countrySelect = preview.getByRole('combobox', { name: /country/i });

    await countrySelect.selectOption('United Kingdom');

    const ukRegionSelect = preview.getByRole('combobox', { name: /Select a region/i });
    await expect(ukRegionSelect).toBeVisible({ timeout: 3_000 });
    await expect(ukRegionSelect.getByRole('option', { name: 'England' })).toBeAttached();
    await expect(ukRegionSelect.getByRole('option', { name: 'Scotland' })).toBeAttached();
  });

  test('phone placeholder changes based on country selection', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });
    const countrySelect = preview.getByRole('combobox', { name: /country/i });

    // Select US — expect US phone format placeholder
    await countrySelect.selectOption('United States');
    await expect(preview.getByPlaceholder('+1 (xxx) xxx-xxxx')).toBeVisible({ timeout: 3_000 });

    // Switch to UK — expect UK phone format
    await countrySelect.selectOption('United Kingdom');
    await expect(preview.getByPlaceholder('+44 xxxx xxxxxx')).toBeVisible({ timeout: 3_000 });

    // Switch to India — expect India phone format
    await countrySelect.selectOption('India');
    await expect(preview.getByPlaceholder('+91 xxxxx xxxxx')).toBeVisible({ timeout: 3_000 });
  });

  test('ID number label changes based on country selection', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });
    const countrySelect = preview.getByRole('combobox', { name: /country/i });

    // Use the section header label which uniquely identifies the ID type
    await countrySelect.selectOption('United States');
    await expect(preview.getByText('Identity - SSN')).toBeVisible({ timeout: 3_000 });

    await countrySelect.selectOption('United Kingdom');
    await expect(preview.getByText('Identity - NHS Number')).toBeVisible({ timeout: 3_000 });

    await countrySelect.selectOption('India');
    await expect(preview.getByText('Identity - Aadhaar Number')).toBeVisible({ timeout: 3_000 });
  });

  test('progress bar updates as form fields are filled', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    // When progress is 0, the label shows "Fill in the form below"
    await expect(preview.getByText('Fill in the form below')).toBeVisible();

    // Select country — progress should jump to 15%
    await preview.getByRole('combobox', { name: /country/i }).selectOption('India');
    await expect(preview.getByText('Completion: 15%')).toBeVisible({ timeout: 2_000 });

    // Select state — progress should be 30%
    await preview.getByRole('combobox', { name: /Select a state/i }).selectOption('Maharashtra');
    await expect(preview.getByText('Completion: 30%')).toBeVisible({ timeout: 2_000 });
  });

  test('identity section label is dynamic based on country', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    // Default: "Identity Verification"
    await expect(preview.getByText('Identity Verification')).toBeVisible();

    // Select India: should show "Identity - Aadhaar Number"
    await preview.getByRole('combobox', { name: /country/i }).selectOption('India');
    await expect(preview.getByText('Identity - Aadhaar Number')).toBeVisible({ timeout: 3_000 });
  });

  test('currency label shows country-specific currency', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    await preview.getByRole('combobox', { name: /country/i }).selectOption('United States');
    await expect(preview.getByText('USD ($)')).toBeVisible({ timeout: 3_000 });

    await preview.getByRole('combobox', { name: /country/i }).selectOption('India');
    await expect(preview.getByText('INR')).toBeVisible({ timeout: 3_000 });
  });

  test('full form submission flow sets formSubmitted and shows summary', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    // Summary labels should be hidden initially
    await expect(preview.getByText('Registration Summary')).not.toBeVisible();

    // Fill the form
    await preview.getByRole('combobox', { name: /country/i }).selectOption('India');
    await preview.getByRole('combobox', { name: /Select a state/i }).selectOption('Maharashtra');
    await preview.getByPlaceholder('Enter your city').fill('Mumbai');
    await preview.getByPlaceholder('+91 xxxxx xxxxx').fill('9876543210');
    await preview.getByPlaceholder('your.email@example.com').fill('test@example.com');
    await preview.getByPlaceholder('Re-enter your email').fill('test@example.com');
    await preview.getByPlaceholder('XXXX XXXX XXXX').fill('123456789012');
    await preview.getByRole('checkbox', { name: /Terms and Conditions/i }).check();

    // Submit
    await preview.getByRole('button', { name: /Submit Registration/i }).click();

    // Progress should reach 100%
    await expect(preview.getByText('Completion: 100%')).toBeVisible({ timeout: 3_000 });

    // Button should change to "Submitted!" and be disabled
    await expect(preview.getByRole('button', { name: /Submitted!/i })).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByRole('button', { name: /Submitted!/i })).toBeDisabled();

    // Registration Summary should appear (formSubmitted variable set to true)
    await expect(preview.getByText('Registration Summary')).toBeVisible({ timeout: 3_000 });

    // Summary data should contain country and email
    await expect(preview.getByText(/Country: India/)).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText(/Email: test@example\.com/)).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText(/Phone: 9876543210/)).toBeVisible({ timeout: 3_000 });
  });

  test('switching countries updates all dynamic properties together', async ({ page }) => {
    const preview = page.getByRole('region', { name: 'Preview' });

    // Select US
    await preview.getByRole('combobox', { name: /country/i }).selectOption('United States');
    await expect(preview.getByPlaceholder('+1 (xxx) xxx-xxxx')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('Identity - SSN')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('USD ($)')).toBeVisible({ timeout: 3_000 });

    // Switch to India — all dynamic properties should update
    await preview.getByRole('combobox', { name: /country/i }).selectOption('India');
    await expect(preview.getByPlaceholder('+91 xxxxx xxxxx')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('Identity - Aadhaar Number')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('INR')).toBeVisible({ timeout: 3_000 });

    // Switch to UK — all dynamic properties should update again
    await preview.getByRole('combobox', { name: /country/i }).selectOption('United Kingdom');
    await expect(preview.getByPlaceholder('+44 xxxx xxxxxx')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('Identity - NHS Number')).toBeVisible({ timeout: 3_000 });
    await expect(preview.getByText('GBP')).toBeVisible({ timeout: 3_000 });
  });
});
