'use client'

import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { EntityListProps } from './types'
import { cn } from '../../../lib/utils'

export function EntityList({
  items,
  createHref,
  moreHref,
  searchQuery,
  totalCount,
  theme: _theme,
}: EntityListProps) {
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const displayItems = filteredItems.slice(0, 10)
  const showViewAll = totalCount > 10

  return (
    <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
      <li>
        <Link
          href={createHref}
          className={cn(
            'flex cursor-pointer items-center rounded-lg p-2 text-base font-medium',
            'text-gray-900 hover:bg-gray-100',
            'dark:text-white dark:hover:bg-gray-700',
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Link>
      </li>

      {displayItems.length === 0 && searchQuery ? (
        <li
          className={cn(
            'px-3 py-4 text-center text-sm',
            'text-gray-500 dark:text-gray-400',
          )}
        >
          No matches found
        </li>
      ) : displayItems.length === 0 ? (
        <li
          className={cn(
            'px-3 py-4 text-center text-sm',
            'text-gray-500 dark:text-gray-400',
          )}
        >
          No items yet
        </li>
      ) : (
        displayItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'flex cursor-pointer items-center rounded-lg p-2 text-sm font-normal',
                'text-primary hover:bg-gray-100',
                'dark:hover:bg-gray-700',
                'truncate',
              )}
            >
              {item.name}
            </Link>
          </li>
        ))
      )}

      {showViewAll && !searchQuery && (
        <li>
          <Link
            href={moreHref}
            className={cn(
              'flex cursor-pointer items-center rounded-lg p-2 text-base font-normal',
              'text-gray-500 hover:underline',
              'dark:text-gray-400',
            )}
          >
            View all {totalCount}
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        </li>
      )}
    </ul>
  )
}
