import { expect, test } from '@playwright/test';

const FRONTEND_ROOT = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function waitForChip(page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 20000 });
}

test.describe('Conversation controls smoke', () => {
  test('start → pause → resume → stop flow', async ({ page }) => {
    await page.goto(FRONTEND_ROOT);

    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');

    await page.getByRole('button', { name: 'Start Conversation' }).click();

    await waitForChip(page, '🟢 Stream Connected');
    await waitForChip(page, '▶️ Active');

    await page.getByRole('button', { name: '⏸️ Pause' }).click();
    await waitForChip(page, '⏸️ Paused');

    await page.getByRole('button', { name: '▶️ Resume' }).click();
    await waitForChip(page, '▶️ Active');

    await page.getByRole('button', { name: '⏹️ Stop' }).click();

    await waitForChip(page, '🔴 Disconnected');
    await waitForChip(page, 'Idle');
  });
});
