export interface DetailHeaderProps {
  title: string
  entityType: 'character' | 'story' | 'location' | 'timeline'
  userId: string
  privacy: 'public' | 'private'
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl?: string
  primaryImageAlt?: string
  isOwner: boolean
  theme?: string
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
}
