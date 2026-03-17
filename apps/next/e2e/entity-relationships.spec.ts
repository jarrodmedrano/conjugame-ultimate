import { test, expect } from '@playwright/test'

/**
 * E2E Test: Entity Relationship Management
 *
 * Tests the relationship management functionality:
 * 1. Viewing related entities grid
 * 2. Toggling related entities visibility
 * 3. Adding existing entities to a story
 * 4. Creating and linking new entities
 * 5. Unlinking entities from a story
 * 6. Navigating to related entity detail pages
 */

test.describe('Entity Relationship Management', () => {
  // Test data
  const owner = {
    id: 'user-123',
    name: 'Story Owner',
  }

  const story = {
    id: 'story-789',
    name: 'Main Story',
    description: 'A story with relationships',
  }

  const existingCharacter = {
    id: 'character-456',
    name: 'Existing Character',
    description: 'Character description',
  }

  const existingLocation = {
    id: 'location-789',
    name: 'Existing Location',
    description: 'Location description',
  }

  const existingTimeline = {
    id: 'timeline-101',
    name: 'Existing Timeline',
    description: 'Timeline description',
  }

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated session as owner
    // TODO: Seed database with story, characters, locations, timelines
    // TODO: Some entities linked, some not linked to the story

    // Navigate to story detail page
    await page.goto(`/${owner.id}/stories/${story.id}`)
    await expect(page.getByTestId('story-detail')).toBeVisible()
  })

  test.describe('Related Entities Grid', () => {
    test('should hide related entities grid by default', async ({ page }) => {
      // Grid should be hidden initially
      await expect(page.getByTestId('related-entities-grid')).not.toBeVisible()

      // Toggle button should show "Show Related Entities"
      const toggleButton = page.getByText(/show related entities/i)
      await expect(toggleButton).toBeVisible()
    })

    test('should toggle related entities visibility', async ({ page }) => {
      // Click toggle button to show
      await page.getByText(/show related entities/i).click()

      // Grid should be visible
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()

      // Toggle button should now show "Hide Related Entities"
      await expect(page.getByText(/hide related entities/i)).toBeVisible()

      // Click again to hide
      await page.getByText(/hide related entities/i).click()

      // Grid should be hidden
      await expect(page.getByTestId('related-entities-grid')).not.toBeVisible()
    })

    test('should persist toggle state in localStorage', async ({ page }) => {
      // Show related entities
      await page.getByText(/show related entities/i).click()
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()

      // Reload page
      await page.reload()
      await expect(page.getByTestId('story-detail')).toBeVisible()

      // Grid should still be visible (state persisted)
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()
    })

    test('should display all entity type panels', async ({ page }) => {
      // Show related entities grid
      await page.getByText(/show related entities/i).click()
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()

      // Should have panels for Characters, Locations, Timelines
      await expect(page.getByTestId('characters-panel')).toBeVisible()
      await expect(page.getByTestId('locations-panel')).toBeVisible()
      await expect(page.getByTestId('timelines-panel')).toBeVisible()
    })

    test('should hide related entities grid in edit mode', async ({ page }) => {
      // Show related entities grid
      await page.getByText(/show related entities/i).click()
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()

      // Enter edit mode
      await page.getByTestId('edit-button').click()

      // Grid should be hidden in edit mode
      await expect(page.getByTestId('related-entities-grid')).not.toBeVisible()

      // Toggle button should also be hidden
      await expect(page.getByText(/show related entities/i)).not.toBeVisible()
    })
  })

  test.describe('Add Existing Entities', () => {
    test('should open Add Existing modal for characters', async ({ page }) => {
      // Show related entities
      await page.getByText(/show related entities/i).click()

      // Click "Add Existing" in Characters panel
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Modal should open
      await expect(page.getByTestId('add-existing-modal')).toBeVisible()

      // Modal title should indicate entity type
      await expect(page.getByText(/add existing character/i)).toBeVisible()
    })

    test('should display searchable list of available entities', async ({
      page,
    }) => {
      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Search input should be visible
      await expect(page.getByPlaceholder(/search/i)).toBeVisible()

      // Available entities should be listed
      // (Assuming test data has unlinked characters)
      await expect(page.getByTestId('entity-list')).toBeVisible()
    })

    test('should filter entities by search query', async ({ page }) => {
      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Type in search
      const searchInput = page.getByPlaceholder(/search/i)
      await searchInput.fill('Hero')

      // Only matching entities should be visible
      // (This depends on seeded test data)
      await expect(page.getByText(/hero/i)).toBeVisible()
    })

    test('should disable already linked entities', async ({ page }) => {
      // TODO: Seed story with one character already linked

      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Already linked entity should be disabled/grayed out
      // (Implementation depends on actual component structure)
    })

    test('should allow multi-select of entities', async ({ page }) => {
      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Select multiple entities
      const firstEntity = page.getByTestId('entity-checkbox-1')
      const secondEntity = page.getByTestId('entity-checkbox-2')

      await firstEntity.check()
      await secondEntity.check()

      // Both should be checked
      await expect(firstEntity).toBeChecked()
      await expect(secondEntity).toBeChecked()
    })

    test('should link selected entities to story', async ({ page }) => {
      await page.getByText(/show related entities/i).click()

      // Get initial count of linked characters
      const initialCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()

      // Open modal
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Select entities
      await page.getByTestId('entity-checkbox-1').check()

      // Click "Add Selected"
      await page.getByRole('button', { name: /add selected|add/i }).click()

      // Success toast should appear
      await expect(page.getByText(/linked successfully|added/i)).toBeVisible()

      // Modal should close
      await expect(page.getByTestId('add-existing-modal')).not.toBeVisible()

      // Character should appear in the panel
      const newCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()
      expect(newCount).toBe(initialCount + 1)
    })

    test('should close modal without changes when clicking Cancel', async ({
      page,
    }) => {
      await page.getByText(/show related entities/i).click()

      // Get initial count
      const initialCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()

      // Open modal
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /add existing/i })
        .click()

      // Select an entity
      await page.getByTestId('entity-checkbox-1').check()

      // Click Cancel
      await page.getByRole('button', { name: /cancel/i }).click()

      // Modal should close
      await expect(page.getByTestId('add-existing-modal')).not.toBeVisible()

      // Count should remain unchanged
      const newCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()
      expect(newCount).toBe(initialCount)
    })
  })

  test.describe('Create and Link New Entities', () => {
    test('should open Create New modal for characters', async ({ page }) => {
      await page.getByText(/show related entities/i).click()

      // Click "Create New" in Characters panel
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /create new/i })
        .click()

      // Modal should open
      await expect(page.getByTestId('create-new-modal')).toBeVisible()

      // Modal title should indicate entity type
      await expect(page.getByText(/create new character/i)).toBeVisible()
    })

    test('should display creation form with required fields', async ({
      page,
    }) => {
      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /create new/i })
        .click()

      // Name field (required)
      await expect(page.getByPlaceholder(/name|character name/i)).toBeVisible()

      // Description field (optional)
      await expect(page.getByPlaceholder(/description/i)).toBeVisible()

      // Create button
      await expect(
        page.getByRole('button', { name: /create and link|create/i }),
      ).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByText(/show related entities/i).click()
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /create new/i })
        .click()

      // Try to submit without filling required field
      await page
        .getByRole('button', { name: /create and link|create/i })
        .click()

      // Validation error should appear
      await expect(page.getByText(/name is required|required/i)).toBeVisible()

      // Modal should remain open
      await expect(page.getByTestId('create-new-modal')).toBeVisible()
    })

    test('should create and link new entity', async ({ page }) => {
      await page.getByText(/show related entities/i).click()

      // Get initial count
      const initialCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()

      // Open modal
      await page
        .getByTestId('characters-panel')
        .getByRole('button', { name: /create new/i })
        .click()

      // Fill in form
      const newCharacterName = 'New Test Character'
      const newCharacterDesc = 'Created via E2E test'

      await page.getByPlaceholder(/name|character name/i).fill(newCharacterName)
      await page.getByPlaceholder(/description/i).fill(newCharacterDesc)

      // Submit
      await page
        .getByRole('button', { name: /create and link|create/i })
        .click()

      // Success toast should appear
      await expect(
        page.getByText(/created successfully|created and linked/i),
      ).toBeVisible()

      // Modal should close
      await expect(page.getByTestId('create-new-modal')).not.toBeVisible()

      // New character should appear in the panel
      await expect(page.getByText(newCharacterName)).toBeVisible()

      const newCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()
      expect(newCount).toBe(initialCount + 1)
    })

    test('should create entity with privacy set to private by default', async ({
      page,
    }) => {
      // TODO: This test requires checking the created entity's privacy
      // May need to navigate to the entity detail page to verify
    })
  })

  test.describe('Unlink Entities', () => {
    test('should display unlink button for each linked entity', async ({
      page,
    }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Entity card should have remove/unlink button (×)
      const entityCard = page.getByTestId('entity-card').first()
      await expect(entityCard).toBeVisible()

      // Unlink button (depends on implementation - might be "×" or trash icon)
      await expect(
        entityCard.getByRole('button', { name: /remove|unlink|×/i }),
      ).toBeVisible()
    })

    test('should show confirmation before unlinking', async ({ page }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Click unlink button
      await page
        .getByTestId('entity-card')
        .first()
        .getByRole('button', { name: /remove|unlink|×/i })
        .click()

      // Confirmation dialog should appear
      // (Implementation may vary - might be a modal or browser confirm)
      // For now, assuming Radix UI Dialog
      await expect(page.getByText(/are you sure|confirm|unlink/i)).toBeVisible()
    })

    test('should unlink entity after confirmation', async ({ page }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Get initial count
      const initialCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()

      // Click unlink button
      await page
        .getByTestId('entity-card')
        .first()
        .getByRole('button', { name: /remove|unlink|×/i })
        .click()

      // Confirm
      await page.getByRole('button', { name: /confirm|yes|unlink/i }).click()

      // Success toast should appear
      await expect(
        page.getByText(/unlinked successfully|removed/i),
      ).toBeVisible()

      // Entity should be removed from panel
      const newCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()
      expect(newCount).toBe(initialCount - 1)
    })

    test('should cancel unlink on confirmation cancel', async ({ page }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Get initial count
      const initialCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()

      // Click unlink button
      await page
        .getByTestId('entity-card')
        .first()
        .getByRole('button', { name: /remove|unlink|×/i })
        .click()

      // Cancel
      await page.getByRole('button', { name: /cancel|no/i }).click()

      // Entity should remain in panel
      const newCount = await page
        .getByTestId('characters-panel')
        .getByTestId('entity-card')
        .count()
      expect(newCount).toBe(initialCount)
    })

    test('should not delete entity when unlinking - only remove relationship', async ({
      page,
      context,
    }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Note character ID before unlinking
      const characterId = existingCharacter.id

      // Unlink character
      await page
        .getByTestId('entity-card')
        .first()
        .getByRole('button', { name: /remove|unlink|×/i })
        .click()
      await page.getByRole('button', { name: /confirm|yes|unlink/i }).click()

      // Navigate to character detail page
      await page.goto(`/${owner.id}/characters/${characterId}`)

      // Character should still exist
      await expect(page.getByTestId('character-detail')).toBeVisible()
    })
  })

  test.describe('Navigation to Related Entities', () => {
    test('should navigate to character detail when clicking character card', async ({
      page,
    }) => {
      // TODO: Seed story with linked character

      await page.getByText(/show related entities/i).click()

      // Click on character card
      await page.getByTestId('entity-card').first().click()

      // Should navigate to character detail page
      await expect(page).toHaveURL(new RegExp(`/${owner.id}/characters/`))
      await expect(page.getByTestId('character-detail')).toBeVisible()
    })

    test('should protect navigation if story has unsaved changes', async ({
      page,
    }) => {
      // Enter edit mode and make changes
      await page.getByTestId('edit-button').click()
      await page.getByTestId('story-name-input').clear()
      await page.getByTestId('story-name-input').fill('Modified Name')

      // Show related entities
      await page.getByText(/show related entities/i).click()

      // Try to click character card
      await page.getByTestId('entity-card').first().click()

      // Unsaved changes modal should appear
      await expect(page.getByTestId('unsaved-changes-modal')).toBeVisible()

      // Should not navigate yet
      await expect(page).toHaveURL(
        new RegExp(`/${owner.id}/stories/${story.id}`),
      )
    })
  })

  test.describe('Owner vs Non-Owner Permissions', () => {
    test('should hide Add/Create/Unlink buttons for non-owners', async ({
      page,
    }) => {
      // TODO: Set up session as non-owner viewing public story with relationships

      await page.getByText(/show related entities/i).click()

      // Related entities should be visible
      await expect(page.getByTestId('related-entities-grid')).toBeVisible()

      // But action buttons should be hidden
      await expect(
        page.getByRole('button', { name: /add existing/i }),
      ).not.toBeVisible()
      await expect(
        page.getByRole('button', { name: /create new/i }),
      ).not.toBeVisible()
      await expect(
        page.getByRole('button', { name: /remove|unlink|×/i }),
      ).not.toBeVisible()
    })
  })
})
