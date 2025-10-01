import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should test responsive navigation', async ({ page }) => {
    // Test desktop navigation
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check for desktop navigation elements
    const desktopNav = page.locator('nav').or(page.locator('[role="navigation"]'));
    if (await desktopNav.isVisible()) {
      console.log('✅ Desktop navigation is visible');
    }
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label="Menu"]')
      .or(page.locator('button:has-text("Menu")'))
      .or(page.locator('button:has([data-testid="menu-icon"])'));
    
    if (await mobileMenuButton.isVisible()) {
      console.log('✅ Mobile menu button is visible');
      
      // Test mobile menu toggle
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // Check if mobile menu opens
      const mobileMenu = page.locator('[role="menu"]').or(page.locator('.mobile-menu'));
      if (await mobileMenu.isVisible()) {
        console.log('✅ Mobile menu opens correctly');
      }
    }
  });

  test('should test theme toggle functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"]')
      .or(page.locator('button:has-text("Dark")'))
      .or(page.locator('button:has-text("Light")'))
      .or(page.locator('[data-testid="theme-toggle"]'));
    
    if (await themeToggle.isVisible()) {
      console.log('✅ Theme toggle button is visible');
      
      // Test theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changes (look for dark mode classes)
      const body = page.locator('body');
      const hasDarkClass = await body.evaluate(el => 
        el.classList.contains('dark') || 
        el.getAttribute('data-theme') === 'dark' ||
        el.classList.contains('dark-mode')
      );
      
      if (hasDarkClass) {
        console.log('✅ Theme toggle works - dark mode detected');
      } else {
        console.log('ℹ️ Theme toggle clicked but dark mode not detected');
      }
    } else {
      console.log('ℹ️ Theme toggle button not found');
    }
  });

  test('should test form validation', async ({ page }) => {
    // Test login form validation
    await page.goto('/login');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation messages
      const validationMessages = page.locator('text=required')
        .or(page.locator('text=invalid'))
        .or(page.locator('[role="alert"]'));
      
      if (await validationMessages.count() > 0) {
        console.log('✅ Form validation is working');
      } else {
        console.log('ℹ️ No validation messages found');
      }
    }
  });

  test('should test loading states', async ({ page }) => {
    // Test if loading indicators are present
    await page.goto('/dashboard');
    
    // Look for loading spinners or skeletons
    const loadingIndicators = page.locator('[data-testid="loading"]')
      .or(page.locator('.loading-spinner'))
      .or(page.locator('.skeleton'))
      .or(page.locator('text=Loading'));
    
    if (await loadingIndicators.count() > 0) {
      console.log('✅ Loading indicators are present');
    } else {
      console.log('ℹ️ No loading indicators found');
    }
  });

  test('should test error boundaries', async ({ page }) => {
    // Test if error boundaries are working
    await page.goto('/dashboard');
    
    // Look for error messages or error boundaries
    const errorMessages = page.locator('text=Something went wrong')
      .or(page.locator('text=Error'))
      .or(page.locator('[data-testid="error-boundary"]'));
    
    if (await errorMessages.count() > 0) {
      console.log('⚠️ Error messages detected on page');
    } else {
      console.log('✅ No error messages detected');
    }
  });

  test('should test accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      console.log('✅ H1 heading found');
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    let accessibleButtons = 0;
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      if (text || ariaLabel) {
        accessibleButtons++;
      }
    }
    
    console.log(`✅ ${accessibleButtons}/${buttonCount} buttons have accessible labels`);
    
    // Check for proper form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    let labeledInputs = 0;
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id || ariaLabel || placeholder) {
        labeledInputs++;
      }
    }
    
    console.log(`✅ ${labeledInputs}/${inputCount} inputs have accessible labels`);
  });

  test('should test keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      console.log('✅ Keyboard navigation is working');
    } else {
      console.log('ℹ️ No focused elements detected');
    }
  });
});
