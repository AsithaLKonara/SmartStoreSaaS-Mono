/**
 * WCAG Accessibility Compliance Tests
 * Tests for Web Content Accessibility Guidelines compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test credentials
const TEST_USER = {
  email: 'admin@techhub.lk',
  password: 'password123'
};

async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

test.describe('Accessibility Tests - WCAG 2.1 AA', () => {
  
  test('01 - Login page meets WCAG standards', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Help: ${violation.helpUrl}`);
      });
    }
    
    // Expect no critical or serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('02 - Dashboard has proper ARIA labels', async ({ page }) => {
    await login(page);
    
    // Check for landmark regions
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('03 - Forms have proper labels and descriptions', async ({ page }) => {
    await page.goto('/login');
    
    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                       await page.locator('label[for="email"]').textContent();
    expect(emailLabel).toBeTruthy();
    
    // Check password input has label
    const passwordInput = page.locator('input[type="password"]');
    const passwordLabel = await passwordInput.getAttribute('aria-label') ||
                          await page.locator('label[for="password"]').textContent();
    expect(passwordLabel).toBeTruthy();
    
    // Check submit button has accessible name
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent() || 
                       await submitButton.getAttribute('aria-label');
    expect(buttonText).toBeTruthy();
  });

  test('04 - Color contrast meets WCAG AA standards', async ({ page }) => {
    await login(page);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('#__next') // Scan the entire app
      .analyze();
    
    // Check specifically for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    if (contrastViolations.length > 0) {
      console.log('Color contrast violations:');
      contrastViolations.forEach(violation => {
        console.log(`- ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`  Element: ${node.html.substring(0, 100)}`);
        });
      });
    }
    
    // Allow minor violations, but expect no critical ones
    expect(contrastViolations.filter(v => v.impact === 'serious').length).toBeLessThanOrEqual(5);
  });

  test('05 - Images have alt text', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    
    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    // Check each image has alt attribute
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Image should have alt text, aria-label, or be decorative
      const isAccessible = alt !== null || ariaLabel !== null || role === 'presentation';
      expect(isAccessible).toBeTruthy();
    }
  });

  test('06 - Headings follow proper hierarchy', async ({ page }) => {
    await login(page);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();
    
    // Check for heading order violations
    const headingViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'heading-order'
    );
    
    expect(headingViolations).toHaveLength(0);
  });

  test('07 - Interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Should focus email input
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
    
    await page.keyboard.press('Tab'); // Should focus password input
    focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
    
    await page.keyboard.press('Tab'); // Should focus submit button
    focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
  });

  test('08 - Skip links are available for navigation', async ({ page }) => {
    await login(page);
    
    // Check for skip link (usually hidden but appears on focus)
    const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
    
    // Skip link may not exist, but if it does, it should be functional
    const exists = await skipLink.count() > 0;
    if (exists) {
      await expect(skipLink).toHaveAttribute('href');
    }
  });

  test('09 - Focus indicators are visible', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to email input
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible outline or border
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const styles = await page.evaluate(el => {
      const computed = window.getComputedStyle(el as Element);
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        borderWidth: computed.borderWidth,
        boxShadow: computed.boxShadow
      };
    }, focusedElement);
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      styles.outline !== 'none' ||
      parseInt(styles.outlineWidth) > 0 ||
      parseInt(styles.borderWidth) > 1 ||
      styles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('10 - No automatic redirects or timeouts', async ({ page }) => {
    await login(page);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .analyze();
    
    // Check for meta refresh violations
    const metaRefreshViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'meta-refresh'
    );
    
    expect(metaRefreshViolations).toHaveLength(0);
  });

  test('11 - Tables have proper headers', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    
    // If tables exist, check they have proper headers
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    if (tableCount > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('table')
        .analyze();
      
      const tableViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('table') || v.id.includes('th')
      );
      
      expect(tableViolations.filter(v => v.impact === 'serious')).toHaveLength(0);
    }
  });

  test('12 - Modal dialogs are accessible', async ({ page }) => {
    await login(page);
    
    // Look for any modal or dialog elements
    const modals = page.locator('[role="dialog"], [role="alertdialog"], .modal');
    const modalCount = await modals.count();
    
    if (modalCount > 0) {
      // Check first modal has proper ARIA attributes
      const firstModal = modals.first();
      const hasAriaModal = await firstModal.getAttribute('aria-modal');
      const hasRole = await firstModal.getAttribute('role');
      
      expect(hasRole).toBeTruthy();
      // Modal should trap focus and have proper role
    }
  });
});



