import { test, expect } from '@playwright/test'

/**
 * E2E Test: Create and Edit Story
 *
 * Tests the complete user journey of:
 * 1. Creating a new story
 * 2. Navigating to the story detail page
 * 3. Entering edit mode
 * 4. Making changes to the story
 * 5. Saving changes and verifying persistence
 */

test.describe('Create and Edit Story', () => {
  // Test data
  const testUser = {
    id: 'user-123',
    name: 'Test User',
  }

  const initialStory = {
    name: 'My First Story',
    description: 'A story about testing',
    content: 'This is the initial content of the story.',
  }

  const updatedStory = {
    name: 'My Updated Story',
    description: 'An updated story about testing',
    content: 'This is the updated content with more details.',
  }

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated session
    // This will require test data setup with authentication
  })

  test('should allow creating a new story', async ({ page }) => {
    // Navigate to create stories page
    await page.goto('/create/stories')

    // Fill in story details
    await page.getByTestId('story-name-input').fill(initialStory.name)
    await page
      .getByTestId('story-description-input')
      .fill(initialStory.description)
    await page.getByTestId('story-content-input').fill(initialStory.content)

    // Submit the form
    await page.getByRole('button', { name: /create|save/i }).click()

    // Should navigate to the user detail page or stories list
    // Exact navigation depends on implementation
    await expect(page).toHaveURL(new RegExp(`/(${testUser.id}|create)`))

    // Success message should appear
    await expect(page.getByText(/story created|success/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('should allow editing an existing story', async ({ page }) => {
    // TODO: Seed test database with a story
    const testStoryId = 'story-456'

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)

    // Verify we're on the story page
    await expect(page.getByTestId('story-detail')).toBeVisible()

    // Initial content should be visible
    await expect(page.getByTestId('story-title')).toContainText('Test Story')

    // Click Edit button
    await page.getByTestId('edit-button').click()

    // Should enter edit mode
    await expect(page.getByTestId('save-button')).toBeVisible()
    await expect(page.getByTestId('cancel-button')).toBeVisible()
    await expect(page.getByTestId('edit-button')).not.toBeVisible()

    // Form fields should be editable
    const nameInput = page.getByTestId('story-name-input')
    const descriptionInput = page.getByTestId('story-description-input')
    const contentInput = page.getByTestId('story-content-input')

    await expect(nameInput).toBeEditable()
    await expect(descriptionInput).toBeEditable()
    await expect(contentInput).toBeEditable()

    // Update story fields
    await nameInput.clear()
    await nameInput.fill(updatedStory.name)

    await descriptionInput.clear()
    await descriptionInput.fill(updatedStory.description)

    await contentInput.clear()
    await contentInput.fill(updatedStory.content)

    // Save changes
    await page.getByTestId('save-button').click()

    // Should exit edit mode
    await expect(page.getByTestId('edit-button')).toBeVisible()
    await expect(page.getByTestId('save-button')).not.toBeVisible()

    // Updated content should be visible
    await expect(page.getByTestId('story-title')).toHaveText(updatedStory.name)
    await expect(page.getByTestId('story-description')).toContainText(
      updatedStory.description,
    )
    await expect(page.getByTestId('story-content')).toContainText(
      updatedStory.content,
    )

    // Success toast should appear
    await expect(page.getByText(/story updated successfully/i)).toBeVisible()
  })

  test('should persist changes after page reload', async ({ page }) => {
    // TODO: Seed test database with a story
    const testStoryId = 'story-789'

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)

    // Enter edit mode and make changes
    await page.getByTestId('edit-button').click()

    const nameInput = page.getByTestId('story-name-input')
    const newName = 'Persistent Story Changes'
    await nameInput.clear()
    await nameInput.fill(newName)

    // Save changes
    await page.getByTestId('save-button').click()

    // Wait for save to complete
    await expect(page.getByTestId('edit-button')).toBeVisible()

    // Reload the page
    await page.reload()

    // Changes should still be visible
    await expect(page.getByTestId('story-title')).toHaveText(newName)
  })

  test('should handle canceling edit mode', async ({ page }) => {
    // TODO: Seed test database with a story
    const testStoryId = 'story-101'
    const originalName = 'Original Story Name'

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)

    // Verify original content
    await expect(page.getByTestId('story-title')).toHaveText(originalName)

    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make changes
    const nameInput = page.getByTestId('story-name-input')
    await nameInput.clear()
    await nameInput.fill('This should not be saved')

    // Click Cancel
    await page.getByTestId('cancel-button').click()

    // If no changes were made (isDirty === false), should exit immediately
    // If changes were made (isDirty === true), unsaved changes modal should appear
    // For now, we'll test the immediate exit case
    // The unsaved changes modal is tested in Task 26

    // Should exit edit mode
    await expect(page.getByTestId('edit-button')).toBeVisible()

    // Original content should still be visible (changes were discarded)
    await expect(page.getByTestId('story-title')).toHaveText(originalName)
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    // Navigate to create stories page
    await page.goto('/create/stories')

    // Try to submit empty form
    await page.getByRole('button', { name: /create|save/i }).click()

    // Validation errors should appear
    await expect(
      page.getByText(/name is required|story name cannot be empty|required/i),
    ).toBeVisible()

    // Should remain on create page
    await expect(page).toHaveURL(/\/create\/stories/)
  })

  test('should allow keyboard shortcuts in edit mode', async ({ page }) => {
    // TODO: Seed test database with a story
    const testStoryId = 'story-202'

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)

    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make a change
    const nameInput = page.getByTestId('story-name-input')
    await nameInput.clear()
    await nameInput.fill('Keyboard Shortcut Test')

    // Press Ctrl+Enter (or Cmd+Enter on Mac) to save
    await page.keyboard.press(
      process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter',
    )

    // Should save and exit edit mode
    await expect(page.getByTestId('edit-button')).toBeVisible()
    await expect(page.getByTestId('story-title')).toHaveText(
      'Keyboard Shortcut Test',
    )
  })

  test('should show loading state while saving', async ({ page }) => {
    // TODO: Seed test database with a story
    const testStoryId = 'story-303'

    // Navigate to story detail page
    await page.goto(`/${testUser.id}/stories/${testStoryId}`)

    // Enter edit mode
    await page.getByTestId('edit-button').click()

    // Make a change
    const nameInput = page.getByTestId('story-name-input')
    await nameInput.clear()
    await nameInput.fill('Loading State Test')

    // Click save
    await page.getByTestId('save-button').click()

    // Save button should show loading state
    // (This depends on implementation - might be disabled or show spinner)
    const saveButton = page.getByTestId('save-button')
    await expect(saveButton).toHaveAttribute('disabled', '')

    // Wait for save to complete
    await expect(page.getByTestId('edit-button')).toBeVisible()
  })
})
