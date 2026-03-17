export const PREDEFINED_ATTRIBUTES: ReadonlyArray<{
  key: string
  label: string
}> = [
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'place_of_birth', label: 'Place of Birth' },
  { key: 'date_of_death', label: 'Date of Death' },
  { key: 'place_of_death', label: 'Place of Death' },
  { key: 'sex', label: 'Sex' },
  { key: 'race', label: 'Race' },
  { key: 'hair_color', label: 'Hair Color' },
  { key: 'eye_color', label: 'Eye Color' },
  { key: 'blood_type', label: 'Blood Type' },
]

export function getLabelForKey(key: string): string {
  const predefined = PREDEFINED_ATTRIBUTES.find((a) => a.key === key)
  if (predefined) return predefined.label
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
