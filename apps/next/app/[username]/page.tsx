import { LanguageStatsCard } from '@app/features/user/components/LanguageStatsCard'
import { getUserLanguageStats } from '../../actions/progress/getUserProgress'
import { resolveUsername } from '../../lib/resolve-username'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const stats = await getUserLanguageStats(profileUser.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{profileUser.name || username}</h1>
        <p className="text-muted-foreground">@{username}</p>
      </div>
      {stats.length === 0 ? (
        <p className="text-muted-foreground">No quiz activity yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <LanguageStatsCard key={stat.language} stats={stat} />
          ))}
        </div>
      )}
    </div>
  )
}
