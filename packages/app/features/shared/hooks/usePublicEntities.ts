import { useState, useEffect, useRef, useCallback } from 'react'
import type { EntityGridItem } from '@repo/ui/components/flowbite/masonry'

export type { EntityGridItem }

export const VALID_ENTITY_TYPES = [
  'stories',
  'characters',
  'locations',
  'timelines',
] as const

export type EntityType = (typeof VALID_ENTITY_TYPES)[number]

export interface UsePublicEntitiesOptions {
  limit?: number
  query?: string
}

export interface UsePublicEntitiesResult {
  items: EntityGridItem[]
  isLoading: boolean
  hasMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
}

export function usePublicEntities(
  entityType: EntityType,
  options: UsePublicEntitiesOptions = {},
): UsePublicEntitiesResult {
  const { limit = 20, query = '' } = options

  const [items, setItems] = useState<EntityGridItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Refs that mirror state so the IntersectionObserver callback
  // always reads current values without being recreated on every render
  const isLoadingRef = useRef<boolean>(false)
  const hasMoreRef = useRef<boolean>(true)
  const offsetRef = useRef<number>(0)

  isLoadingRef.current = isLoading
  hasMoreRef.current = hasMore

  const fetchPage = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return

    setIsLoading(true)
    isLoadingRef.current = true

    const currentOffset = offsetRef.current

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(currentOffset),
        ...(query ? { q: query } : {}),
      })
      const response = await fetch(`/api/${entityType}?${params}`)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const {
        items: newItems,
        hasMore: serverHasMore,
      }: { items: EntityGridItem[]; hasMore: boolean } = await response.json()

      if (newItems.length === 0) {
        setHasMore(false)
        hasMoreRef.current = false
      } else {
        setItems((prev) => [...prev, ...newItems])
        // Advance offset by actual items received, not limit, to handle partial pages
        offsetRef.current = currentOffset + newItems.length

        setHasMore(serverHasMore)
        hasMoreRef.current = serverHasMore
      }
    } catch (error) {
      console.error(
        `Failed to fetch ${entityType}:`,
        error instanceof Error ? error.message : 'Unknown error',
      )
      setHasMore(false)
      hasMoreRef.current = false
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [entityType, limit, query])

  // Reset and fetch first page whenever entityType, limit, or query changes
  useEffect(() => {
    setItems([])
    setIsLoading(false)
    setHasMore(true)
    isLoadingRef.current = false
    hasMoreRef.current = true
    offsetRef.current = 0

    fetchPage()
  }, [entityType, limit, query, fetchPage])

  // Set up IntersectionObserver to load more when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (
          entry?.isIntersecting &&
          !isLoadingRef.current &&
          hasMoreRef.current
        ) {
          fetchPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [fetchPage])

  return {
    items,
    isLoading,
    hasMore,
    sentinelRef,
  }
}
