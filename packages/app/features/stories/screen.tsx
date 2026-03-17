'use client'

import { useState, useCallback } from 'react'
import { View } from '../../design/view'

import '@repo/ui/styles/globals.css'
import { Footer } from '@repo/ui/components/tailwind/footer'
import GalleryPage from '@repo/ui/components/pages/stories'
import { Header } from '../../components/header'
import { useCookies } from 'next-client-cookies'
import { usePublicEntities } from '../shared/hooks/usePublicEntities'

export function StoriesScreen() {
  const cookies = useCookies()
  const [query, setQuery] = useState('')

  const { items, isLoading, hasMore, sentinelRef } = usePublicEntities(
    'stories',
    { query },
  )

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
  }, [])

  // Public page - always use dark mode for header/logo
  return (
    <View>
      <Header cookies={cookies} />
      <GalleryPage
        items={items}
        isLoading={isLoading}
        hasMore={hasMore}
        sentinelRef={sentinelRef}
        onSearch={handleSearch}
        query={query}
      />
      <Footer />
    </View>
  )
}
