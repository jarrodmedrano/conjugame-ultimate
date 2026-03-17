'use client'

import { cn } from '@repo/ui/lib/utils'
import { CollapsibleSection } from './sidebar/CollapsibleSection'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

export interface EntityItem {
  id: string
  name: string
  slug: string
  href: string
}

export interface SidebarSection {
  title: string
  icon: LucideIcon | string
  items: EntityItem[]
  createHref: string
  moreHref: string
}

export interface NavProps {
  isCollapsed: boolean
  sections: SidebarSection[]
  isLoading?: boolean
  error?: string | null
  theme?: string
  onExpand?: () => void
}

export function SidebarNav({
  isCollapsed,
  sections = [],
  isLoading,
  error,
  theme,
  onExpand,
}: NavProps) {
  if (isLoading) {
    return (
      <div
        data-collapsed={isCollapsed}
        className={cn(
          'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
        )}
      >
        <nav className="grid gap-1 px-2">
          {/* Skeleton sections mimicking CollapsibleSection structure */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 py-2">
              {/* Section header skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                {!isCollapsed && <Skeleton className="h-4 w-20" />}
              </div>
              {/* Entity items skeleton */}
              {!isCollapsed && (
                <div className="ml-6 flex flex-col gap-1">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-collapsed={isCollapsed}
        className={cn(
          'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
        )}
      >
        <div className="px-2 text-sm text-red-500">Error loading entities</div>
      </div>
    )
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className={cn(
        'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
      )}
    >
      <nav className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.title}
            title={section.title}
            items={section.items}
            icon={section.icon}
            createHref={section.createHref}
            moreHref={section.moreHref}
            isCollapsed={isCollapsed}
            theme={theme}
            onExpand={onExpand}
          />
        ))}
      </nav>
    </div>
  )
}
