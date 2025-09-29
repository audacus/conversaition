import { expect, test } from '@playwright/test';

const FRONTEND_ROOT = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const PARTICIPANTS_URL = `${FRONTEND_ROOT}/participants`;

test.describe('Participants CRUD', () => {
  test('create → edit → delete participant flow', async ({ page }) => {
    // Navigate to participants page
    await page.goto(PARTICIPANTS_URL);
    await expect(page.getByRole('heading', { name: 'Participants' })).toBeVisible();

    // Click "Create Participant" button
    await page.getByRole('button', { name: '+ Create Participant' }).click();

    // Verify modal opened
    await expect(page.getByRole('heading', { name: 'Create Participant' })).toBeVisible();

    // Fill in the form with unique ID and name
    const timestamp = Date.now();
    const testId = `TestParticipant_${timestamp}`;
    const testName = `Test Participant ${timestamp}`;
    await page.getByLabel('ID *').fill(testId);
    await page.getByLabel('Name *').fill(testName);
    await page.getByLabel('Provider *').selectOption('openai');
    await page.getByLabel('Model *').fill('gpt-4o-mini');
    await page.getByLabel('Temperature (0.0 - 2.0)').fill('0.5');
    await page.getByLabel('Max Tokens').fill('300');
    await page.getByLabel('System Prompt *').fill('You are a test participant for automated testing.');

    // Submit the form and wait for both POST and GET requests
    const [postResponse, getResponse] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/participants') && response.request().method() === 'POST'),
      page.waitForResponse(response => response.url().includes('/participants') && response.request().method() === 'GET'),
      page.getByRole('button', { name: 'Create', exact: true }).click()
    ]);

    // Verify responses are successful
    expect(postResponse.status()).toBe(200);
    expect(getResponse.status()).toBe(200);

    // Verify modal closed
    await expect(page.getByRole('heading', { name: 'Create Participant' })).not.toBeVisible({ timeout: 5000 });

    // Find the participant row using the unique name
    const participantRow = page.locator('tbody tr').filter({ hasText: testName });
    await expect(participantRow).toBeVisible({ timeout: 5000 });

    // Click Edit button for the new participant
    await participantRow.getByRole('button', { name: 'Edit' }).click();

    // Verify edit modal opened
    await expect(page.getByRole('heading', { name: 'Edit Participant' })).toBeVisible();

    // Modify the participant
    const editedName = `${testName} (Edited)`;
    await page.getByLabel('Name *').fill(editedName);
    await page.getByLabel('Temperature (0.0 - 2.0)').fill('0.8');

    // Submit the edit
    await page.getByRole('button', { name: 'Update' }).click();

    // Verify modal closed and changes reflected
    await expect(page.getByRole('heading', { name: 'Edit Participant' })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(editedName)).toBeVisible();

    // Find and click Delete button for the participant (need to re-locate row after name change)
    const updatedRow = page.locator('tbody tr').filter({ hasText: editedName });
    await updatedRow.getByRole('button', { name: 'Delete' }).click();

    // Verify delete confirmation modal
    await expect(page.getByRole('heading', { name: 'Delete Participant' })).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete')).toBeVisible();

    // Confirm deletion in the modal
    await page.locator('.fixed').getByRole('button', { name: /^Delete$/ }).click();

    // Verify modal closed and participant removed from table
    await expect(page.getByRole('heading', { name: 'Delete Participant' })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(editedName)).not.toBeVisible({ timeout: 5000 });
  });

  test('participant changes reflect in main conversation page', async ({ page }) => {
    // Navigate to participants page
    await page.goto(PARTICIPANTS_URL);

    // Create a new test participant with unique name
    await page.getByRole('button', { name: '+ Create Participant' }).click();
    const timestamp = Date.now();
    const testId = `UITestParticipant_${timestamp}`;
    const testName = `UI Test Participant ${timestamp}`;
    await page.getByLabel('ID *').fill(testId);
    await page.getByLabel('Name *').fill(testName);
    await page.getByLabel('Provider *').selectOption('openai');
    await page.getByLabel('Model *').fill('gpt-4o-mini');
    await page.getByLabel('System Prompt *').fill('Test participant for UI integration.');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Create Participant' })).not.toBeVisible({ timeout: 5000 });

    // Navigate back to main conversation page
    await page.getByRole('link', { name: '← Back to Conversations' }).click();
    await page.waitForURL(`${FRONTEND_ROOT}/`, { timeout: 5000 });

    // Verify the new participant appears in the participant selection
    await expect(page.getByText(testName)).toBeVisible();

    // Clean up: delete the test participant
    await page.getByRole('link', { name: 'Manage Participants' }).click();
    const participantRow = page.locator('tbody tr').filter({ hasText: testName });
    await participantRow.getByRole('button', { name: 'Delete' }).click();
    await page.locator('.fixed').getByRole('button', { name: /^Delete$/ }).click();
    // Wait for modal to close and participant to be removed from table
    await expect(page.getByRole('heading', { name: 'Delete Participant' })).not.toBeVisible({ timeout: 5000 });
    await expect(participantRow).not.toBeVisible({ timeout: 5000 });
  });

  test('validation errors are displayed', async ({ page }) => {
    // Navigate to participants page
    await page.goto(PARTICIPANTS_URL);

    // Open create modal
    await page.getByRole('button', { name: '+ Create Participant' }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // HTML5 validation should prevent submission, but let's fill partial data
    await page.getByLabel('ID *').fill('InvalidTest');
    await page.getByLabel('Name *').fill('Invalid Test');
    await page.getByLabel('Provider *').selectOption('openai');
    // Leave Model and System Prompt empty

    // Try to submit
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Modal should still be visible due to HTML5 validation
    await expect(page.getByRole('heading', { name: 'Create Participant' })).toBeVisible();

    // Cancel the modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create Participant' })).not.toBeVisible({ timeout: 2000 });
  });
});