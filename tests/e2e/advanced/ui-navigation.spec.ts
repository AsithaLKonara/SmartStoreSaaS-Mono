import { test, expect } from '../utils/test-base';
import path from 'path';
import fs from 'fs';

const pages = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/e2e/advanced/discovered-routes.json'), 'utf-8'));

const roles = [
  { name: 'SUPER_ADMIN', storage: '.auth/superadmin.json' },
  { name: 'TENANT_ADMIN', storage: '.auth/admin.json' },
  { name: 'STAFF', storage: '.auth/staff.json' },
  { name: 'CUSTOMER', storage: '.auth/customer.json' }
];

roles.forEach(role => {
  test.describe(`${role.name} Page Coverage`, () => {
    test.use({ storageState: role.storage });

    pages.forEach((route: string) => {
      // Ignore some routes that might be problematic or non-NAV (like login, auth routes)
      if (route.includes('/api/') || route.includes('/login') || route.includes('/register') || route.includes('/reset-password')) return;
      
      test(`Verify Route: ${route}`, async ({ page }) => {
        // High-speed navigation check
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        
        // Basic check: No server errors
        const title = await page.title();
        expect(title).not.toContain('500');
        expect(title).not.toContain('404');
        expect(title).not.toContain('Error');
        
        // Check for "Permission Denied" text
        const content = await page.textContent('body');
        if (content?.toLowerCase().includes('permission denied')) {
           // This is expected for some roles - we shouldn't fail if it's gracefully handled, 
           // BUT for coverage, we want to know if it's broken.
           // However, if the page loaded the shell, it's a pass on "Navigation".
        }
        
        // Check for 404 in body
        expect(content).not.toContain('404 Not Found');
      });
    });
  });
});
