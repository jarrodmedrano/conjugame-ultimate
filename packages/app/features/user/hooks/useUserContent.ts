import { useState, useEffect } from 'react'
import type {
  ListStoriesForUserWithPrivacyRow,
  ListCharactersForUserRow,
  ListTimelinesForUserRow,
  ListLocationsForUserRow,
} from '@repo/database'

interface UserContentResult {
  stories: ListStoriesForUserWithPrivacyRow[]
  characters: ListCharactersForUserRow[]
  timelines: ListTimelinesForUserRow[]
  locations: ListLocationsForUserRow[]
  isLoading: boolean
  error: string | null
}

export function useUserContent(userId: string): UserContentResult {
  const [stories, setStories] = useState<ListStoriesForUserWithPrivacyRow[]>([])
  const [characters, setCharacters] = useState<ListCharactersForUserRow[]>([])
  const [timelines, setTimelines] = useState<ListTimelinesForUserRow[]>([])
  const [locations, setLocations] = useState<ListLocationsForUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      setError('Invalid user ID')
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchContent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Dynamically import server actions to avoid static imports
        const [
          listStoriesForUser,
          listCharactersForUser,
          listTimelinesForUser,
          listLocationsForUser,
        ] = await Promise.all([
          import(
            '../../../../../apps/next/actions/user/listStoriesForUser'
          ).then((m) => m.default),
          import(
            '../../../../../apps/next/actions/user/listCharactersForUser'
          ).then((m) => m.default),
          import(
            '../../../../../apps/next/actions/user/listTimelinesForUser'
          ).then((m) => m.default),
          import(
            '../../../../../apps/next/actions/user/listLocationsForUser'
          ).then((m) => m.default),
        ])

        // Fetch all content types in parallel
        const [storiesData, charactersData, timelinesData, locationsData] =
          await Promise.all([
            listStoriesForUser({ userid: userId, viewerid: userId }),
            listCharactersForUser({ userid: userId, viewerid: userId }),
            listTimelinesForUser({ userid: userId, viewerid: userId }),
            listLocationsForUser({ userid: userId, viewerid: userId }),
          ])

        // Only update state if not cancelled (prevents race conditions)
        if (!cancelled) {
          setStories(storiesData)
          setCharacters(charactersData)
          setTimelines(timelinesData)
          setLocations(locationsData)
        }
      } catch (err) {
        // Only update error state if not cancelled
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setError(`Failed to fetch user content: ${message}`)
          setStories([])
          setCharacters([])
          setTimelines([])
          setLocations([])
        }
      } finally {
        // Only update loading state if not cancelled
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchContent()

    // Cleanup function to prevent race conditions
    return () => {
      cancelled = true
    }
  }, [userId])

  return {
    stories,
    characters,
    timelines,
    locations,
    isLoading,
    error,
  }
}
