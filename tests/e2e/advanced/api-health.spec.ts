import { test, expect } from '../utils/test-base';
import path from 'path';
import fs from 'fs';

const apiRoutes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/e2e/advanced/discovered-api-routes.json'), 'utf-8'));

test.use({ storageState: '.auth/superadmin.json' });

test.describe('API Health Check (All Routes)', () => {
    apiRoutes.forEach((route: string) => {
      // Skip auth internal routes or logout
      if (route.includes('/auth/')) return;
      if (route.endsWith('/logout')) return;
      if (route.endsWith('/login')) return;
      
      test(`GET Health: ${route}`, async ({ request }) => {
        // Fast GET check
        const response = await request.get(route, { failOnStatusCode: false, timeout: 5000 });
        
        // We expect mostly 200, but 403 (unauthorized for some data) or 400 (missing body for POST expected? wait this is GET check)
        // If it's a GET, most should return 200.
        // We only care if it's 500 (crash) or 404 (broken route).
        
        expect(response.status()).not.toBe(500);
        expect(response.status()).not.toBe(404);
        
        // Detailed check for 400 (usually MISSING organizational scope)
        if (response.status() === 400) {
           const body = await response.json();
           if (body.message?.includes('organization')) {
             // console.warn(`⚠️ API ${route} returned 400: ${body.message}`);
             // If we want to strictly find items that FAIL for SUPER_ADMIN, we should probably fail here.
             // But for health check, let's keep it advisory or strict based on User objective.
             // The user said "FIX the 400 errors first". So I should keep it strict.
             expect(response.status()).not.toBe(400); 
           }
        }
      });
    });
});
