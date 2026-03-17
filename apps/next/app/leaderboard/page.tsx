import { LeaderboardScreen } from '@app/features/leaderboard/leaderboard-screen'
import getLeaderboardAction from '../../actions/progress/getLeaderboard'

export const metadata = { title: 'Leaderboard — Conjugame' }

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardAction('', 50)
  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <LeaderboardScreen initialRows={leaderboard} />
    </main>
  )
}
