import { expect, test } from '@playwright/test';

const FRONTEND_ROOT = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function waitForChip(page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 20000 });
}

test.describe('Human participant', () => {
  test('pause → inject human message → resume flow', async ({ page }) => {
    await page.goto(FRONTEND_ROOT);

    // Wait for page to load
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');

    // Start conversation
    await page.getByRole('button', { name: 'Start Conversation' }).click();

    // Wait for conversation to start
    await waitForChip(page, '🟢 Stream Connected');
    await waitForChip(page, '▶️ Active');

    // Wait for at least one AI message
    await page.waitForTimeout(3000);

    // Pause the conversation
    await page.getByRole('button', { name: '⏸️ Pause' }).click();
    await waitForChip(page, '⏸️ Paused');

    // Inject human message
    const humanMessageInput = page.getByPlaceholder(/inject a human message/i);
    await expect(humanMessageInput).toBeEnabled();
    await humanMessageInput.fill('What are the legal precedents for this?');

    // Send human message
    const sendButton = page.getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Verify human message appears in conversation
    await expect(page.getByText('What are the legal precedents for this?')).toBeVisible({ timeout: 5000 });

    // Resume conversation
    await page.getByRole('button', { name: '▶️ Resume' }).click();
    await waitForChip(page, '▶️ Active');

    // Wait for AI response to human message
    await page.waitForTimeout(3000);

    // Stop conversation
    await page.getByRole('button', { name: '⏹️ Stop' }).click();
    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');
  });

  test('human participant checkbox is visible and checked by default', async ({ page }) => {
    await page.goto(FRONTEND_ROOT);

    // Wait for participants to load
    await page.waitForTimeout(1000);

    // Verify Human checkbox exists and is checked
    const humanCheckbox = page.getByRole('checkbox', { name: 'Human' });
    await expect(humanCheckbox).toBeVisible();
    await expect(humanCheckbox).toBeChecked();

    // Verify Human label is visible
    await expect(page.getByText('Human', { exact: true })).toBeVisible();
  });
});
