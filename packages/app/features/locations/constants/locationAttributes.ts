export const PREDEFINED_ATTRIBUTES: ReadonlyArray<{
  key: string
  label: string
}> = [
  { key: 'type', label: 'Type' },
  { key: 'region', label: 'Region' },
  { key: 'climate', label: 'Climate' },
  { key: 'population', label: 'Population' },
  { key: 'status', label: 'Status' },
  { key: 'founded', label: 'Founded' },
  { key: 'ruler', label: 'Ruler/Leader' },
  { key: 'government', label: 'Government' },
  { key: 'language', label: 'Language' },
  { key: 'currency', label: 'Currency' },
]

export function getLabelForKey(key: string): string {
  const predefined = PREDEFINED_ATTRIBUTES.find((a) => a.key === key)
  if (predefined) return predefined.label
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
