import { headers } from 'next/headers'
import { auth } from '../../auth'
import { DashboardLayout } from '../../components/DashboardLayout'
import listStoriesForUser from '../../actions/user/listStoriesForUser'
import listCharactersForUser from '../../actions/user/listCharactersForUser'
import listLocationsForUser from '../../actions/user/listLocationsForUser'
import listTimelinesForUser from '../../actions/user/listTimelinesForUser'
import type { SidebarSection } from '@repo/ui/components/dashboard/sidebar-nav'
import { resolveUsername } from '../../lib/resolve-username'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export default async function UserLayout({ children, params }: LayoutProps) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    session = null
  }

  const viewerid = session?.user?.id

  const [stories, characters, locations, timelines] = await Promise.all([
    listStoriesForUser({ userid: userId, viewerid }),
    listCharactersForUser({ userid: userId, viewerid }),
    listLocationsForUser({ userid: userId, viewerid }),
    listTimelinesForUser({ userid: userId, viewerid }),
  ])

  const sections: SidebarSection[] = [
    {
      title: 'Stories',
      icon: 'BookOpen',
      items: stories.map((story) => ({
        id: String(story.id),
        name: story.title || 'Untitled',
        slug: story.slug || String(story.id),
        href: `/${username}/stories/${story.slug || story.id}`,
      })),
      createHref: '/create/stories',
      moreHref: `/${username}/stories`,
    },
    {
      title: 'Characters',
      icon: 'Users',
      items: characters.map((character) => ({
        id: String(character.id),
        name: character.name || 'Unnamed',
        slug: character.slug || String(character.id),
        href: `/${username}/characters/${character.slug || character.id}`,
      })),
      createHref: '/create/characters',
      moreHref: `/${username}/characters`,
    },
    {
      title: 'Locations',
      icon: 'MapPin',
      items: locations.map((location) => ({
        id: String(location.id),
        name: location.name || 'Unnamed',
        slug: location.slug || String(location.id),
        href: `/${username}/locations/${location.slug || location.id}`,
      })),
      createHref: '/create/locations',
      moreHref: `/${username}/locations`,
    },
    {
      title: 'Timelines',
      icon: 'Clock',
      items: timelines.map((timeline) => ({
        id: String(timeline.id),
        name: timeline.name || 'Unnamed',
        slug: timeline.slug || String(timeline.id),
        href: `/${username}/timelines/${timeline.slug || timeline.id}`,
      })),
      createHref: '/create/timelines',
      moreHref: `/${username}/timelines`,
    },
  ]

  return <DashboardLayout sections={sections}>{children}</DashboardLayout>
}
