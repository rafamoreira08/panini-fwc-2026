'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase/client'
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
      try {
        const auth = getFirebaseAuth()
        await auth.authStateReady()
        const user = auth.currentUser
        if (!user) {
          router.push('/login')
          return
        }
        const token = await user.getIdToken()

        const res = await fetch('/api/groups/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, groupId }),
        })

        if (!res.ok) {
          router.push('/dashboard')
          return
        }

        const data = await res.json()
        setGroup({ name: data.name, inviteCode: data.inviteCode })
        setLoading(false)
      } catch (err) {
        console.error('[GroupPage] load error:', err)
        router.push('/dashboard')
      }
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
