import type { LucideIcon } from 'lucide-react'

export interface EntityItem {
  id: string
  name: string
  slug: string
  href: string
}

export interface CollapsibleSectionProps {
  title: string
  items: EntityItem[]
  icon: LucideIcon | string
  createHref?: string
  moreHref: string
  isCollapsed: boolean
  theme?: string
  onExpand?: () => void
}

export interface SectionHeaderProps {
  title: string
  icon: LucideIcon | string
  count: number
  isExpanded: boolean
  isCollapsed: boolean
  theme?: string
  moreHref: string
  onClick: () => void
}

export interface EntityListProps {
  items: EntityItem[]
  createHref?: string
  moreHref: string
  searchQuery: string
  totalCount: number
  theme?: string
}
