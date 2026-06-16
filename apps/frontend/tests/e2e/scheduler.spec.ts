import { test, expect } from '@playwright/test';

test.describe('Fluxora Omnichannel Scheduler E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to studio composer dashboard
    await page.goto('/studio');
  });

  test('should schedule an omnichannel post successfully', async ({ page }) => {
    // 1. Verify Composer header is loaded
    await expect(page.locator('h2:has-text("Unified Omnichannel Composer")')).toBeVisible();

    // 2. Select the core textarea and input custom message
    const textarea = page.locator('textarea[placeholder="Write your core social media message here..."]');
    await textarea.clear();
    await textarea.fill('Testing Playwright E2E Scheduler Flow on Fluxora! 🚀');

    // 3. Set scheduling datetime
    const dateInput = page.locator('input[type="datetime-local"]');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // 3 days in the future
    const isoString = futureDate.toISOString().slice(0, 16);
    await dateInput.fill(isoString);

    // 4. Click target platform preview buttons
    await page.click('button:has-text("Twitter / X View")');
    await expect(page.locator('p:has-text("Testing Playwright E2E Scheduler Flow")')).toBeVisible();

    // 5. Submit schedule form
    await page.click('button[type="submit"]');

    // 6. Verify successful workflow invocation message is displayed
    const successMsg = page.locator('div:has-text("Temporal workflow PostPublishingWorkflow successfully triggered!")').last();
    await expect(successMsg).toBeVisible();
  });
});
