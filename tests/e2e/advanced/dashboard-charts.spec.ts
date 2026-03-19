import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance & Charts Verification', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('Dashboard Metrics should be populated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Wait for at least one stat card to actually appear
    const statsSelector = '.stat-value, .metric-value, [data-testid="stat-card"]';
    await page.waitForSelector(statsSelector, { timeout: 30000 });
    const stats = page.locator(statsSelector);
    const firstStat = await stats.first().textContent();
    
    console.log(`📊 First dashboard metric: ${firstStat}`);
    
    // Check for "No data" placeholder
    await expect(page.locator('body')).not.toContainText('No data available');
    
    // Check for charts
    const charts = page.locator('canvas, svg.recharts-surface, .chart-container');
    await expect(charts.first()).toBeVisible({ timeout: 15000 });
  });

  test('Inventory Dashboard should load correctly', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const inventoryStats = page.locator('.inventory-summary, [data-testid="inventory-stats"]');
    await expect(inventoryStats).toBeVisible();
  });
});
