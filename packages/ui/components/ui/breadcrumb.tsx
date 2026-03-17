'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center', className)}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm leading-none">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li aria-hidden="true" className="flex items-center">
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
            <li>
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-foreground inline-block max-w-[200px] truncate transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current="page"
                  className="text-foreground inline-block max-w-[200px] truncate font-medium"
                >
                  {item.label}
                </span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}
