import { headers } from 'next/headers'
import { auth } from '../../auth'
import { DashboardLayout } from '../../components/DashboardLayout'
import { getUserLanguageStats } from '../../actions/progress/getUserProgress'
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

  const languageStats = await getUserLanguageStats(userId)

  const sections: SidebarSection[] = [
    {
      title: 'Quiz',
      icon: 'BookOpen',
      items: [],
      createHref: '/quiz',
      moreHref: '/quiz',
    },
    {
      title: 'Languages',
      icon: 'Globe',
      items: languageStats.map((stat) => ({
        id: stat.language,
        name: stat.language.charAt(0).toUpperCase() + stat.language.slice(1),
        slug: stat.language,
        href: `/${username}?language=${stat.language}`,
      })),
      moreHref: `/${username}`,
    },
    {
      title: 'History',
      icon: 'Clock',
      items: [],
      moreHref: `/${username}/history`,
    },
  ]

  return <DashboardLayout sections={sections}>{children}</DashboardLayout>
}
