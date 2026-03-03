import { test, expect } from '@playwright/test';

/**
 * E2E tests for responsive width in Preview mode.
 *
 * Verifies that responsive width overrides (e.g., 100% on mobile, 50% on desktop)
 * are correctly applied in preview mode when switching device presets.
 *
 * Regression test for: preview mode was not passing activeBreakpoint to
 * RenderedComponent, so responsive overrides were ignored and the base
 * (mobile) width was always used regardless of the selected device preset.
 */
test.describe('Responsive Width in Preview Mode', () => {
  /**
   * Seed localStorage with a test app containing a LABEL component
   * with responsive width overrides: 100% (mobile base) → 75% (tablet) → 50% (desktop).
   */
  const seedAppWithResponsiveWidth = async (page: any) => {
    const appId = `test_responsive_${Date.now()}`;
    const pageId = 'page_main';
    const componentId = 'LABEL_responsive_test';

    const appDefinition = {
      id: appId,
      name: 'Responsive Width Test',
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      pages: [{ id: pageId, name: 'Main Page' }],
      mainPageId: pageId,
      components: [
        {
          id: componentId,
          type: 'LABEL',
          pageId: pageId,
          parentId: null,
          props: {
            text: 'Responsive Test Label',
            width: '100%',
            height: 'auto',
            fontSize: 16,
            fontWeight: 'bold',
            color: '#000000',
            responsive: {
              tablet: { width: '75%' },
              desktop: { width: '50%' },
            },
          },
        },
      ],
      dataStore: {},
      variables: [],
      theme: {
        colors: {
          primary: '#4F46E5', onPrimary: '#FFFFFF',
          secondary: '#06B6D4', onSecondary: '#FFFFFF',
          background: '#FFFFFF', surface: '#F5F5F5',
          text: '#1A1A1A', border: '#D1D1D1',
          primaryLight: '#818CF8', primaryDark: '#3730A3',
          secondaryLight: '#22D3EE', secondaryDark: '#0891B2',
          error: '#EF4444', onError: '#FFFFFF',
          warning: '#F59E0B', onWarning: '#FFFFFF',
          success: '#10B981', onSuccess: '#FFFFFF',
          info: '#3B82F6', onInfo: '#FFFFFF',
          surfaceVariant: '#E5E7EB', onSurface: '#1F2937',
          onBackground: '#111827',
          hover: '#F3F4F6', focus: '#DBEAFE',
          disabled: '#9CA3AF', onDisabled: '#6B7280',
          outline: '#D1D5DB', shadow: '#00000020',
          overlay: '#00000040', link: '#2563EB',
        },
        font: { family: 'Segoe UI, sans-serif' },
        border: { width: '1px', style: 'solid', widthThin: '1px', widthMedium: '2px', widthThick: '3px' },
        radius: { default: '4px', none: '0px', sm: '2px', md: '4px', lg: '8px', xl: '12px', full: '9999px' },
        spacing: { xs: '2px', sm: '4px', md: '8px', lg: '16px', xl: '24px', xxl: '32px', xxxl: '48px', xxxxl: '64px' },
        typography: {
          fontFamily: 'Segoe UI, sans-serif', fontFamilyHeading: 'Segoe UI, sans-serif',
          fontFamilyMono: 'monospace',
          fontSizeXs: '10px', fontSizeSm: '12px', fontSizeMd: '14px', fontSizeLg: '16px',
          fontSizeXl: '20px', fontSizeXxl: '24px', fontSizeXxxl: '32px',
          fontWeightLight: '300', fontWeightNormal: '400', fontWeightMedium: '500',
          fontWeightSemibold: '600', fontWeightBold: '700',
          lineHeightTight: '1.2', lineHeightNormal: '1.5', lineHeightRelaxed: '1.75',
          letterSpacingTight: '-0.025em', letterSpacingNormal: '0em', letterSpacingWide: '0.05em',
        },
        shadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.15)', inner: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
        transition: { durationFast: '150ms', durationNormal: '300ms', durationSlow: '500ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      },
    };

    const appIndex = [{
      id: appId,
      name: 'Responsive Width Test',
      createdAt: appDefinition.createdAt,
      lastModifiedAt: appDefinition.lastModifiedAt,
    }];

    await page.evaluate(({ indexKey, appKey, indexData, appData }: any) => {
      window.localStorage.setItem(indexKey, JSON.stringify(indexData));
      window.localStorage.setItem(appKey, JSON.stringify(appData));
    }, {
      indexKey: 'gemini-low-code-apps-index',
      appKey: `gemini-low-code-app-${appId}`,
      indexData: appIndex,
      appData: appDefinition,
    });

    return { appId, componentId };
  };

  const openAppInEditor = async (page: any) => {
    const appCard = page.getByText('Responsive Width Test').first();
    await appCard.waitFor({ state: 'visible', timeout: 10000 });
    await appCard.click();
    await expect(page.getByRole('heading', { name: 'Responsive Width Test' })).toBeVisible({ timeout: 10000 });
  };

  const switchToPreview = async (page: any) => {
    const previewButton = page.getByRole('button', { name: /Switch to preview/i });
    await previewButton.click();
    await expect(page.getByRole('region', { name: 'Preview' })).toBeVisible({ timeout: 5000 });
  };

  /** Measure the component's width as a ratio of its parent's content area. */
  const measureWidthRatio = async (page: any, componentId: string): Promise<number> => {
    const component = page.locator(`[data-component-id="${componentId}"]`);
    await expect(component).toBeVisible({ timeout: 5000 });
    return component.evaluate((el: HTMLElement) => {
      const parent = el.parentElement;
      if (!parent) return 0;
      const parentStyle = window.getComputedStyle(parent);
      const parentContentWidth = parent.getBoundingClientRect().width
        - parseFloat(parentStyle.paddingLeft)
        - parseFloat(parentStyle.paddingRight);
      return el.getBoundingClientRect().width / parentContentWidth;
    });
  };

  test('desktop device preset applies 50% width override in preview', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    const { componentId } = await seedAppWithResponsiveWidth(page);
    await page.goto('/');

    // Select Desktop device before entering preview
    await openAppInEditor(page);
    await page.getByTestId('device-desktop').click();
    await page.waitForTimeout(300);

    await switchToPreview(page);
    await page.waitForTimeout(300);

    const ratio = await measureWidthRatio(page, componentId);
    expect(ratio).toBeCloseTo(0.5, 1);
  });

  test('tablet device preset applies 75% width override in preview', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    const { componentId } = await seedAppWithResponsiveWidth(page);
    await page.goto('/');

    await openAppInEditor(page);
    await page.getByTestId('device-tablet').click();
    await page.waitForTimeout(300);

    await switchToPreview(page);
    await page.waitForTimeout(300);

    const ratio = await measureWidthRatio(page, componentId);
    expect(ratio).toBeCloseTo(0.75, 1);
  });

  test('mobile device preset uses base 100% width in preview', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    const { componentId } = await seedAppWithResponsiveWidth(page);
    await page.goto('/');

    await openAppInEditor(page);
    await page.getByTestId('device-mobile').click();
    await page.waitForTimeout(300);

    await switchToPreview(page);
    await page.waitForTimeout(300);

    const ratio = await measureWidthRatio(page, componentId);
    expect(ratio).toBeCloseTo(1.0, 1);
  });

  test('switching device in preview mode updates component width immediately', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    const { componentId } = await seedAppWithResponsiveWidth(page);
    await page.goto('/');

    await openAppInEditor(page);
    await switchToPreview(page);

    // Start at mobile (fullWidth default → mobile breakpoint)
    await page.getByTestId('device-mobile').click();
    await page.waitForTimeout(300);
    const mobileRatio = await measureWidthRatio(page, componentId);
    expect(mobileRatio).toBeCloseTo(1.0, 1);

    // Switch to desktop
    await page.getByTestId('device-desktop').click();
    await page.waitForTimeout(300);
    const desktopRatio = await measureWidthRatio(page, componentId);
    expect(desktopRatio).toBeCloseTo(0.5, 1);

    // Switch back to tablet
    await page.getByTestId('device-tablet').click();
    await page.waitForTimeout(300);
    const tabletRatio = await measureWidthRatio(page, componentId);
    expect(tabletRatio).toBeCloseTo(0.75, 1);
  });
});
