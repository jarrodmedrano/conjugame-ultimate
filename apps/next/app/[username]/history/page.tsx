import { QuizHistoryTable } from '@app/features/user/components/QuizHistoryTable'
import { getUserHistory } from '../../../actions/progress/getUserProgress'
import { resolveUsername } from '../../../lib/resolve-username'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserHistoryPage({ params }: Props) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const history = await getUserHistory(profileUser.id, 20, 0)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quiz History</h2>
      <QuizHistoryTable history={history} />
    </div>
  )
}
