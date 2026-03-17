import { LeaderboardScreen } from '@app/features/leaderboard/leaderboard-screen'
import getLeaderboardAction from '../../actions/progress/getLeaderboard'

export const metadata = { title: 'Leaderboard — Conjugame' }

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardAction('', 50)
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <LeaderboardScreen initialRows={leaderboard} />
    </main>
  )
}
