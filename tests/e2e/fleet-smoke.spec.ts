import { expect, type Page, test } from '@playwright/test';

const managerUser = {
  email: 'manager@synghtorq.com',
  password: 'Manager@123',
};

const smokeRoutes = [
  '/dashboard',
  '/vehicles',
  '/vehicle/v1',
  '/playback',
  '/reports',
  '/alerts',
  '/track',
  '/analytics',
  '/services',
  '/renewals',
  '/expenses',
  '/expenses?module=fuel&type=refill',
  '/expenses?module=fuel&type=theft',
  '/more',
  '/account',
  '/team',
  '/devices',
];

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('manager@synghtorq.com').fill(managerUser.email);
  await page.getByPlaceholder('Enter your password').fill(managerUser.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(root.scrollWidth, body.scrollWidth);
    return maxWidth - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await login(page);
  await page.exposeFunction('__getConsoleErrors', () => consoleErrors);
});

test('menu routes load without broken pages, console errors, or horizontal overflow', async ({ page }) => {
  for (const route of smokeRoutes) {
    await page.goto(route);
    await expect(page.locator('body')).not.toContainText('Page not found');
    await expect(page.locator('body')).not.toContainText('Invalid email or password');
    await expectNoHorizontalOverflow(page);
  }

  const consoleErrors = await page.evaluate(async () => {
    return (await window.__getConsoleErrors()) as string[];
  });
  expect(consoleErrors).toEqual([]);
});

test('dashboard header, notifications, KPI grid, and map controls remain separate', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByText(/Good (Morning|Afternoon|Evening), Alex/)).toBeVisible();
  await expect(page.getByText('Fleet Dashboard')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /settings/i })).toHaveCount(0);

  const notificationButton = page.getByRole('button', { name: /notifications/i });
  await expect(notificationButton).toBeVisible();
  await notificationButton.click();
  await expect(page.getByText(/Alerts/i).first()).toBeVisible();
  await expect(page.getByText(/Reminder/i)).toHaveCount(0);

  const searchMap = page.getByRole('button', { name: /search vehicles on map/i });
  await searchMap.click();
  await expect(page.getByPlaceholder('Search map vehicles...')).toBeVisible();

  await page.getByRole('button', { name: /change map type/i }).click();
  await expect(page.getByText(/Satellite|Terrain|Street/i).first()).toBeVisible();

  await page.getByRole('button', { name: /maximize map/i }).click();
  await expect(page.getByRole('button', { name: /exit full screen map/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('vehicle cards and single vehicle header match required mobile layout', async ({ page }) => {
  await page.goto('/vehicles');
  await expect(page.getByPlaceholder('Search vehicles, drivers, plates...')).toBeVisible();
  await expect(page.locator('.ph-thermometer')).toHaveCount(0);
  await expect(page.locator('.ph-camera')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto('/vehicle/v1');
  await expect(page.getByText('TK-101').first()).toBeVisible();
  await expect(page.getByText(/Moving|Stopped|Idle|Offline|Maintenance/).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('fuel events are limited to sensor-enabled vehicles and investigation workflows open', async ({ page }) => {
  await page.goto('/expenses?module=fuel&type=refill');
  await expect(page.getByText('Fuel Management')).toBeVisible();
  await expect(page.locator('select').first()).not.toContainText('TK-106');
  await expect(page.getByText('TK-106')).toHaveCount(0);

  await page.getByText('Fuel Refill').click();
  await page.getByRole('button').filter({ hasText: /\+\d+(\.\d)?L/ }).first().click();
  await expect(page.getByText('Refill investigation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm Refill' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Events' }).click();

  await page.getByText('Fuel Theft').click();
  await page.getByRole('button').filter({ hasText: /-\d+(\.\d)?L/ }).first().click();
  await expect(page.getByText('Theft investigation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resolve Theft Event' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('vehicle-scoped fuel view hides the selector and shows only the selected vehicle events', async ({ page }) => {
  await page.goto('/expenses?module=fuel&type=refill&vehicle=v1');
  await expect(page.getByText('Fuel Management')).toBeVisible();
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.getByText('TK-101')).toBeVisible();
  await expect(page.getByText('ISABELA 04')).toHaveCount(0);

  await page.getByRole('button', { name: 'Fuel Theft' }).click();
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.getByText('TK-101')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('alerts create, toggle, edit, and delete workflow works', async ({ page }) => {
  await page.goto('/alerts');
  await expect(page.getByText('Alerts')).toBeVisible();

  await page.getByPlaceholder('Alert name').fill('QA Route Alert');
  await page.getByPlaceholder('Alert description').fill('Created by automated smoke test');
  await page.getByPlaceholder('Vehicle scope').fill('TK-101');
  await page.getByRole('button', { name: 'Create Alert Rule' }).click();
  await expect(page.getByText('QA Route Alert')).toBeVisible();

  const rule = page.locator('div').filter({ hasText: 'QA Route Alert' }).last();
  await rule.getByRole('button', { name: /deactivate/i }).click();
  await expect(rule.getByText('Paused')).toBeVisible();
  await rule.getByRole('button', { name: 'Edit' }).click();
  await page.getByPlaceholder('Alert name').fill('QA Updated Alert');
  await page.getByRole('button', { name: 'Save Alert Rule' }).click();
  await expect(page.getByText('QA Updated Alert')).toBeVisible();
  await page.locator('div').filter({ hasText: 'QA Updated Alert' }).last().getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('QA Updated Alert')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

declare global {
  interface Window {
    __getConsoleErrors: () => Promise<string[]>;
  }
}
