import { z } from 'zod'

export const RelationshipTypeSchema = z.enum([
  'parent',
  'child',
  'sibling',
  'spouse',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
  'custom',
])

export type RelationshipType = z.infer<typeof RelationshipTypeSchema>

export interface RelationshipOption {
  value: string
  label: string
}

export const RELATIONSHIP_INVERSE: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
  grandparent: 'grandchild',
  grandchild: 'grandparent',
  aunt_uncle: 'niece_nephew',
  niece_nephew: 'aunt_uncle',
  cousin: 'cousin',
  custom: 'custom',
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: 'Parent of',
  child: 'Child of',
  sibling: 'Sibling of',
  spouse: 'Spouse of',
  grandparent: 'Grandparent of',
  grandchild: 'Grandchild of',
  aunt_uncle: 'Aunt/Uncle of',
  niece_nephew: 'Niece/Nephew of',
  cousin: 'Cousin of',
}

export const FAMILY_TYPES = new Set([
  'parent',
  'child',
  'sibling',
  'spouse',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
])

export const PREDEFINED_RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { value: 'parent', label: 'Parent of' },
  { value: 'child', label: 'Child of' },
  { value: 'sibling', label: 'Sibling of' },
  { value: 'spouse', label: 'Spouse of' },
  { value: 'grandparent', label: 'Grandparent of' },
  { value: 'grandchild', label: 'Grandchild of' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle of' },
  { value: 'niece_nephew', label: 'Niece/Nephew of' },
  { value: 'cousin', label: 'Cousin of' },
  { value: 'custom', label: 'Custom...' },
]

export function getInverseRelationshipType(relationshipType: string): string {
  return RELATIONSHIP_INVERSE[relationshipType] ?? relationshipType
}

export function getRelationshipLabel(
  relationshipType: string,
  customLabel?: string | null,
): string {
  if (relationshipType === 'custom') {
    return customLabel || 'Custom'
  }
  return RELATIONSHIP_LABELS[relationshipType] ?? relationshipType
}
