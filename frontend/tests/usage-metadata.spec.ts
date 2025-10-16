import { expect, test } from '@playwright/test';

const FRONTEND_ROOT = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function waitForChip(page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 20000 });
}

test.describe('Usage metadata display', () => {
  test('displays token usage statistics after AI response', async ({ page }) => {
    await page.goto(FRONTEND_ROOT);

    // Wait for page to load
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');

    // Start conversation
    await page.getByRole('button', { name: 'Start Conversation' }).click();

    // Wait for conversation to start
    await waitForChip(page, '🟢 Stream Connected');
    await waitForChip(page, '▶️ Active');

    // Wait for first AI message to complete (look for usage stats)
    // Usage stats appear as: "↓ N in", "↑ N out", etc.
    await expect(page.locator('text=/↓ \\d+ in/')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=/↑ \\d+ out/')).toBeVisible({ timeout: 5000 });

    // Verify that usage stats are present for at least one message
    const usageStats = page.locator('div.flex.flex-wrap.gap-2.text-xs.text-gray-400');
    await expect(usageStats.first()).toBeVisible();

    // Check for input tokens display (more specific selector)
    const inputTokens = usageStats.first().locator('span:has-text("↓")');
    await expect(inputTokens).toBeVisible();
    await expect(inputTokens).toContainText('in');

    // Check for output tokens display (more specific selector)
    const outputTokens = usageStats.first().locator('span:has-text("↑")');
    await expect(outputTokens).toBeVisible();
    await expect(outputTokens).toContainText('out');

    // Stop conversation
    await page.getByRole('button', { name: '⏹️ Stop' }).click();
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');
  });

  test('displays cache and reasoning tokens when available', async ({ page }) => {
    await page.goto(FRONTEND_ROOT);

    // Wait for page to load
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');

    // Start conversation
    await page.getByRole('button', { name: 'Start Conversation' }).click();

    // Wait for conversation to start
    await waitForChip(page, '🟢 Stream Connected');
    await waitForChip(page, '▶️ Active');

    // Wait for at least one message with usage stats
    await expect(page.locator('text=/↓ \\d+ in/')).toBeVisible({ timeout: 30000 });

    // Check if cache or reasoning tokens are displayed (may not always be present)
    // This is a soft check - we verify the elements exist if they're present
    const cacheStats = page.locator('span:has-text("cache")');
    const cachedStats = page.locator('span:has-text("cached")');
    const reasoningStats = page.locator('span:has-text("reasoning")');

    // If any of these exist, verify they have the right icons
    const cacheCount = await cacheStats.count();
    if (cacheCount > 0) {
      await expect(cacheStats.first()).toContainText('⚡');
    }

    const cachedCount = await cachedStats.count();
    if (cachedCount > 0) {
      await expect(cachedStats.first()).toContainText('💾');
    }

    const reasoningCount = await reasoningStats.count();
    if (reasoningCount > 0) {
      await expect(reasoningStats.first()).toContainText('🧠');
    }

    // Stop conversation
    await page.getByRole('button', { name: '⏹️ Stop' }).click();
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');
  });
});
