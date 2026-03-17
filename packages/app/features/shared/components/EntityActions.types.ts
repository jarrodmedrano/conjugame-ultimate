export interface EntityActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  privacy: 'public' | 'private'
  entityName: string
  entityType: 'character' | 'story' | 'location' | 'timeline'
}
