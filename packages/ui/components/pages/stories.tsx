'use client'

import React from 'react'
import MasonryGrid, { EntityGridItem } from '../flowbite/masonry'
import SearchBarDatepickerHeroSection from '../flowbite/search-hero'

export interface GalleryPageProps {
  items: EntityGridItem[]
  isLoading: boolean
  hasMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
  onSearch: (query: string) => void
  query: string
}

export default function GalleryPage({
  items,
  isLoading,
  hasMore,
  sentinelRef,
  onSearch,
  query,
}: GalleryPageProps) {
  const isInitialLoad = isLoading && items.length === 0
  const isEmpty = !isLoading && items.length === 0
  const isLoadingMore = isLoading && items.length > 0

  return (
    <div className="bg-gray-900">
      <main>
        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-32 lg:px-8">
          <SearchBarDatepickerHeroSection onSearch={onSearch} />

          {isInitialLoad && (
            <div className="parallax grid grid-cols-4 gap-4 md:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="parallax-container h-64 animate-pulse rounded-lg bg-gray-700"
                />
              ))}
            </div>
          )}

          {isEmpty && (
            <p className="py-16 text-center text-gray-400">
              {query
                ? `No stories found for "${query}".`
                : 'No public stories yet.'}
            </p>
          )}

          {!isInitialLoad && items.length > 0 && <MasonryGrid items={items} />}

          {hasMore && <div ref={sentinelRef} className="h-4" />}

          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
