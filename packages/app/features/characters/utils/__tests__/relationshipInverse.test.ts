import {
  getInverseRelationshipType,
  getRelationshipLabel,
  FAMILY_TYPES,
  PREDEFINED_RELATIONSHIP_OPTIONS,
} from '../relationshipInverse'

describe('getInverseRelationshipType', () => {
  it('returns child for parent', () => {
    expect(getInverseRelationshipType('parent')).toBe('child')
  })
  it('returns parent for child', () => {
    expect(getInverseRelationshipType('child')).toBe('parent')
  })
  it('returns sibling for sibling', () => {
    expect(getInverseRelationshipType('sibling')).toBe('sibling')
  })
  it('returns spouse for spouse', () => {
    expect(getInverseRelationshipType('spouse')).toBe('spouse')
  })
  it('returns grandchild for grandparent', () => {
    expect(getInverseRelationshipType('grandparent')).toBe('grandchild')
  })
  it('returns grandparent for grandchild', () => {
    expect(getInverseRelationshipType('grandchild')).toBe('grandparent')
  })
  it('returns niece_nephew for aunt_uncle', () => {
    expect(getInverseRelationshipType('aunt_uncle')).toBe('niece_nephew')
  })
  it('returns aunt_uncle for niece_nephew', () => {
    expect(getInverseRelationshipType('niece_nephew')).toBe('aunt_uncle')
  })
  it('returns cousin for cousin', () => {
    expect(getInverseRelationshipType('cousin')).toBe('cousin')
  })
  it('returns custom for custom', () => {
    expect(getInverseRelationshipType('custom')).toBe('custom')
  })
  it('returns same value for unknown types', () => {
    expect(getInverseRelationshipType('unknown_type')).toBe('unknown_type')
  })
})

describe('getRelationshipLabel', () => {
  it('returns human readable label for parent', () => {
    expect(getRelationshipLabel('parent')).toBe('Parent of')
  })
  it('returns human readable label for aunt_uncle', () => {
    expect(getRelationshipLabel('aunt_uncle')).toBe('Aunt/Uncle of')
  })
  it('returns custom label for custom type with label', () => {
    expect(getRelationshipLabel('custom', 'Rival')).toBe('Rival')
  })
  it('returns Custom for custom type without label', () => {
    expect(getRelationshipLabel('custom')).toBe('Custom')
  })
})

describe('FAMILY_TYPES', () => {
  it('includes all family relationship types', () => {
    expect(FAMILY_TYPES.has('parent')).toBe(true)
    expect(FAMILY_TYPES.has('child')).toBe(true)
    expect(FAMILY_TYPES.has('sibling')).toBe(true)
    expect(FAMILY_TYPES.has('spouse')).toBe(true)
    expect(FAMILY_TYPES.has('grandparent')).toBe(true)
    expect(FAMILY_TYPES.has('grandchild')).toBe(true)
    expect(FAMILY_TYPES.has('aunt_uncle')).toBe(true)
    expect(FAMILY_TYPES.has('niece_nephew')).toBe(true)
    expect(FAMILY_TYPES.has('cousin')).toBe(true)
  })
  it('does not include custom', () => {
    expect(FAMILY_TYPES.has('custom')).toBe(false)
  })
})

describe('PREDEFINED_RELATIONSHIP_OPTIONS', () => {
  it('includes all predefined options including custom', () => {
    const values = PREDEFINED_RELATIONSHIP_OPTIONS.map((o) => o.value)
    expect(values).toContain('parent')
    expect(values).toContain('sibling')
    expect(values).toContain('custom')
  })
})
