'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'solito/navigation'
import { useRouter } from 'next/navigation'
import { UserInfoHeader } from './components/UserInfoHeader'
import { ContentSection } from './components/ContentSection'
import { ApiKeysSection } from './components/ApiKeysSection'
import { useUserContent } from './hooks/useUserContent'
import { useSubscriptionStatus } from './hooks/useSubscriptionStatus'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@repo/ui/components/ui/resizable'
import { useTheme } from 'next-themes'
import { useSession } from '../../../../apps/next/lib/auth-client'
import styles from './DetailScreen.module.css'

const useUserParams = useParams<{ username: string }>

export function UserDetailScreen() {
  const { username } = useUserParams()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { data: session } = useSession()

  const [profileUser, setProfileUser] = useState<any>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const { stories, characters, timelines, locations, isLoading } =
    useUserContent(profileUserId ?? '')
  const { subscription } = useSubscriptionStatus()

  useEffect(() => {
    const fetchUserData = async () => {
      if (username) {
        try {
          const fetchUserByUsername = await import(
            '../../../../apps/next/actions/user/getUserByUsername'
          ).then((m) => m.default)
          const userData = await fetchUserByUsername({ username })
          setProfileUser(userData)
          if (userData?.id) {
            setProfileUserId(userData.id)
          }
        } catch (error) {
          // Error handled by server action
        }
      }
    }
    fetchUserData()
  }, [username])

  const isOwner = Boolean(
    session?.user?.id && profileUserId && session.user.id === profileUserId,
  )

  const handleUpdateUsername = async (newUsername: string) => {
    const { updateUsername } = await import(
      '../../../../apps/next/actions/user/updateUsername'
    )
    const result = await updateUsername({ username: newUsername })
    if (result.success && result.username) {
      router.push(`/${result.username}`)
    }
    return result
  }

  const handleAddNew = (entityType: string) => {
    router.push(`/create/${entityType}`)
  }

  return (
    <main className="h-full p-6">
      <UserInfoHeader
        user={profileUser}
        theme={resolvedTheme}
        username={username}
        isOwner={isOwner}
        onUpdateUsername={handleUpdateUsername}
      />

      <ApiKeysSection />

      <ResizablePanelGroup
        direction="vertical"
        className="h-[calc(100vh-240px)] rounded-lg border"
      >
        <ResizablePanel id="top-row" defaultSize={60} minSize={30} maxSize={80}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              id="stories-panel"
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <ContentSection
                title="Stories"
                entityType="story"
                items={stories}
                isLoading={isLoading}
                onAddNew={() => handleAddNew('stories')}
                theme={resolvedTheme}
                userId={username}
                quota={
                  subscription
                    ? {
                        subscribed: subscription.subscribed,
                        count: stories.length,
                        limit: subscription.previewLimits.stories,
                      }
                    : undefined
                }
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="characters-panel"
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <ContentSection
                title="Characters"
                entityType="character"
                items={characters}
                isLoading={isLoading}
                onAddNew={() => handleAddNew('characters')}
                theme={resolvedTheme}
                userId={username}
                quota={
                  subscription
                    ? {
                        subscribed: subscription.subscribed,
                        count: characters.length,
                        limit: subscription.previewLimits.characters,
                      }
                    : undefined
                }
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          id="bottom-row"
          defaultSize={40}
          minSize={20}
          maxSize={70}
        >
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              id="timelines-panel"
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <ContentSection
                title="Timelines"
                entityType="timeline"
                items={timelines}
                isLoading={isLoading}
                onAddNew={() => handleAddNew('timelines')}
                theme={resolvedTheme}
                userId={username}
                quota={
                  subscription
                    ? {
                        subscribed: subscription.subscribed,
                        count: timelines.length,
                        limit: subscription.previewLimits.timelines,
                      }
                    : undefined
                }
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="locations-panel"
              defaultSize={50}
              minSize={20}
              maxSize={80}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <ContentSection
                title="Locations"
                entityType="location"
                items={locations}
                isLoading={isLoading}
                onAddNew={() => handleAddNew('locations')}
                theme={resolvedTheme}
                userId={username}
                quota={
                  subscription
                    ? {
                        subscribed: subscription.subscribed,
                        count: locations.length,
                        limit: subscription.previewLimits.locations,
                      }
                    : undefined
                }
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  )
}
