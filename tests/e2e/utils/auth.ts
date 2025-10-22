import { APIRequestContext, Page } from '@playwright/test';
import usersFixture from '../fixtures/users.json';

export type UserRole = 'superAdmin' | 'tenantAdmin' | 'staffSales' | 'staffInventory' | 'customer';

export async function loginViaUI(page: Page, role: UserRole) {
  const user = usersFixture[role];
  
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or portal
  await page.waitForURL(/\/(dashboard|customer-portal)/);
}

export async function loginViaAPI(request: APIRequestContext, role: UserRole) {
  const user = usersFixture[role];
  
  const response = await request.post('/api/auth/signin', {
    data: {
      email: user.email,
      password: user.password,
    },
  });
  
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }
  
  return response;
}

export async function getAuthToken(request: APIRequestContext, role: UserRole): Promise<string> {
  const response = await loginViaAPI(request, role);
  const data = await response.json();
  return data.token || '';
}

export async function logout(page: Page) {
  await page.goto('/api/auth/signout');
  await page.waitForURL('/');
}

