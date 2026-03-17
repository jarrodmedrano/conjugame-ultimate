import { VerbsScreen } from '@app/features/verbs/verbs-screen'
import { getAllVerbs } from '../../actions/verbs/getVerbs'

export const metadata = { title: 'Verbs — Conjugame' }

export default async function VerbsPage() {
  const verbs = await getAllVerbs(200, 0)
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <VerbsScreen initialVerbs={verbs} />
    </main>
  )
}
