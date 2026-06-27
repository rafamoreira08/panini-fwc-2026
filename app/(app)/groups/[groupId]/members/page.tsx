'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { ALL_STICKERS } from '@/lib/stickers'
import { ProgressBar } from '@/components/album/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Loader } from 'lucide-react'

interface Member {
  userId: string
  name: string
  joinedAt: number
}

interface Stats {
  have: number
  dupes: number
}

export default function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<{ name: string; createdBy: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [statsByUser, setStatsByUser] = useState<Record<string, Stats>>({})
  const [currentUid, setCurrentUid] = useState('')
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
        setCurrentUid(user.uid)
        const token = await user.getIdToken()

        // Get group info + verify membership
        const groupRes = await fetch('/api/groups/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, groupId }),
        })
        if (!groupRes.ok) {
          router.push('/dashboard')
          return
        }
        const groupData = await groupRes.json()

        // Get members + sticker quantities
        const membersRes = await fetch('/api/groups/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, groupId, includeStickers: true }),
        })
        if (!membersRes.ok) {
          router.push('/dashboard')
          return
        }
        const membersData = await membersRes.json()

        const memberList: Member[] = (membersData.members ?? []).map((m: any) => ({
          userId: m.userId,
          name: m.name || 'Usuário',
          joinedAt: m.joinedAt,
        }))

        const stats: Record<string, Stats> = {}
        for (const m of membersData.members ?? []) {
          let have = 0
          let dupes = 0
          for (const q of Object.values(m.qty ?? {}) as number[]) {
            if (q >= 1) have++
            if (q >= 2) dupes++
          }
          stats[m.userId] = { have, dupes }
        }

        setGroup({ name: groupData.name, createdBy: groupData.createdBy })
        setMembers(memberList)
        setStatsByUser(stats)
        setLoading(false)
      } catch (err) {
        console.error('[MembersPage] load error:', err)
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

  const totalStickers = ALL_STICKERS.length
  const sorted = [...members].sort(
    (a, b) => (statsByUser[b.userId]?.have ?? 0) - (statsByUser[a.userId]?.have ?? 0)
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
      <GroupTabs groupId={groupId} active="members" />

      <div className="space-y-3">
        {sorted.map((member, idx) => {
          const stats = statsByUser[member.userId] ?? { have: 0, dupes: 0 }
          const isMe = member.userId === currentUid
          const isOwner = member.userId === group.createdBy

          return (
            <div
              key={member.userId}
              className={`bg-white rounded-xl border p-4 ${isMe ? 'border-green-300 ring-1 ring-green-100' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      {member.name[0]?.toUpperCase()}
                    </div>
                    {idx === 0 && <span className="absolute -top-1 -right-1 text-sm">🏆</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{member.name}</span>
                      {isMe && <Badge variant="blue">Você</Badge>}
                      {isOwner && <Badge variant="green">Criador</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">{stats.dupes} repetida(s) disponível(is)</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-700 tabular-nums">#{idx + 1}</span>
              </div>
              <ProgressBar have={stats.have} total={totalStickers} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
