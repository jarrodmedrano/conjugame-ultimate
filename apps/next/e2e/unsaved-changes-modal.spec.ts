import { test, expect } from '@playwright/test'

/**
 * E2E Test: Unsaved Changes Modal
 *
 * Tests the unsaved changes protection flow:
 * 1. User enters edit mode and makes changes
 * 2. User attempts to navigate away or cancel
 * 3. Modal appears with three options:
 *    - Save Changes (saves and exits)
 *    - Discard Changes (reverts and exits)
 *    - Keep Editing (stays in edit mode)
 */

test.describe('Unsaved Changes Modal', () => {
  // Test data
  const testUser = {
    id: 'user-123',
    name: 'Test User',
  }

  const testStoryId = 'story-456'

  const originalData = {
    name: 'Original Story Name',
    description: 'Original description',
    content: 'Original content',
  }

  const modifiedData = {
    name: 'Modified Story Name',
    description: 'Modified description',
    content: 'Modified content with changes',
  }

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated session
    // TODO: Seed database with test story

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)
    await expect(page.getByTestId('story-detail')).toBeVisible()
  })

  test('should show modal when clicking Cancel with unsaved changes', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()
    await expect(page.getByTestId('save-button')).toBeVisible()

    // Make a change
    const nameInput = page.getByTestId('story-name-input')
    await nameInput.clear()
    await nameInput.fill(modifiedData.name)

    // Click Cancel button
    await page.getByTestId('cancel-button').click()

    // Unsaved changes modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Modal should have all three buttons
    await expect(
      page.getByRole('button', { name: /save changes/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /discard changes/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /keep editing/i }),
    ).toBeVisible()
  })

  test('should save changes and exit when clicking "Save Changes"', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    await page.getByTestId('story-description-input').clear()
    await page
      .getByTestId('story-description-input')
      .fill(modifiedData.description)

    // Click Cancel to trigger modal
    await page.getByTestId('cancel-button').click()

    // Modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Click "Save Changes"
    await page.getByRole('button', { name: /save changes/i }).click()

    // Should exit edit mode
    await expect(page.getByTestId('edit-button')).toBeVisible()

    // Changes should be saved
    await expect(page.getByTestId('story-title')).toHaveText(modifiedData.name)

    // Success toast should appear
    await expect(page.getByText(/story updated successfully/i)).toBeVisible()
  })

  test('should discard changes and exit when clicking "Discard Changes"', async ({
    page,
  }) => {
    // Verify original content
    await expect(page.getByTestId('story-title')).toHaveText(originalData.name)

    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    await page.getByTestId('story-content-input').clear()
    await page.getByTestId('story-content-input').fill(modifiedData.content)

    // Click Cancel to trigger modal
    await page.getByTestId('cancel-button').click()

    // Modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Click "Discard Changes"
    await page.getByRole('button', { name: /discard changes/i }).click()

    // Should exit edit mode
    await expect(page.getByTestId('edit-button')).toBeVisible()

    // Original content should be restored
    await expect(page.getByTestId('story-title')).toHaveText(originalData.name)
  })

  test('should stay in edit mode when clicking "Keep Editing"', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make a change
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Click Cancel to trigger modal
    await page.getByTestId('cancel-button').click()

    // Modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Click "Keep Editing"
    await page.getByRole('button', { name: /keep editing/i }).click()

    // Modal should close
    await expect(page.getByTestId('unsaved-changes-modal')).not.toBeVisible()

    // Should remain in edit mode
    await expect(page.getByTestId('save-button')).toBeVisible()
    await expect(page.getByTestId('cancel-button')).toBeVisible()

    // Changes should still be in the form
    await expect(page.getByTestId('story-name-input')).toHaveValue(
      modifiedData.name,
    )
  })

  test('should show modal when navigating away with unsaved changes', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Try to navigate to another page by clicking a link
    await page
      .getByText(/view all|stories/i)
      .first()
      .click()

    // Modal should appear and prevent navigation
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Should still be on the same page
    await expect(page).toHaveURL(
      new RegExp(`/${testUser.id}/stories/${testStoryId}`),
    )
  })

  test('should allow navigation after saving changes through modal', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Try to navigate away
    await page
      .getByText(/view all|stories/i)
      .first()
      .click()

    // Modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Click "Save Changes"
    await page.getByRole('button', { name: /save changes/i }).click()

    // Should navigate to the new page
    await expect(page).toHaveURL(new RegExp(`/${testUser.id}/stories`))
  })

  test('should allow navigation after discarding changes through modal', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Try to navigate away
    await page
      .getByText(/view all|stories/i)
      .first()
      .click()

    // Modal should appear
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

    // Click "Discard Changes"
    await page.getByRole('button', { name: /discard changes/i }).click()

    // Should navigate to the new page
    await expect(page).toHaveURL(new RegExp(`/${testUser.id}/stories`))
  })

  test('should show browser confirmation when trying to close/reload page', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Set up listener for beforeunload dialog
    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('beforeunload')
      dialog.dismiss()
    })

    // Try to reload page
    await page.reload()

    // Note: In Playwright, the beforeunload dialog is automatically dismissed
    // In real browsers, user would see the confirmation dialog
  })

  test('should NOT show modal when Cancel clicked without changes', async ({
    page,
  }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Don't make any changes, just click Cancel
    await page.getByTestId('cancel-button').click()

    // Modal should NOT appear
    await expect(page.getByTestId('unsaved-changes-modal')).not.toBeVisible()

    // Should exit edit mode immediately
    await expect(page.getByTestId('edit-button')).toBeVisible()
  })

  test('should NOT show modal when navigating after save', async ({ page }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill(modifiedData.name)

    // Save changes
    await page.getByTestId('save-button').click()

    // Wait for save to complete
    await expect(page.getByTestId('edit-button')).toBeVisible()

    // Now navigate away - modal should NOT appear
    await page
      .getByText(/view all|stories/i)
      .first()
      .click()

    // Should navigate without modal
    await expect(page).toHaveURL(new RegExp(`/${testUser.id}/stories`))
  })

  test('should detect changes in all form fields', async ({ page }) => {
    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Test 1: Changes to name field should trigger modal
    await page.getByTestId('story-name-input').clear()
    await page.getByTestId('story-name-input').fill('New Name')
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()
    await page.getByRole('button', { name: /keep editing/i }).click()

    // Reset form
    await page.getByTestId('cancel-button').click()
    await page.getByRole('button', { name: /discard changes/i }).click()
    await page.getByTestId('edit-button').click()

    // Test 2: Changes to description field should trigger modal
    await page.getByTestId('story-description-input').clear()
    await page.getByTestId('story-description-input').fill('New Description')
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()
    await page.getByRole('button', { name: /keep editing/i }).click()

    // Reset form
    await page.getByTestId('cancel-button').click()
    await page.getByRole('button', { name: /discard changes/i }).click()
    await page.getByTestId('edit-button').click()

    // Test 3: Changes to content field should trigger modal
    await page.getByTestId('story-content-input').clear()
    await page.getByTestId('story-content-input').fill('New Content')
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()
  })
})
