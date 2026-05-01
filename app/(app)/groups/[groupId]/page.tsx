'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import { doc, getDoc } from 'firebase/firestore'
import { InviteSection } from '@/components/groups/InviteSection'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { TradingHub } from '@/components/trades/TradingHub'
import { Loader } from 'lucide-react'

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<{ name: string; inviteCode: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const auth = getFirebaseAuth()
      await auth.authStateReady()
      const user = auth.currentUser
      if (!user) return

      const db = getFirebaseFirestore()

      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (!groupDoc.exists()) { router.push('/dashboard'); return }

      const memberDoc = await getDoc(doc(db, 'groupMembers', `${groupId}-${user.uid}`))
      if (!memberDoc.exists()) { router.push('/dashboard'); return }

      setGroup(groupDoc.data() as { name: string; inviteCode: string })
      setLoading(false)
    }
    load()
  }, [groupId, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
      <GroupTabs groupId={groupId} active="trades" />

      {/* Default to trades view */}
      <TradingHub groupId={groupId} />

      {/* Invite section */}
      <InviteSection inviteCode={group.inviteCode} />
    </div>
  )
}
