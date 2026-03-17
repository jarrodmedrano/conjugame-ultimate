export const PREDEFINED_ATTRIBUTES: ReadonlyArray<{
  key: string
  label: string
}> = [
  { key: 'genre', label: 'Genre' },
  { key: 'status', label: 'Status' },
  { key: 'setting', label: 'Setting' },
  { key: 'pov', label: 'Point of View' },
  { key: 'target_audience', label: 'Target Audience' },
  { key: 'themes', label: 'Themes' },
  { key: 'word_count', label: 'Word Count' },
  { key: 'timeline_period', label: 'Timeline Period' },
  { key: 'inspiration', label: 'Inspiration' },
  { key: 'language', label: 'Language' },
]

export function getLabelForKey(key: string): string {
  const predefined = PREDEFINED_ATTRIBUTES.find((a) => a.key === key)
  if (predefined) return predefined.label
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
