import { ReactNode } from 'react'
import { SidebarNav, type SidebarSection } from '../sidebar-nav'

export const Sidebar = ({
  isCollapsed,
  sections,
  isLoading,
  error,
  theme,
  onExpand,
}: {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize?: number
  isCollapsed: boolean
  children?: ReactNode
  sections: SidebarSection[]
  isLoading?: boolean
  error?: string | null
  theme?: string
  onExpand?: () => void
}) => {
  return (
    <SidebarNav
      sections={sections}
      isCollapsed={isCollapsed}
      isLoading={isLoading}
      error={error}
      theme={theme}
      onExpand={onExpand}
    />
  )
}
