import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/server'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { TradeSearch } from '@/components/trades/TradeSearch'
import { MyDuplicates } from '@/components/trades/MyDuplicates'

export default async function TradesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Get group
  const groupDoc = await getDoc(doc(firestore, 'groups', groupId))
  if (!groupDoc.exists()) notFound()

  // Verify user is a member
  const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
  if (!memberDoc.exists()) notFound()

  const group = groupDoc.data()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
      <GroupTabs groupId={groupId} active="trades" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-semibold text-gray-700 mb-3">Buscar figurinha</h2>
          <TradeSearch groupId={groupId} />
        </section>

        <section>
          <h2 className="font-semibold text-gray-700 mb-3">Minhas repetidas</h2>
          <MyDuplicates groupId={groupId} />
        </section>
      </div>
    </div>
  )
}
