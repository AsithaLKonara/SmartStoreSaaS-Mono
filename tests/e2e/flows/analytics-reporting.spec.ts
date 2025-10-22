import { test, expect } from '@playwright/test';
import { loginViaUI } from '../utils/auth';
import { resetDatabase, seedDatabase } from '../utils/test-data';

test.describe('Analytics and Reporting', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    await seedDatabase(request, 'full');
  });

  test('admin can view dashboard analytics', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard');
    
    // Verify key metrics are visible
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    
    // Verify charts load
    await expect(page.locator('[data-chart="revenue"]')).toBeVisible();
    await expect(page.locator('[data-chart="orders"]')).toBeVisible();
    
    // Verify recent activity
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    
    // Verify low stock alerts
    await expect(page.locator('text=Stock Alerts')).toBeVisible();
  });

  test('admin can generate sales report', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/reports');
    
    // Select report type
    await page.click('button:text("Generate Report")');
    await page.selectOption('select[name="reportType"]', 'sales');
    
    // Set date range
    await page.selectOption('select[name="period"]', 'this_month');
    
    // Select format
    await page.selectOption('select[name="format"]', 'pdf');
    
    // Generate
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:text("Generate")'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('sales');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('admin can view customer insights', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/analytics/customer-insights');
    
    // Verify insights load
    await expect(page.locator('text=Customer Insights')).toBeVisible();
    
    // Check segments
    await expect(page.locator('text=VIP Customers')).toBeVisible();
    await expect(page.locator('text=At Risk')).toBeVisible();
    await expect(page.locator('text=New Customers')).toBeVisible();
    
    // View customer lifetime value
    await expect(page.locator('text=Lifetime Value')).toBeVisible();
    
    // Check churn prediction
    await expect(page.locator('text=Churn Risk')).toBeVisible();
  });

  test('admin can use AI analytics', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/ai-analytics');
    
    // Ask natural language question
    await page.fill('textarea[placeholder*="Ask"]', 'What are my top 5 products this month?');
    await page.click('button:text("Analyze")');
    
    // Wait for AI response
    await expect(page.locator('text=Analyzing')).toBeVisible();
    await expect(page.locator('[data-ai-response]')).toBeVisible({ timeout: 15000 });
    
    // Verify insights shown
    await expect(page.locator('text=Top Products')).toBeVisible();
  });

  test('admin can export analytics data', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/analytics');
    
    // Select date range
    const startDate = new Date();
    startDate.setDate(1); // First day of month
    
    await page.fill('input[name="startDate"]', startDate.toISOString().split('T')[0]);
    
    // Export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:text("Export")'),
    ]);
    
    expect(download.suggestedFilename()).toContain('analytics');
  });

  test('staff with limited access sees limited analytics', async ({ page }) => {
    await loginViaUI(page, 'staffSales');
    
    await page.goto('/dashboard');
    
    // Should see basic metrics only
    await expect(page.locator('text=My Sales')).toBeVisible();
    await expect(page.locator('text=My Orders')).toBeVisible();
    
    // Should not see financial metrics
    await expect(page.locator('text=Total Revenue')).not.toBeVisible();
    await expect(page.locator('text=Profit')).not.toBeVisible();
  });

  test('enhanced analytics shows predictive insights', async ({ page }) => {
    await loginViaUI(page, 'tenantAdmin');
    
    await page.goto('/dashboard/analytics/enhanced');
    
    // ML-powered insights
    await expect(page.locator('text=Demand Forecast')).toBeVisible();
    await expect(page.locator('text=Churn Prediction')).toBeVisible();
    await expect(page.locator('text=Recommendations')).toBeVisible();
    
    // View forecast for specific product
    await page.click('button:text("View Forecast")');
    await page.fill('input[placeholder*="Product"]', 'Premium T-Shirt');
    await page.click('text=Premium T-Shirt');
    await page.fill('input[name="horizon"]', '30'); // days
    await page.click('button:text("Generate Forecast")');
    
    // Wait for ML processing
    await expect(page.locator('text=Forecasting')).toBeVisible();
    await expect(page.locator('[data-forecast-chart]')).toBeVisible({ timeout: 20000 });
    
    // Verify recommendations
    await expect(page.locator('text=Recommended Action')).toBeVisible();
  });
});

