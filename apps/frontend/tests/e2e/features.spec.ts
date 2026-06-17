import { test, expect } from '@playwright/test';

test.describe('Fluxora Extended Features E2E', () => {
  
  test.describe('Executive Analytics Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
    });

    test('should load analytics page metrics, filter top posts, and handle PDF export', async ({ page }) => {
      // 1. Verify page title & subtitles
      await expect(page.locator('h2:has-text("Executive Analytics")')).toBeVisible();

      // 2. Select a channel from filter
      const filterSelect = page.locator('main select');
      await filterSelect.selectOption({ label: 'LinkedIn' });
      await expect(page.locator('td:has-text("linkedin")').first()).toBeVisible();
      
      await filterSelect.selectOption({ label: 'Twitter / X' });
      await expect(page.locator('td:has-text("twitter")').first()).toBeVisible();

      // 3. Trigger PDF export & handle the alert dialog
      let dialogTriggered = false;
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Executive Analytics PDF Report compiled and downloaded successfully!');
        dialogTriggered = true;
        await dialog.accept();
      });

      const exportBtn = page.locator('button:has-text("Export PDF Report")');
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();

      // Verify compiling state changes button text
      const compilingBtn = page.locator('button:has-text("Compiling Report...")');
      await expect(compilingBtn).toBeVisible();

      // Wait for the dialog to be triggered
      await page.waitForEvent('dialog');
      expect(dialogTriggered).toBe(true);

      // Verify it reverts to normal state
      await expect(exportBtn).toBeVisible();
    });
  });

  test.describe('UTM Generator & Link Shortener Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/link-shortener');
    });

    test('should build UTM and generate a shortened vanity link', async ({ page }) => {
      // 1. Verify page title
      await expect(page.locator('h2:has-text("Advanced UTM Builder & Link Shortening")')).toBeVisible();

      // 2. Fill the form
      await page.locator('input[type="url"]').fill('https://example.com/pricing');
      
      await page.locator('input[placeholder="linkedin"]').fill('linkedin');
      await page.locator('input[placeholder="social"]').fill('social');
      await page.locator('input[placeholder="scaling"]').fill('scaling');

      // 3. Submit the form
      await page.locator('button:has-text("Generate Short Link")').click();

      // 4. Verify new shortened link entry is added to the table
      const vanityUrl = page.locator('td.font-bold:has-text("flux.ora/")').first();
      await expect(vanityUrl).toBeVisible();
      
      const originalDest = page.locator('td:has-text("https://example.com/pricing")').first();
      await expect(originalDest).toBeVisible();

      const utmTags = page.locator('td span:has-text("linkedin / social / scaling")').first();
      await expect(utmTags).toBeVisible();
    });

    test('should handle bulk CSV link import mockup', async ({ page }) => {
      // 1. Click select CSV file
      await page.locator('button:has-text("Select CSV File")').click();

      // Verify that filename is displayed
      await expect(page.locator('span:has-text("fluxora_bulk_utm_campaign.csv")')).toBeVisible();

      // 2. Click process bulk import
      await page.locator('button:has-text("Process Bulk Import")').click();

      // Verify new entry is added to table
      const bulkVanityUrl = page.locator('td.font-bold:has-text("flux.ora/bulk-ch")').first();
      await expect(bulkVanityUrl).toBeVisible();
    });
  });

  test.describe('AI Agent Studio Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/agent');
    });

    test('should generate variations in AI Copy Assistant', async ({ page }) => {
      // 1. Verify page header
      await expect(page.locator('h2:has-text("AI Agent Studio")')).toBeVisible();

      // 2. Fill prompt input
      const textarea = page.locator('textarea[placeholder="Describe what you want to post about..."]');
      await textarea.clear();
      await textarea.fill('Writing tests for our decoupled architecture.');

      // 3. Click tone button
      await page.locator('button:has-text("Casual")').click();

      // 4. Click generate button
      await page.locator('button:has-text("Generate Social Copy")').click();

      // 5. Verify the results list variations
      const variationHeader = page.locator('span:has-text("Variation #1")').first();
      await expect(variationHeader).toBeVisible();

      const variationText = page.locator('p:has-text("Tired of slow dashboard queries?")').first();
      await expect(variationText).toBeVisible();
    });

    test('should interact with CLI & MCP Server panel', async ({ page }) => {
      // 1. Switch to sub-tab
      await page.locator('button:has-text("Agent CLI & MCP Server")').click();

      // 2. Verify settings are visible
      await expect(page.locator('h4:has-text("Agent Setup & Credentials")')).toBeVisible();
      await expect(page.locator('h4:has-text("Model Context Protocol (MCP) Servers")')).toBeVisible();

      // 3. Test LLM Credentials Handshake validation
      const validateBtn = page.locator('button:has-text("Validate LLM API Credentials")');
      await validateBtn.click();
      
      const statusText = page.locator('span:has-text("Operational Connection")');
      await expect(statusText).toBeVisible();

      // 4. Type 'help' command in CLI shell input
      const terminalInput = page.locator('input[placeholder="agent run --prompt \'Draft the engineering scaling post\'"]');
      await terminalInput.fill('help');
      await terminalInput.press('Enter');

      // Verify terminal shows help output
      const helpOutput = page.locator('div:has-text("Available commands:")').last();
      await expect(helpOutput).toBeVisible();

      // 5. Type 'mcp list' command in CLI shell input
      await terminalInput.fill('mcp list');
      await terminalInput.press('Enter');

      // Verify mcp list output
      const mcpOutput = page.locator('div:has-text("[MCP-SERVER] FileSystem Server")').last();
      await expect(mcpOutput).toBeVisible();
    });
  });
});
