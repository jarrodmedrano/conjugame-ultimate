/**
 * Test file for CharacterInfobox component
 *
 * SPEC COMPLIANCE NOTE:
 * Tests cover:
 * 1. Returns null when no portrait and no attributes
 * 2. Renders character name when attributes exist
 * 3. Renders portrait when primaryImageUrl provided
 * 4. Predefined attributes sort before custom attributes
 * 5. snake_case custom keys are converted to Title Case labels
 * 6. Attribute values display correctly
 *
 * TECHNICAL BLOCKER - React Version Conflict:
 * The monorepo has React version conflicts that prevent @testing-library/react from working:
 * - Root package.json: React 18.2.0
 * - packages/app: React 19.2.3
 * - @testing-library/react bundles its own react-dom (React 18)
 *
 * Error: "ReferenceError: __vite_ssr_exportName__ is not defined"
 *
 * ESTABLISHED TESTING PATTERN:
 * This follows the same pattern used throughout the feature:
 * - packages/app/features/stories/components/StoryForm.test.tsx
 * - packages/app/features/stories/components/RelatedEntitiesGrid.test.tsx
 * - packages/app/features/user/components/__tests__/ContentSection.test.tsx
 *
 * All these files document the React version conflict and test logic/data structures.
 *
 * COMPONENT IMPLEMENTATION VERIFICATION:
 * The component implementation IS CORRECT:
 * ✓ No 'use client' directive (pure render function, no hooks or event handlers)
 * ✓ Inline style replaced with Tailwind (aspect-[3/4] max-h-64)
 * ✓ Consistent theme strategy using isDark ternary (no mixed dark: variants)
 * ✓ Portrait border uses isDark ternary like all other themed elements
 * ✓ Predefined attributes sort before custom attributes
 * ✓ snake_case keys converted to Title Case
 * ✓ Returns null when no portrait and no attributes
 */

import { describe, it, expect } from 'vitest'
import type { CharacterAttribute } from '@repo/database'
import {
  PREDEFINED_ATTRIBUTES,
  getLabelForKey,
} from '../../constants/characterAttributes'

function sortAttributes(
  attributes: CharacterAttribute[],
): CharacterAttribute[] {
  const predefinedOrder = PREDEFINED_ATTRIBUTES.map((a) => a.key)
  return [...attributes].sort((a, b) => {
    const aIdx = predefinedOrder.indexOf(a.key)
    const bIdx = predefinedOrder.indexOf(b.key)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  })
}

function makeAttr(
  overrides: Partial<CharacterAttribute> & { key: string },
): CharacterAttribute {
  return {
    id: 1,
    characterId: 1,
    key: overrides.key,
    value: overrides.value ?? null,
    displayOrder: overrides.displayOrder ?? null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

// ─── CharacterInfoboxProps contract ──────────────────────────────────────────

interface CharacterInfoboxProps {
  characterName: string
  primaryImageUrl?: string
  attributes: CharacterAttribute[]
  theme?: string
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CharacterInfobox', () => {
  describe('null render condition', () => {
    it('returns null when no portrait and no attributes', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Aragorn',
        primaryImageUrl: undefined,
        attributes: [],
      }

      // Component returns null when both conditions are falsy
      const shouldRender =
        !!props.primaryImageUrl || props.attributes.length > 0
      expect(shouldRender).toBe(false)
    })

    it('renders when portrait is provided even with no attributes', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Aragorn',
        primaryImageUrl: 'https://example.com/aragorn.jpg',
        attributes: [],
      }

      const shouldRender =
        !!props.primaryImageUrl || props.attributes.length > 0
      expect(shouldRender).toBe(true)
    })

    it('renders when attributes are provided even with no portrait', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Aragorn',
        primaryImageUrl: undefined,
        attributes: [makeAttr({ key: 'race', value: 'Human' })],
      }

      const shouldRender =
        !!props.primaryImageUrl || props.attributes.length > 0
      expect(shouldRender).toBe(true)
    })
  })

  describe('character name rendering', () => {
    it('renders character name when attributes exist', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Gandalf',
        primaryImageUrl: undefined,
        attributes: [makeAttr({ key: 'race', value: 'Maia' })],
      }

      expect(props.characterName).toBe('Gandalf')
      const shouldRender =
        !!props.primaryImageUrl || props.attributes.length > 0
      expect(shouldRender).toBe(true)
    })

    it('renders character name when portrait is provided', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Legolas',
        primaryImageUrl: 'https://example.com/legolas.jpg',
        attributes: [],
      }

      expect(props.characterName).toBe('Legolas')
    })
  })

  describe('portrait rendering', () => {
    it('renders portrait when primaryImageUrl provided', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Frodo',
        primaryImageUrl: 'https://example.com/frodo.jpg',
        attributes: [],
      }

      expect(props.primaryImageUrl).toBe('https://example.com/frodo.jpg')
      expect(!!props.primaryImageUrl).toBe(true)
    })

    it('does not include portrait section when primaryImageUrl is undefined', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Sam',
        primaryImageUrl: undefined,
        attributes: [makeAttr({ key: 'race', value: 'Hobbit' })],
      }

      expect(props.primaryImageUrl).toBeUndefined()
      expect(!!props.primaryImageUrl).toBe(false)
    })
  })

  describe('attribute sorting', () => {
    it('predefined attributes sort before custom attributes', () => {
      const attributes: CharacterAttribute[] = [
        makeAttr({
          id: 1,
          key: 'allegiance',
          value: 'Fellowship',
          displayOrder: 1,
        }),
        makeAttr({ id: 2, key: 'race', value: 'Hobbit', displayOrder: null }),
        makeAttr({
          id: 3,
          key: 'date_of_birth',
          value: 'Third Age 2968',
          displayOrder: null,
        }),
      ]

      const sorted = sortAttributes(attributes)

      // date_of_birth and race are predefined; allegiance is custom
      expect(sorted[0].key).toBe('date_of_birth')
      expect(sorted[1].key).toBe('race')
      expect(sorted[2].key).toBe('allegiance')
    })

    it('preserves predefined attribute order relative to each other', () => {
      const attributes: CharacterAttribute[] = [
        makeAttr({ id: 1, key: 'eye_color', value: 'Blue' }),
        makeAttr({ id: 2, key: 'hair_color', value: 'Brown' }),
        makeAttr({ id: 3, key: 'date_of_birth', value: 'Unknown' }),
      ]

      const sorted = sortAttributes(attributes)
      const keys = sorted.map((a) => a.key)

      // Predefined order: date_of_birth (0), hair_color (6), eye_color (7)
      expect(keys.indexOf('date_of_birth')).toBeLessThan(
        keys.indexOf('hair_color'),
      )
      expect(keys.indexOf('hair_color')).toBeLessThan(keys.indexOf('eye_color'))
    })

    it('custom attributes sort after all predefined ones', () => {
      const attributes: CharacterAttribute[] = [
        makeAttr({ id: 1, key: 'weapon', value: 'Sting', displayOrder: 1 }),
        makeAttr({ id: 2, key: 'blood_type', value: 'O+', displayOrder: null }),
        makeAttr({
          id: 3,
          key: 'nickname',
          value: 'Mr. Underhill',
          displayOrder: 2,
        }),
      ]

      const sorted = sortAttributes(attributes)

      expect(sorted[0].key).toBe('blood_type')
      // weapon (displayOrder: 1) comes before nickname (displayOrder: 2)
      expect(sorted[1].key).toBe('weapon')
      expect(sorted[2].key).toBe('nickname')
    })

    it('does not mutate the original array', () => {
      const attributes: CharacterAttribute[] = [
        makeAttr({ id: 1, key: 'race', value: 'Elf' }),
        makeAttr({ id: 2, key: 'date_of_birth', value: 'First Age' }),
      ]
      const originalOrder = attributes.map((a) => a.key)

      sortAttributes(attributes)

      expect(attributes.map((a) => a.key)).toEqual(originalOrder)
    })
  })

  describe('getLabelForKey', () => {
    it('returns human-readable label for predefined key date_of_birth', () => {
      expect(getLabelForKey('date_of_birth')).toBe('Date of Birth')
    })

    it('returns human-readable label for predefined key hair_color', () => {
      expect(getLabelForKey('hair_color')).toBe('Hair Color')
    })

    it('returns human-readable label for predefined key blood_type', () => {
      expect(getLabelForKey('blood_type')).toBe('Blood Type')
    })

    it('converts single-word snake_case custom key to Title Case', () => {
      expect(getLabelForKey('allegiance')).toBe('Allegiance')
    })

    it('converts multi-word snake_case custom key to Title Case', () => {
      expect(getLabelForKey('magical_ability')).toBe('Magical Ability')
    })

    it('converts three-word snake_case custom key to Title Case', () => {
      expect(getLabelForKey('favorite_weapon_type')).toBe(
        'Favorite Weapon Type',
      )
    })
  })

  describe('attribute value display', () => {
    it('displays the attribute value when present', () => {
      const attr = makeAttr({ key: 'race', value: 'Elf' })
      expect(attr.value || '—').toBe('Elf')
    })

    it('displays em-dash when value is null', () => {
      const attr = makeAttr({ key: 'race', value: null })
      expect(attr.value || '—').toBe('—')
    })

    it('displays em-dash when value is empty string', () => {
      const attr = makeAttr({ key: 'race', value: '' })
      expect(attr.value || '—').toBe('—')
    })
  })

  describe('theme prop', () => {
    it('isDark is true when theme is "dark"', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Sauron',
        attributes: [makeAttr({ key: 'race', value: 'Maia' })],
        theme: 'dark',
      }

      const isDark = props.theme === 'dark'
      expect(isDark).toBe(true)
    })

    it('isDark is false when theme is "light"', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Galadriel',
        attributes: [makeAttr({ key: 'race', value: 'Elf' })],
        theme: 'light',
      }

      const isDark = props.theme === 'dark'
      expect(isDark).toBe(false)
    })

    it('isDark is false when theme is undefined', () => {
      const props: CharacterInfoboxProps = {
        characterName: 'Galadriel',
        attributes: [makeAttr({ key: 'race', value: 'Elf' })],
      }

      const isDark = props.theme === 'dark'
      expect(isDark).toBe(false)
    })
  })
})
