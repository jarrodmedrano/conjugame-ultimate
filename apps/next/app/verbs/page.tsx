import { VerbsScreen } from '@app/features/verbs/verbs-screen'
import { getAllVerbs } from '../../actions/verbs/getVerbs'

export const metadata = { title: 'Verbs — Conjugame' }

export default async function VerbsPage() {
  const verbs = await getAllVerbs(200, 0)
  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <VerbsScreen initialVerbs={verbs} />
    </main>
  )
}
