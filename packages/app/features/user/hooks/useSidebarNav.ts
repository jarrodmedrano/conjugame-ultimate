'use client'

import { useMemo } from 'react'
import { BookOpen, Users, MapPin, Clock } from 'lucide-react'
import { useUserContent } from './useUserContent'

export interface EntityItem {
  id: string
  name: string
  slug: string
  href: string
}

interface Section {
  title: string
  icon: typeof BookOpen
  items: EntityItem[]
  createHref: string
  moreHref: string
}

export const useSidebarNav = (userId: string) => {
  const { stories, characters, locations, timelines, isLoading, error } =
    useUserContent(userId)

  const sections: Section[] = useMemo(() => {
    return [
      {
        title: 'Stories',
        icon: BookOpen,
        items: stories.map((story) => ({
          id: String(story.id),
          name: story.title || 'Untitled',
          slug: story.slug || String(story.id),
          href: `/${userId}/stories/${story.slug || story.id}`,
        })),
        createHref: '/create/stories',
        moreHref: `/${userId}/stories`,
      },
      {
        title: 'Characters',
        icon: Users,
        items: characters.map((character) => ({
          id: String(character.id),
          name: character.name || 'Unnamed',
          slug: character.slug || String(character.id),
          href: `/${userId}/characters/${character.slug || character.id}`,
        })),
        createHref: '/create/characters',
        moreHref: `/${userId}/characters`,
      },
      {
        title: 'Locations',
        icon: MapPin,
        items: locations.map((location) => ({
          id: String(location.id),
          name: location.name || 'Unnamed',
          slug: location.slug || String(location.id),
          href: `/${userId}/locations/${location.slug || location.id}`,
        })),
        createHref: '/create/locations',
        moreHref: `/${userId}/locations`,
      },
      {
        title: 'Timelines',
        icon: Clock,
        items: timelines.map((timeline) => ({
          id: String(timeline.id),
          name: timeline.name || 'Unnamed',
          slug: timeline.slug || String(timeline.id),
          href: `/${userId}/timelines/${timeline.slug || timeline.id}`,
        })),
        createHref: '/create/timelines',
        moreHref: `/${userId}/timelines`,
      },
    ]
  }, [stories, characters, locations, timelines, userId])

  return {
    sections,
    isLoading,
    error,
  }
}
