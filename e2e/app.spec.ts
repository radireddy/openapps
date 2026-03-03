import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import v8to from 'v8-to-istanbul';
import { Buffer } from 'buffer';

// Toggle collecting V8 coverage during e2e runs. Set `E2E_COLLECT_COVERAGE=1` to enable.
const COLLECT_COVERAGE = !!process.env.E2E_COLLECT_COVERAGE;

// @ts-ignore
const NYC_OUTPUT_DIR = path.join(process.cwd(), '.nyc_output');

// Clean up the output directory before all tests run
test.beforeAll(async () => {
  if (fs.existsSync(NYC_OUTPUT_DIR)) {
    fs.rmSync(NYC_OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(NYC_OUTPUT_DIR, { recursive: true });
});


test.describe('App Builder E2E Tests', () => {
  // These tests share localStorage state (import/delete apps, templates) and must run serially
  test.describe.configure({ mode: 'serial' });

  // Helper: temporarily disable pointer events on potential interceptors and return a restore function
  const togglePointerInterceptors = async (page: any, disable: boolean) => {
    const selectors = ['[data-testid="properties-panel"]', '.modal-backdrop', '.overlay', '.App', '[data-testid="main-layout"]'];
    await page.evaluate((opts: { sels: string[]; disableFlag: boolean }) => {
      const { sels, disableFlag } = opts;
      for (const s of sels) {
        const nodes = Array.from(document.querySelectorAll(s));
        for (const n of nodes) {
          (n as HTMLElement).style.pointerEvents = disableFlag ? 'none' : '';
        }
      }
    }, { sels: selectors, disableFlag: disable });
  };

  // Helper: robust drag from a palette item into the canvas. Tries locator.dragTo, falls back to raw mouse events.
  const resilientDragToCanvas = async (page: any, source: any, canvas: any, targetPosition: { x: number; y: number }, stepName?: string) => {
    console.log(`[DRAG] ${stepName || 'Dragging component'} to position (${targetPosition.x}, ${targetPosition.y})`);
    try {
      // Ensure the source is present/visible before attempting drag
      try {
        await source.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`[DRAG] Source component is visible`);
      } catch (w) {
        console.warn(`[DRAG] Source visibility check failed, continuing anyway`);
        // continue to attempt dragTo which will surface a clearer error
      }

      // Double-click palette item to add component via onAddComponent
      // Use .first() to handle duplicate test IDs when component is in Recent section
      const target = await source.count() > 1 ? source.first() : source;
      await target.dblclick();
      await page.waitForTimeout(300);
      console.log(`[DRAG] Successfully added component via double-click`);
    } catch (e) {
      console.warn(`[DRAG] Failed to add component:`, e);
      throw e;
    }
  };
  
  // Helper: Delete an app by name (deletes the first matching app)
  const deleteAppByName = async (page: any, appName: string) => {
    try {
      console.log(`[CLEANUP] Deleting app: ${appName}`);
      const appCards = page.locator('.grid > div').filter({ hasText: appName });
      const count = await appCards.count();
      if (count > 0) {
        const appCard = appCards.first();
        await appCard.getByRole('button').last().click(); // Click the kebab menu
        await page.getByText('Delete').click();
        await expect(page.getByRole('heading', { name: 'Delete Application' })).toBeVisible();
        await page.getByRole('button', { name: 'Delete' }).click();
        await page.waitForTimeout(500);
        console.log(`[CLEANUP] ✓ App "${appName}" deleted`);
      } else {
        console.log(`[CLEANUP] App "${appName}" not found, skipping deletion`);
      }
    } catch (e) {
      console.warn(`[CLEANUP] Failed to delete app "${appName}":`, e);
    }
  };

  // Helper: Delete all apps by name (deletes all matching apps)
  const deleteAllAppsByName = async (page: any, appName: string) => {
    try {
      console.log(`[CLEANUP] Deleting all apps with name: ${appName}`);
      let deletedCount = 0;
      while (true) {
        const appCards = page.locator('.grid > div').filter({ hasText: appName });
        const count = await appCards.count();
        if (count === 0) break;
        
        const appCard = appCards.first();
        await appCard.getByRole('button').last().click(); // Click the kebab menu
        await page.getByText('Delete').click();
        await expect(page.getByRole('heading', { name: 'Delete Application' })).toBeVisible();
        await page.getByRole('button', { name: 'Delete' }).click();
        await page.waitForTimeout(500);
        deletedCount++;
      }
      console.log(`[CLEANUP] ✓ Deleted ${deletedCount} app(s) with name "${appName}"`);
    } catch (e) {
      console.warn(`[CLEANUP] Failed to delete apps "${appName}":`, e);
    }
  };

  // Helper: Delete a template by name
  const deleteTemplateByName = async (page: any, templateName: string) => {
    try {
      console.log(`[CLEANUP] Deleting template: ${templateName}`);
      // Switch to Templates tab and find template card
      await page.getByRole('button', { name: /Templates/i }).click();
      await page.waitForTimeout(300);
      // h3 is inside content div which is inside card wrapper - go up two levels
      const templateCard = page.locator('h3').filter({ hasText: templateName }).locator('..').locator('..');
      const count = await templateCard.count();
      if (count > 0) {
        // Hover over the template card to show the menu
        await templateCard.first().hover();
        await page.waitForTimeout(300);
        // Click the kebab menu button (last button in the card)
        const kebabButton = templateCard.first().locator('button').last();
        await kebabButton.click();
        await page.waitForTimeout(200);
        // Click Delete option in the dropdown
        await page.getByText('Delete').click();
        // Confirm deletion in modal
        await expect(page.getByRole('heading', { name: /Delete/ })).toBeVisible({ timeout: 3000 });
        await page.getByRole('button', { name: 'Delete' }).click();
        await page.waitForTimeout(500);
        console.log(`[CLEANUP] ✓ Template "${templateName}" deleted`);
      } else {
        console.log(`[CLEANUP] Template "${templateName}" not found, skipping deletion`);
      }
    } catch (e) {
      console.warn(`[CLEANUP] Failed to delete template "${templateName}":`, e);
    }
  };

  // Helper: ensure a palette category is expanded (accordion changed behavior)
  const openPaletteCategory = async (page: any, category: string) => {
    console.log(`[PALETTE] Opening category: ${category}`);
    try {
      // Ensure the Components palette is visible/active
      try {
        await page.getByRole('button', { name: 'Components' }).click();
        console.log(`[PALETTE] Clicked Components button`);
      } catch (e) {
        console.log(`[PALETTE] Components button not found or already visible`);
        // ignore if there's no toggle (already visible)
      }

      const btn = page.getByRole('button', { name: category });
      await btn.waitFor({ state: 'visible', timeout: 2000 });
      console.log(`[PALETTE] Category button "${category}" is visible`);
      
      // Check if category is already expanded by checking aria-expanded attribute
      const isExpanded = await btn.getAttribute('aria-expanded');
      console.log(`[PALETTE] Category "${category}" expanded state: ${isExpanded}`);
      
      // Only click if not already expanded (aria-expanded="true" means expanded)
      if (isExpanded !== 'true') {
        await btn.click();
        console.log(`[PALETTE] Clicked to expand category "${category}"`);
        // brief pause for accordion animation
        await page.waitForTimeout(120);
      } else {
        console.log(`[PALETTE] Category "${category}" is already expanded, skipping click`);
      }
    } catch (e) {
      console.warn(`[PALETTE] Error opening category "${category}":`, e);
      // ignore — tests will fail later if the category truly isn't present
    }
  };
  
  test.beforeEach(async ({ page }) => {
    console.log(`\n[SETUP] Starting test setup...`);
    // Start V8 code coverage collection (optional)
    if (COLLECT_COVERAGE) {
      await page.coverage.startJSCoverage();
      console.log(`[SETUP] Code coverage collection enabled`);
    }

    // Navigate to the dashboard before each test
    console.log(`[SETUP] Navigating to dashboard...`);
    await page.goto('/');
    // Clear local storage to ensure a clean state for each test
    console.log(`[SETUP] Clearing local storage...`);
    await page.evaluate(() => window.localStorage.clear());
    // Reload to apply the cleared storage
    console.log(`[SETUP] Reloading page...`);
    await page.goto('/');
    console.log(`[SETUP] Test setup complete\n`);
  });

  test.afterEach(async ({ page }) => {
    if (!COLLECT_COVERAGE) return;

    // Stop V8 code coverage collection
    const coverage = await page.coverage.stopJSCoverage();
    const istanbulCoverage = {};

    for (const entry of coverage) {
      const url = new URL(entry.url);
      // We are only interested in files from our application, served from localhost
      if (!url.hostname.includes('localhost') || !entry.source) {
        continue;
      }

      // Map the URL path to a file system path.
      // e.g., http://localhost:3000/App.tsx -> /path/to/project/App.tsx
      // @ts-ignore
      const filePath = path.join(process.cwd(), url.pathname.substring(1));

      // Skip files that aren't part of the project source (bundled deps / vite cache)
      if (!fs.existsSync(filePath) || filePath.includes(path.sep + 'node_modules' + path.sep) || filePath.includes(path.sep + '.vite' + path.sep)) {
        continue;
      }

      try {
        // Convert the V8 coverage data to the Istanbul format
        const converter = v8to(filePath, 0, { source: entry.source });
        await converter.applyCoverage(entry.functions);
        // Merge the coverage data for this script into our collection
        Object.assign(istanbulCoverage, converter.toIstanbul());
      } catch (e) {
        console.error(`Failed to process coverage for ${filePath}`, e);
      }
    }

    // Write the collected Istanbul coverage data to a unique file in the .nyc_output directory
    if (Object.keys(istanbulCoverage).length > 0) {
      fs.writeFileSync(
        path.join(NYC_OUTPUT_DIR, `coverage-${crypto.randomUUID()}.json`),
        JSON.stringify(istanbulCoverage)
      );
    }
  });


  test('App Lifecycle: Create, Verify, and Delete an App', async ({ page }) => {
    const newAppName = `My Test App - ${Date.now()}`;
    console.log(`[TEST] App Lifecycle Test - App Name: ${newAppName}`);

    // Step 1: Create a new app
    console.log(`[STEP 1] Clicking "New App" button...`);
    await page.getByRole('button', { name: 'New App' }).click();
    console.log(`[STEP 1] Filling app name: ${newAppName}`);
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(newAppName);
    console.log(`[STEP 1] Clicking "Create App" button...`);
    await page.getByRole('button', { name: 'Create App' }).click();

    // Step 2: Verify we are in the editor for the new app
    console.log(`[STEP 2] Verifying editor is open with app name heading...`);
    await expect(page.getByRole('heading', { name: newAppName })).toBeVisible();
    console.log(`[STEP 2] ✓ Editor is open with correct app name`);

    // Step 3: Go back to the dashboard
    console.log(`[STEP 3] Clicking "Apps" button to return to dashboard...`);
    await page.getByRole('button', { name: 'Apps' }).click();

    // Step 4: Verify the new app card is on the dashboard
    console.log(`[STEP 4] Verifying dashboard is visible...`);
    await expect(page.getByRole('heading', { name: 'App Designer' })).toBeVisible();
    console.log(`[STEP 4] Looking for app card with name: ${newAppName}`);
    const appCard = page.locator('.grid > div').filter({ hasText: newAppName });
    await expect(appCard).toBeVisible();
    console.log(`[STEP 4] ✓ App card is visible on dashboard`);

    // Step 5: Delete the app
    console.log(`[STEP 5] Opening app card menu (kebab menu)...`);
    await appCard.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 5] Clicking "Delete" option...`);
    await page.getByText('Delete').click();
    console.log(`[STEP 5] Verifying delete confirmation modal is visible...`);
    await expect(page.getByRole('heading', { name: 'Delete Application' })).toBeVisible();
    console.log(`[STEP 5] Clicking "Delete" button in confirmation modal...`);
    await page.getByRole('button', { name: 'Delete' }).click();

    // Step 6: Verify the app card is gone
    console.log(`[STEP 6] Verifying app card is removed from dashboard...`);
    await expect(appCard).not.toBeVisible();
    console.log(`[STEP 6] ✓ App card successfully deleted`);
    console.log(`[TEST] ✓ App Lifecycle Test completed successfully\n`);
  });

  test('Save as Template from Imported App Workflow', async ({ page }) => {
    console.log(`[TEST] Save as Template from Imported App Workflow Test`);
    
    // Step 1: Import the Login App (to ensure it exists on the dashboard)
    console.log(`[STEP 1] Importing Login app...`);
    // @ts-ignore
    const loginAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'login_app.json'), 'utf-8');
    console.log(`[STEP 1] Setting file input with login app JSON...`);
    await page.locator('input[type="file"]').first().setInputFiles({
        name: 'login-app.json',
        mimeType: 'application/json',
        buffer: Buffer.from(loginAppJson)
    });
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    console.log(`[STEP 1] ✓ Login app imported and visible`);
    
    // Step 2: Find the app card, open its menu, and click "Save as Template"
    console.log(`[STEP 2] Opening app card menu...`);
    const appCard = page.locator('.grid > div').filter({ hasText: 'Login' });
    await appCard.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 2] Clicking "Save as Template"...`);
    await page.getByText('Save as Template').click();
    console.log(`[STEP 2] ✓ Save as Template menu item clicked`);
    
    // Step 3: Fill out the "Save as Template" modal
    console.log(`[STEP 3] Filling out Save as Template modal...`);
    await expect(page.getByRole('heading', { name: 'Save as Template' })).toBeVisible();
    console.log(`[STEP 3] Modal is visible`);
    const templateName = `My Login Template - ${Date.now()}`;
    const templateDesc = `A reusable login form template.`;
    console.log(`[STEP 3] Template name: ${templateName}`);
    console.log(`[STEP 3] Template description: ${templateDesc}`);
    
    // Some environments render the modal slightly differently; find the input by label then sibling input
    const templateNameInput = page.locator('label:has-text("Template Name") + input');
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 3] Template name input found`);
    await templateNameInput.fill(templateName);
    console.log(`[STEP 3] Template name filled`);
    
    const templateDescInput = page.locator('label:has-text("Description") + textarea');
    await expect(templateDescInput).toBeVisible({ timeout: 2000 });
    console.log(`[STEP 3] Template description input found`);
    await templateDescInput.fill(templateDesc);
    console.log(`[STEP 3] Template description filled`);

    // Step 4: Upload a thumbnail image
    console.log(`[STEP 4] Uploading thumbnail image...`);
    // @ts-ignore
    const imagePath = path.join(process.cwd(), 'e2e', 'assets', 'login_thumbnail.png');
    console.log(`[STEP 4] Image path: ${imagePath}`);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload Image' }).click();
    console.log(`[STEP 4] Upload Image button clicked, waiting for file chooser...`);
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);
    console.log(`[STEP 4] ✓ Thumbnail image uploaded`);

    // Step 5: Save the template
    console.log(`[STEP 5] Saving template...`);
    await page.getByRole('button', { name: 'Save Template' }).click();
    console.log(`[STEP 5] ✓ Save Template button clicked`);
    
    // Step 6: Verify modal is closed and template card is visible
    console.log(`[STEP 6] Verifying template was saved...`);
    await expect(page.getByRole('heading', { name: 'Save as Template' })).not.toBeVisible();
    console.log(`[STEP 6] Modal is closed`);
    // Switch to Templates tab to verify the template was saved
    await page.getByRole('button', { name: /Templates/i }).click();
    await page.waitForTimeout(300);
    // h3 is inside a content div; go up two levels to reach the card wrapper
    const templateCard = page.locator('h3').filter({ hasText: templateName }).locator('..').locator('..');
    await expect(templateCard).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 6] ✓ Template card is visible`);

    // Step 7: Verify the thumbnail image exists and has a data URL source
    console.log(`[STEP 7] Verifying thumbnail image...`);
    const thumbnail = templateCard.locator('img');
    // Thumbnail may be uploaded PNG or auto-generated SVG
    await expect(thumbnail).toHaveAttribute('src', /^data:image\/(png|svg\+xml);base64,.+/);
    console.log(`[STEP 7] ✓ Thumbnail image has correct data URL format`);
    console.log(`[TEST] ✓ Save as Template from Imported App Workflow Test completed successfully`);
    
    // Cleanup: Delete imported app and created template
    console.log(`\n[CLEANUP] Starting cleanup...`);
    await deleteAppByName(page, 'Login');
    await deleteTemplateByName(page, templateName);
    console.log(`[CLEANUP] Cleanup completed\n`);
  });

  test('Hotel List App: Import and Verify Components', async ({ page }) => {
    console.log(`[TEST] Hotel List App Import and Verification Test`);
    
    // Step 1: Import the hotel_list_e2e app JSON file
    console.log(`[STEP 1] Reading hotel_list_e2e.json file...`);
    // @ts-ignore
    const hotelAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'hotel_list_e2e.json'), 'utf-8');
    console.log(`[STEP 1] File read successfully, size: ${hotelAppJson.length} bytes`);
    console.log(`[STEP 1] Setting file input with hotel app JSON...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'hotel_list_e2e.json',
      mimeType: 'application/json',
      buffer: Buffer.from(hotelAppJson)
    });
    console.log(`[STEP 1] ✓ File imported`);

    // Step 2: Verify the app appears on dashboard and open in edit mode
    console.log(`[STEP 2] Verifying app appears on dashboard...`);
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' })).toBeVisible();
    console.log(`[STEP 2] ✓ App is visible on dashboard`);
    console.log(`[STEP 2] Opening app in edit mode...`);
    const appCard = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    await appCard.getByRole('button', { name: 'Open' }).click();
    console.log(`[STEP 2] ✓ App opened in edit mode`);

    // Step 3: Verify label with "Filter hotels" exists
    console.log(`[STEP 3] Verifying "Filter hotels" label exists...`);
    const filterHotelsLabel = page.getByText('Filter hotels');
    await expect(filterHotelsLabel).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 3] ✓ "Filter hotels" label is visible`);

    // Step 4: Verify input field exists to filter by hotel name
    console.log(`[STEP 4] Verifying input field for filtering hotels...`);
    const filterInput = page.getByPlaceholder('Enter hotel name...');
    await expect(filterInput).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 4] ✓ Filter input field is visible`);

    // Step 5: Verify label showing "Properties available" (using text pattern since ID might vary)
    console.log(`[STEP 5] Verifying "Properties available" label...`);
    // The label shows dynamic text like "10 Properties available", so we'll check for the pattern
    const propertiesLabel = page.locator('text=/\\d+ Properties available/');
    await expect(propertiesLabel).toBeVisible({ timeout: 5000 });
    const propertiesText = await propertiesLabel.textContent();
    console.log(`[STEP 5] Properties label text: "${propertiesText}"`);
    console.log(`[STEP 5] ✓ Properties available label is visible`);

    // Step 6: Verify List component exists
    console.log(`[STEP 6] Verifying LIST component exists...`);
    const listComponent = page.getByLabel('LIST component');
    await expect(listComponent).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 6] ✓ LIST component is visible`);

    // Step 7: Verify List component has two containers (template children)
    console.log(`[STEP 7] Verifying LIST component has two containers...`);
    // In edit mode, List components show template children. We need to find containers that are children of the List
    const listContainers = listComponent.locator('[data-component-id^="CONTAINER_"]');
    const containerCount = await listContainers.count();
    console.log(`[STEP 7] Found ${containerCount} containers in LIST component`);
    expect(containerCount).toBeGreaterThanOrEqual(2);
    console.log(`[STEP 7] ✓ LIST component has at least 2 containers`);

    // Step 8: Verify first container has image
    console.log(`[STEP 8] Verifying first container has IMAGE component...`);
    const firstContainer = listContainers.first();
    const imageInFirstContainer = firstContainer.getByLabel('IMAGE component');
    await expect(imageInFirstContainer).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 8] ✓ First container has IMAGE component`);

    // Step 9: Verify second container has Book button
    console.log(`[STEP 9] Verifying second container has Book button...`);
    const secondContainer = listContainers.nth(1);
    const bookButton = secondContainer.getByRole('button', { name: /Book/i });
    await expect(bookButton).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 9] ✓ Second container has Book button`);

    // Step 10: Switch to Preview mode
    console.log(`[STEP 10] Switching to Preview mode...`);
    await page.getByRole('button', { name: 'Preview' }).click();
    console.log(`[STEP 10] Waiting for Preview region to be visible...`);
    const previewRegion = page.getByLabel('Preview');
    await expect(previewRegion).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 10] ✓ Preview mode activated`);

    // Step 11: Verify there are 10 hotels shown and heading shows "10 Properties available"
    console.log(`[STEP 11] Verifying 10 hotels are displayed...`);
    // Wait for list items to render
    await page.waitForTimeout(1000);
    const listItems = previewRegion.locator('[data-list-item="true"]');
    const itemCount = await listItems.count();
    console.log(`[STEP 11] Found ${itemCount} hotel items in preview`);
    expect(itemCount).toBe(10);
    console.log(`[STEP 11] ✓ 10 hotels are displayed`);
    
    console.log(`[STEP 11] Verifying heading shows "10 Properties available"...`);
    const propertiesHeading = previewRegion.getByText('10 Properties available');
    await expect(propertiesHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 11] ✓ Heading shows "10 Properties available"`);

    // Step 12: Enter search key "palace" in filter hotel input
    console.log(`[STEP 12] Entering search key "palace" in filter input...`);
    const previewFilterInput = previewRegion.getByPlaceholder('Enter hotel name...');
    await expect(previewFilterInput).toBeVisible({ timeout: 5000 });
    await previewFilterInput.fill('palace');
    console.log(`[STEP 12] Search key "palace" entered`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 12] ✓ Search key entered`);

    // Step 13: Verify 4 hotels are shown with heading "4 Properties available"
    console.log(`[STEP 13] Verifying 4 hotels are shown after filtering...`);
    const filteredItems = previewRegion.locator('[data-list-item="true"]');
    const filteredCount = await filteredItems.count();
    console.log(`[STEP 13] Found ${filteredCount} hotel items after filtering`);
    expect(filteredCount).toBe(4);
    console.log(`[STEP 13] ✓ 4 hotels are displayed`);
    
    console.log(`[STEP 13] Verifying heading shows "4 Properties available"...`);
    const filteredHeading = previewRegion.getByText('4 Properties available');
    await expect(filteredHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 13] ✓ Heading shows "4 Properties available"`);

    // Step 14: Clear/Remove search key
    console.log(`[STEP 14] Clearing search key...`);
    await previewFilterInput.clear();
    console.log(`[STEP 14] Search key cleared`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 14] ✓ Search key cleared`);

    // Step 15: Verify 10 hotels are shown with heading "10 Properties available"
    console.log(`[STEP 15] Verifying 10 hotels are shown after clearing filter...`);
    const clearedItems = previewRegion.locator('[data-list-item="true"]');
    const clearedCount = await clearedItems.count();
    console.log(`[STEP 15] Found ${clearedCount} hotel items after clearing filter`);
    expect(clearedCount).toBe(10);
    console.log(`[STEP 15] ✓ 10 hotels are displayed`);
    
    console.log(`[STEP 15] Verifying heading shows "10 Properties available"...`);
    const clearedHeading = previewRegion.getByText('10 Properties available');
    await expect(clearedHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 15] ✓ Heading shows "10 Properties available"`);
    console.log(`[TEST] ✓ Hotel List App Import and Verification Test completed successfully`);
    
    // Cleanup: Delete imported app
    console.log(`\n[CLEANUP] Starting cleanup...`);
    await page.getByRole('button', { name: 'Apps' }).click();
    await expect(page.getByRole('heading', { name: 'App Designer' })).toBeVisible();
    await deleteAppByName(page, 'Hotel list page-latest');
    console.log(`[CLEANUP] Cleanup completed\n`);
  });

  test('Hotel List Template Creation and Verification', async ({ page }) => {
    console.log(`[TEST] Hotel List Template Creation and Verification Test`);
    
    // Step 1: Import the hotel_list_e2e app JSON file
    console.log(`[STEP 1] Reading hotel_list_e2e.json file...`);
    // @ts-ignore
    const hotelAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'hotel_list_e2e.json'), 'utf-8');
    console.log(`[STEP 1] File read successfully, size: ${hotelAppJson.length} bytes`);
    console.log(`[STEP 1] Setting file input with hotel app JSON...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'hotel_list_e2e.json',
      mimeType: 'application/json',
      buffer: Buffer.from(hotelAppJson)
    });
    console.log(`[STEP 1] ✓ File imported`);

    // Step 2: Verify the app appears on dashboard
    console.log(`[STEP 2] Verifying app appears on dashboard...`);
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' })).toBeVisible();
    console.log(`[STEP 2] ✓ App is visible on dashboard`);

    // Step 3: Save the imported app as a template with unique name
    console.log(`[STEP 3] Saving app as template...`);
    const appCard = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    await appCard.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 3] App card menu opened`);
    await page.getByText('Save as Template').click();
    console.log(`[STEP 3] "Save as Template" clicked`);
    
    // Fill out the template form
    await expect(page.getByRole('heading', { name: 'Save as Template' })).toBeVisible();
    console.log(`[STEP 3] Save as Template modal is visible`);
    const templateName = `Hotel List Template - ${Date.now()}`;
    const templateDesc = `A hotel list app template for testing.`;
    console.log(`[STEP 3] Template name: ${templateName}`);
    console.log(`[STEP 3] Template description: ${templateDesc}`);
    
    const templateNameInput = page.locator('label:has-text("Template Name") + input');
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);
    console.log(`[STEP 3] Template name filled`);
    
    const templateDescInput = page.locator('label:has-text("Description") + textarea');
    await expect(templateDescInput).toBeVisible({ timeout: 2000 });
    await templateDescInput.fill(templateDesc);
    console.log(`[STEP 3] Template description filled`);
    
    await page.getByRole('button', { name: 'Save Template' }).click();
    console.log(`[STEP 3] Save Template button clicked`);
    
    // Verify template was saved — switch to Templates tab first
    await expect(page.getByRole('heading', { name: 'Save as Template' })).not.toBeVisible();
    await page.getByRole('button', { name: /Templates/i }).click();
    await page.waitForTimeout(300);
    const templateCard = page.getByRole('heading', { name: templateName });
    await expect(templateCard).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 3] ✓ Template saved successfully: ${templateName}`);

    // Step 4: Create a new app from the template
    console.log(`[STEP 4] Creating new app from template...`);
    // Switch back to My Apps tab to access From Template button
    await page.getByRole('button', { name: /My Apps/i }).click();
    await page.waitForTimeout(300);
    console.log(`[STEP 4] Clicking "From Template" button...`);
    await page.getByRole('button', { name: 'From Template' }).click();
    console.log(`[STEP 4] Verifying "Create App from Template" modal is visible...`);
    const modalHeading = page.getByRole('heading', { name: 'Create App from Template' });
    await expect(modalHeading).toBeVisible();
    console.log(`[STEP 4] Selecting template: ${templateName}`);
    // Find template card by h3 text (template name) - scoped to modal context
    // The modal has role="dialog" with aria-labelledby="template-selection-title"
    // Navigate from heading to dialog: heading -> header -> div (white bg) -> dialog
    const modal = modalHeading.locator('..').locator('..').locator('..');
    await expect(modal).toBeVisible({ timeout: 5000 });
    const templateCardToSelect = modal.locator('h3').filter({ hasText: templateName }).locator('..').locator('..');
    await expect(templateCardToSelect).toBeVisible({ timeout: 5000 });
    await templateCardToSelect.click();
    console.log(`[STEP 4] ✓ Template selected`);

    // Name the new app
    const newAppName = `Hotel List App From Template - ${Date.now()}`;
    console.log(`[STEP 4] Naming the new app: ${newAppName}`);
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(newAppName);
    console.log(`[STEP 4] Clicking "Create App" button...`);
    await page.getByRole('button', { name: 'Create App' }).click();
    console.log(`[STEP 4] ✓ App created from template`);

    // Step 5: Verify the app is created and open in edit mode
    console.log(`[STEP 5] Verifying app is created...`);
    await expect(page.getByRole('heading', { name: newAppName })).toBeVisible();
    console.log(`[STEP 5] ✓ App created successfully: ${newAppName}`);
    console.log(`[STEP 5] App is already in edit mode`);

    // Step 6: Verify label with "Filter hotels" exists
    console.log(`[STEP 6] Verifying "Filter hotels" label exists...`);
    const filterHotelsLabel = page.getByText('Filter hotels');
    await expect(filterHotelsLabel).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 6] ✓ "Filter hotels" label is visible`);

    // Step 7: Verify input field exists to filter by hotel name
    console.log(`[STEP 7] Verifying input field for filtering hotels...`);
    const filterInput = page.getByPlaceholder('Enter hotel name...');
    await expect(filterInput).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 7] ✓ Filter input field is visible`);

    // Step 8: Verify label showing "Properties available" (using text pattern)
    console.log(`[STEP 8] Verifying "Properties available" label...`);
    const propertiesLabel = page.locator('text=/\\d+ Properties available/');
    await expect(propertiesLabel).toBeVisible({ timeout: 5000 });
    const propertiesText = await propertiesLabel.textContent();
    console.log(`[STEP 8] Properties label text: "${propertiesText}"`);
    console.log(`[STEP 8] ✓ Properties available label is visible`);

    // Step 9: Verify List component exists
    console.log(`[STEP 9] Verifying LIST component exists...`);
    const listComponent = page.getByLabel('LIST component');
    await expect(listComponent).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 9] ✓ LIST component is visible`);

    // Step 10: Verify List component has two containers (template children)
    console.log(`[STEP 10] Verifying LIST component has two containers...`);
    const listContainers = listComponent.locator('[data-component-id^="CONTAINER_"]');
    const containerCount = await listContainers.count();
    console.log(`[STEP 10] Found ${containerCount} containers in LIST component`);
    expect(containerCount).toBeGreaterThanOrEqual(2);
    console.log(`[STEP 10] ✓ LIST component has at least 2 containers`);

    // Step 11: Verify first container has image
    console.log(`[STEP 11] Verifying first container has IMAGE component...`);
    const firstContainer = listContainers.first();
    const imageInFirstContainer = firstContainer.getByLabel('IMAGE component');
    await expect(imageInFirstContainer).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 11] ✓ First container has IMAGE component`);

    // Step 12: Verify second container has Book button
    console.log(`[STEP 12] Verifying second container has Book button...`);
    const secondContainer = listContainers.nth(1);
    const bookButton = secondContainer.getByRole('button', { name: /Book/i });
    await expect(bookButton).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 12] ✓ Second container has Book button`);

    // Step 13: Switch to Preview mode
    console.log(`[STEP 13] Switching to Preview mode...`);
    await page.getByRole('button', { name: 'Preview' }).click();
    console.log(`[STEP 13] Waiting for Preview region to be visible...`);
    const previewRegion = page.getByLabel('Preview');
    await expect(previewRegion).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 13] ✓ Preview mode activated`);

    // Step 14: Verify there are 10 hotels shown and heading shows "10 Properties available"
    console.log(`[STEP 14] Verifying 10 hotels are displayed...`);
    // Wait for list items to render
    await page.waitForTimeout(1000);
    const listItems = previewRegion.locator('[data-list-item="true"]');
    const itemCount = await listItems.count();
    console.log(`[STEP 14] Found ${itemCount} hotel items in preview`);
    expect(itemCount).toBe(10);
    console.log(`[STEP 14] ✓ 10 hotels are displayed`);
    
    console.log(`[STEP 14] Verifying heading shows "10 Properties available"...`);
    const propertiesHeading = previewRegion.getByText('10 Properties available');
    await expect(propertiesHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 14] ✓ Heading shows "10 Properties available"`);

    // Step 15: Enter search key "palace" in filter hotel input
    console.log(`[STEP 15] Entering search key "palace" in filter input...`);
    const previewFilterInput = previewRegion.getByPlaceholder('Enter hotel name...');
    await expect(previewFilterInput).toBeVisible({ timeout: 5000 });
    await previewFilterInput.fill('palace');
    console.log(`[STEP 15] Search key "palace" entered`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 15] ✓ Search key entered`);

    // Step 16: Verify 4 hotels are shown with heading "4 Properties available"
    console.log(`[STEP 16] Verifying 4 hotels are shown after filtering...`);
    const filteredItems = previewRegion.locator('[data-list-item="true"]');
    const filteredCount = await filteredItems.count();
    console.log(`[STEP 16] Found ${filteredCount} hotel items after filtering`);
    expect(filteredCount).toBe(4);
    console.log(`[STEP 16] ✓ 4 hotels are displayed`);
    
    console.log(`[STEP 16] Verifying heading shows "4 Properties available"...`);
    const filteredHeading = previewRegion.getByText('4 Properties available');
    await expect(filteredHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 16] ✓ Heading shows "4 Properties available"`);

    // Step 17: Clear/Remove search key
    console.log(`[STEP 17] Clearing search key...`);
    await previewFilterInput.clear();
    console.log(`[STEP 17] Search key cleared`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 17] ✓ Search key cleared`);
    
    // Verify 10 hotels are shown again
    console.log(`[STEP 17] Verifying 10 hotels are shown after clearing filter...`);
    const clearedItems = previewRegion.locator('[data-list-item="true"]');
    const clearedCount = await clearedItems.count();
    console.log(`[STEP 17] Found ${clearedCount} hotel items after clearing filter`);
    expect(clearedCount).toBe(10);
    console.log(`[STEP 17] ✓ 10 hotels are displayed after clearing filter`);
    
    const clearedHeading = previewRegion.getByText('10 Properties available');
    await expect(clearedHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 17] ✓ Heading shows "10 Properties available" after clearing filter`);
    console.log(`[TEST] ✓ Hotel List Template Creation and Verification Test completed successfully`);
    
    // Cleanup: Delete imported app, created template, and app created from template
    console.log(`\n[CLEANUP] Starting cleanup...`);
    await page.getByRole('button', { name: 'Apps' }).click();
    await expect(page.getByRole('heading', { name: 'App Designer' })).toBeVisible();
    await deleteAppByName(page, newAppName);
    await deleteAppByName(page, 'Hotel list page-latest');
    await deleteTemplateByName(page, templateName);
    console.log(`[CLEANUP] Cleanup completed\n`);
  });

  test('Hotel List App: Import/Export Workflow', async ({ page }) => {
    console.log(`[TEST] Hotel List App Import/Export Workflow Test`);
    
    // Step 1: Import the hotel_list_e2e app JSON file
    console.log(`[STEP 1] Reading hotel_list_e2e.json file...`);
    // @ts-ignore
    const hotelAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'hotel_list_e2e.json'), 'utf-8');
    console.log(`[STEP 1] File read successfully, size: ${hotelAppJson.length} bytes`);
    console.log(`[STEP 1] Setting file input with hotel app JSON...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'hotel_list_e2e.json',
      mimeType: 'application/json',
      buffer: Buffer.from(hotelAppJson)
    });
    console.log(`[STEP 1] ✓ File imported`);

    // Step 2: Verify the app appears on dashboard
    console.log(`[STEP 2] Verifying app appears on dashboard...`);
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' })).toBeVisible();
    console.log(`[STEP 2] ✓ App is visible on dashboard`);

    // Step 3: Export the app with a unique name
    console.log(`[STEP 3] Exporting the app...`);
    const appCard = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    
    // Set up download listener BEFORE opening menu - this ensures we catch the download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    await appCard.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 3] App card menu opened`);
    
    // Wait for Export menu item to be visible and clickable (use link role to avoid "Export All Apps" button)
    const exportMenuItem = page.getByRole('link', { name: 'Export' });
    await expect(exportMenuItem).toBeVisible({ timeout: 3000 });
    
    // Click Export - this should trigger the download
    await exportMenuItem.click();
    console.log(`[STEP 3] Export clicked, waiting for download...`);
    const download = await downloadPromise;
    console.log(`[STEP 3] Download started: ${download.suggestedFilename()}`);
    
    // Save the downloaded file to a temporary location
    const sanitizedAppName = 'hotel_list_page_latest';
    const expectedFileName = `${sanitizedAppName}_backup.json`;
    const tempDir = path.join(process.cwd(), 'e2e', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const exportedFilePath = path.join(tempDir, expectedFileName);
    await download.saveAs(exportedFilePath);
    console.log(`[STEP 3] File saved to: ${exportedFilePath}`);
    
    // Verify the exported file exists and has content
    const exportedFileContent = fs.readFileSync(exportedFilePath, 'utf-8');
    console.log(`[STEP 3] Exported file size: ${exportedFileContent.length} bytes`);
    expect(exportedFileContent.length).toBeGreaterThan(0);
    console.log(`[STEP 3] ✓ App exported successfully`);

    // Step 4: Import the exported app
    console.log(`[STEP 4] Importing the exported app...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: expectedFileName,
      mimeType: 'application/json',
      buffer: Buffer.from(exportedFileContent)
    });
    console.log(`[STEP 4] ✓ Exported file imported`);

    // Step 5: Verify the app is created (it should create a new app with a unique ID)
    console.log(`[STEP 5] Verifying imported app appears on dashboard...`);
    // The app name should be the same, but it will be a new app instance
    // Use .last() to get the newly imported app (there may be multiple apps with the same name)
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' }).last()).toBeVisible();
    console.log(`[STEP 5] ✓ App created successfully`);

    // Step 6: Open the app in edit mode
    console.log(`[STEP 6] Opening app in edit mode...`);
    const importedAppCard = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' }).last();
    await importedAppCard.getByRole('button', { name: 'Open' }).click();
    console.log(`[STEP 6] ✓ App opened in edit mode`);

    // Step 7: Verify label with "Filter hotels" exists
    console.log(`[STEP 7] Verifying "Filter hotels" label exists...`);
    const filterHotelsLabel = page.getByText('Filter hotels');
    await expect(filterHotelsLabel).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 7] ✓ "Filter hotels" label is visible`);

    // Step 8: Verify input field exists to filter by hotel name
    console.log(`[STEP 8] Verifying input field for filtering hotels...`);
    const filterInput = page.getByPlaceholder('Enter hotel name...');
    await expect(filterInput).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 8] ✓ Filter input field is visible`);

    // Step 9: Verify label showing "Properties available" (using text pattern)
    console.log(`[STEP 9] Verifying "Properties available" label...`);
    const propertiesLabel = page.locator('text=/\\d+ Properties available/');
    await expect(propertiesLabel).toBeVisible({ timeout: 5000 });
    const propertiesText = await propertiesLabel.textContent();
    console.log(`[STEP 9] Properties label text: "${propertiesText}"`);
    console.log(`[STEP 9] ✓ Properties available label is visible`);

    // Step 10: Verify List component exists
    console.log(`[STEP 10] Verifying LIST component exists...`);
    const listComponent = page.getByLabel('LIST component');
    await expect(listComponent).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 10] ✓ LIST component is visible`);

    // Step 11: Verify List component has two containers (template children)
    console.log(`[STEP 11] Verifying LIST component has two containers...`);
    const listContainers = listComponent.locator('[data-component-id^="CONTAINER_"]');
    const containerCount = await listContainers.count();
    console.log(`[STEP 11] Found ${containerCount} containers in LIST component`);
    expect(containerCount).toBeGreaterThanOrEqual(2);
    console.log(`[STEP 11] ✓ LIST component has at least 2 containers`);

    // Step 12: Verify first container has image
    console.log(`[STEP 12] Verifying first container has IMAGE component...`);
    const firstContainer = listContainers.first();
    const imageInFirstContainer = firstContainer.getByLabel('IMAGE component');
    await expect(imageInFirstContainer).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 12] ✓ First container has IMAGE component`);

    // Step 13: Verify second container has Book button
    console.log(`[STEP 13] Verifying second container has Book button...`);
    const secondContainer = listContainers.nth(1);
    const bookButton = secondContainer.getByRole('button', { name: /Book/i });
    await expect(bookButton).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 13] ✓ Second container has Book button`);

    // Step 14: Switch to Preview mode
    console.log(`[STEP 14] Switching to Preview mode...`);
    // Wait for editor to be stable before switching to preview
    await page.waitForTimeout(500);
    const previewButton = page.getByRole('button', { name: /preview/i });
    await expect(previewButton).toBeVisible({ timeout: 5000 });
    await previewButton.click();
    console.log(`[STEP 14] Waiting for Preview region to be visible...`);
    const previewRegion = page.getByLabel('Preview');
    await expect(previewRegion).toBeVisible({ timeout: 10000 });
    console.log(`[STEP 14] ✓ Preview mode activated`);

    // Step 15: Verify there are 10 hotels shown and heading shows "10 Properties available"
    console.log(`[STEP 15] Verifying 10 hotels are displayed...`);
    // Wait for list items to render
    await page.waitForTimeout(1000);
    const listItems = previewRegion.locator('[data-list-item="true"]');
    const itemCount = await listItems.count();
    console.log(`[STEP 15] Found ${itemCount} hotel items in preview`);
    expect(itemCount).toBe(10);
    console.log(`[STEP 15] ✓ 10 hotels are displayed`);
    
    console.log(`[STEP 15] Verifying heading shows "10 Properties available"...`);
    const propertiesHeading = previewRegion.getByText('10 Properties available');
    await expect(propertiesHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 15] ✓ Heading shows "10 Properties available"`);

    // Step 16: Enter search key "palace" in filter hotel input
    console.log(`[STEP 16] Entering search key "palace" in filter input...`);
    const previewFilterInput = previewRegion.getByPlaceholder('Enter hotel name...');
    await expect(previewFilterInput).toBeVisible({ timeout: 5000 });
    await previewFilterInput.fill('palace');
    console.log(`[STEP 16] Search key "palace" entered`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 16] ✓ Search key entered`);

    // Step 17: Verify 4 hotels are shown with heading "4 Properties available"
    console.log(`[STEP 17] Verifying 4 hotels are shown after filtering...`);
    const filteredItems = previewRegion.locator('[data-list-item="true"]');
    const filteredCount = await filteredItems.count();
    console.log(`[STEP 17] Found ${filteredCount} hotel items after filtering`);
    expect(filteredCount).toBe(4);
    console.log(`[STEP 17] ✓ 4 hotels are displayed`);
    
    console.log(`[STEP 17] Verifying heading shows "4 Properties available"...`);
    const filteredHeading = previewRegion.getByText('4 Properties available');
    await expect(filteredHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 17] ✓ Heading shows "4 Properties available"`);

    // Step 18: Clear/Remove search key
    console.log(`[STEP 18] Clearing search key...`);
    await previewFilterInput.clear();
    console.log(`[STEP 18] Search key cleared`);
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    console.log(`[STEP 18] ✓ Search key cleared`);
    
    // Verify 10 hotels are shown again
    console.log(`[STEP 18] Verifying 10 hotels are shown after clearing filter...`);
    const clearedItems = previewRegion.locator('[data-list-item="true"]');
    const clearedCount = await clearedItems.count();
    console.log(`[STEP 18] Found ${clearedCount} hotel items after clearing filter`);
    expect(clearedCount).toBe(10);
    console.log(`[STEP 18] ✓ 10 hotels are displayed after clearing filter`);
    
    const clearedHeading = previewRegion.getByText('10 Properties available');
    await expect(clearedHeading).toBeVisible({ timeout: 5000 });
    console.log(`[STEP 18] ✓ Heading shows "10 Properties available" after clearing filter`);
    
    // Cleanup: Delete imported apps and remove temporary exported file
    console.log(`\n[CLEANUP] Starting cleanup...`);
    await page.getByRole('button', { name: 'Apps' }).click();
    await expect(page.getByRole('heading', { name: 'App Designer' })).toBeVisible();
    await deleteAllAppsByName(page, 'Hotel list page-latest');
    
    // Remove temporary exported file
    try {
      if (fs.existsSync(exportedFilePath)) {
        fs.unlinkSync(exportedFilePath);
        console.log(`[CLEANUP] Temporary exported file removed`);
      }
    } catch (e) {
      console.warn(`[CLEANUP] Failed to remove temporary file: ${e}`);
    }
    console.log(`[CLEANUP] Cleanup completed\n`);
    
    console.log(`[TEST] ✓ Hotel List App Import/Export Workflow Test completed successfully\n`);
  });

  test('Hotel List App: Import, Export, and Delete', async ({ page }) => {
    console.log(`[TEST] Hotel List App Import, Export, and Delete Test`);
    
    // Step 1: Import the hotel_list_e2e app JSON file
    console.log(`[STEP 1] Reading hotel_list_e2e.json file...`);
    // @ts-ignore
    const hotelAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'hotel_list_e2e.json'), 'utf-8');
    console.log(`[STEP 1] File read successfully, size: ${hotelAppJson.length} bytes`);
    console.log(`[STEP 1] Setting file input with hotel app JSON...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'hotel_list_e2e.json',
      mimeType: 'application/json',
      buffer: Buffer.from(hotelAppJson)
    });
    console.log(`[STEP 1] ✓ File imported`);

    // Step 2: Verify the app appears on dashboard
    console.log(`[STEP 2] Verifying app appears on dashboard...`);
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' })).toBeVisible();
    console.log(`[STEP 2] ✓ App is visible on dashboard`);

    // Step 3: Export the app with a unique name
    console.log(`[STEP 3] Exporting the app...`);
    const appCard = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    
    // Set up download listener BEFORE opening menu - this ensures we catch the download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    await appCard.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 3] App card menu opened`);
    
    // Wait for Export menu item to be visible and clickable (use link role to avoid "Export All Apps" button)
    const exportMenuItem = page.getByRole('link', { name: 'Export' });
    await expect(exportMenuItem).toBeVisible({ timeout: 3000 });
    
    // Click Export - this should trigger the download
    await exportMenuItem.click();
    console.log(`[STEP 3] Export clicked, waiting for download...`);
    const download = await downloadPromise;
    console.log(`[STEP 3] Download started: ${download.suggestedFilename()}`);
    
    // Save the downloaded file to a temporary location
    const sanitizedAppName = 'hotel_list_page_latest';
    const expectedFileName = `${sanitizedAppName}_backup.json`;
    const tempDir = path.join(process.cwd(), 'e2e', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const exportedFilePath = path.join(tempDir, expectedFileName);
    await download.saveAs(exportedFilePath);
    console.log(`[STEP 3] File saved to: ${exportedFilePath}`);
    
    // Verify the exported file exists and has content
    const exportedFileContent = fs.readFileSync(exportedFilePath, 'utf-8');
    console.log(`[STEP 3] Exported file size: ${exportedFileContent.length} bytes`);
    expect(exportedFileContent.length).toBeGreaterThan(0);
    console.log(`[STEP 3] ✓ App exported successfully`);

    // Step 4: Import the exported app
    console.log(`[STEP 4] Importing the exported app...`);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: expectedFileName,
      mimeType: 'application/json',
      buffer: Buffer.from(exportedFileContent)
    });
    console.log(`[STEP 4] ✓ Exported file imported`);

    // Step 5: Verify the app is created (it should create a new app with a unique ID)
    console.log(`[STEP 5] Verifying imported app appears on dashboard...`);
    // The app name should be the same, but it will be a new app instance
    // Wait a bit for the import to complete
    await page.waitForTimeout(500);
    // Use .last() to get the newly imported app (there may be multiple apps with the same name)
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' }).last()).toBeVisible();
    console.log(`[STEP 5] ✓ App created successfully`);

    // Step 6: Open the app in edit mode
    console.log(`[STEP 6] Opening app in edit mode...`);
    // Find the last app card (the newly imported one) to ensure we're working with the right app
    const importedAppCards = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    const importedAppCard = importedAppCards.last();
    await importedAppCard.getByRole('button', { name: 'Open' }).click();
    console.log(`[STEP 6] ✓ App opened in edit mode`);
    
    // Verify we're in the editor
    await expect(page.getByRole('heading', { name: 'Hotel list page-latest' })).toBeVisible();
    console.log(`[STEP 6] ✓ Editor is open`);

    // Step 7: Go back to dashboard
    console.log(`[STEP 7] Going back to dashboard...`);
    await page.getByRole('button', { name: 'Apps' }).click();
    console.log(`[STEP 7] ✓ Returned to dashboard`);
    
    // Verify dashboard is visible
    await expect(page.getByRole('heading', { name: 'App Designer' })).toBeVisible();
    console.log(`[STEP 7] ✓ Dashboard is visible`);

    // Step 8: Delete the app
    console.log(`[STEP 8] Deleting the imported app...`);
    // Find the last app card again (the one we just imported)
    const appCardsToDelete = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    const initialCount = await appCardsToDelete.count();
    console.log(`[STEP 8] Found ${initialCount} app(s) with name "Hotel list page-latest"`);
    const appCardToDelete = appCardsToDelete.last();
    await expect(appCardToDelete).toBeVisible();
    console.log(`[STEP 8] App card found`);
    
    // Open the menu and click delete
    await appCardToDelete.getByRole('button').last().click(); // Click the kebab menu
    console.log(`[STEP 8] App card menu opened`);
    await page.getByText('Delete').click();
    console.log(`[STEP 8] Delete option clicked`);
    
    // Confirm deletion in the modal
    await expect(page.getByRole('heading', { name: 'Delete Application' })).toBeVisible();
    console.log(`[STEP 8] Delete confirmation modal is visible`);
    await page.getByRole('button', { name: 'Delete' }).click();
    console.log(`[STEP 8] Delete confirmed`);
    console.log(`[STEP 8] ✓ Delete action completed`);

    // Step 9: Verify that the app is deleted
    console.log(`[STEP 9] Verifying app is deleted...`);
    // Wait a moment for the deletion to complete
    await page.waitForTimeout(500);
    
    // Verify that the count decreased by 1
    const remainingAppCards = page.locator('.grid > div').filter({ hasText: 'Hotel list page-latest' });
    const remainingCount = await remainingAppCards.count();
    console.log(`[STEP 9] Remaining apps with name "Hotel list page-latest": ${remainingCount}`);
    expect(remainingCount).toBe(initialCount - 1);
    console.log(`[STEP 9] ✓ App count decreased from ${initialCount} to ${remainingCount}`);
    console.log(`[STEP 9] ✓ App successfully deleted`);
    
    // Cleanup: Delete remaining imported app and remove temporary exported file
    console.log(`\n[CLEANUP] Starting cleanup...`);
    // The imported app was already deleted in step 8, but we need to clean up the original imported app
    await deleteAppByName(page, 'Hotel list page-latest');
    
    // Remove temporary exported file
    try {
      if (fs.existsSync(exportedFilePath)) {
        fs.unlinkSync(exportedFilePath);
        console.log(`[CLEANUP] Temporary exported file removed`);
      }
    } catch (e) {
      console.warn(`[CLEANUP] Failed to remove temporary file: ${e}`);
    }
    console.log(`[CLEANUP] Cleanup completed\n`);
    
    console.log(`[TEST] ✓ Hotel List App Import, Export, and Delete Test completed successfully\n`);
  });

});
