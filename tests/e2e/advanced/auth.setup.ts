/**
 * Playwright Auth Setup (Login once per role)
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authDir = '.auth';

setup('SUPER_ADMIN Login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[data-testid="email-input"]', 'superadmin@smartstore.com');
  await page.fill('input[data-testid="password-input"]', 'SuperAdmin123!');
  await page.click('button[data-testid="submit-button"]');
  // Extended timeout for slow dev server
  await page.waitForURL('**/dashboard', { timeout: 120000 });
  await page.context().storageState({ path: path.join(authDir, 'superadmin.json') });
});

setup('TENANT_ADMIN Login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[data-testid="email-input"]', 'admin@demo.com');
  await page.fill('input[data-testid="password-input"]', 'Admin123!');
  await page.click('button[data-testid="submit-button"]');
  await page.waitForURL('**/dashboard', { timeout: 120000 });
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

setup('STAFF Login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[data-testid="email-input"]', 'sales@demo.com');
  await page.fill('input[data-testid="password-input"]', 'Sales123!');
  await page.click('button[data-testid="submit-button"]');
  await page.waitForURL('**/dashboard', { timeout: 120000 });
  await page.context().storageState({ path: path.join(authDir, 'staff.json') });
});

setup('CUSTOMER Login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[data-testid="email-input"]', 'customer@demo.com');
  await page.fill('input[data-testid="password-input"]', 'Customer123!');
  await page.click('button[data-testid="submit-button"]');
  await page.waitForURL('**/dashboard', { timeout: 120000 });
  await page.context().storageState({ path: path.join(authDir, 'customer.json') });
});
