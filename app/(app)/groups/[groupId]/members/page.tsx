'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { getUserStickers } from '@/app/actions/stickers'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { ALL_STICKERS } from '@/lib/stickers'
import { ProgressBar } from '@/components/album/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Loader } from 'lucide-react'

interface Member {
  userId: string
  name: string
  joinedAt: any
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
      const auth = getFirebaseAuth()
      await auth.authStateReady()
      const user = auth.currentUser
      if (!user) return
      setCurrentUid(user.uid)

      const db = getFirebaseFirestore()

      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (!groupDoc.exists()) { router.push('/dashboard'); return }

      const memberCheck = await getDoc(doc(db, 'groupMembers', `${groupId}-${user.uid}`))
      if (!memberCheck.exists()) { router.push('/dashboard'); return }

      const membersQ = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
      const membersSnapshot = await getDocs(membersQ)

      const memberList = await Promise.all(
        membersSnapshot.docs.map(async m => {
          const userDoc = await getDoc(doc(db, 'users', m.data().userId))
          return {
            userId: m.data().userId,
            name: userDoc.data()?.name || 'Usuário',
            joinedAt: m.data().joinedAt,
          }
        })
      )

      // Load each member's global sticker stats
      const memberIds = memberList.map(m => m.userId)
      const memberQtys = await Promise.all(memberIds.map(uid => getUserStickers(uid)))

      const stats: Record<string, Stats> = {}
      memberIds.forEach((uid, i) => {
        const qty = memberQtys[i]
        let have = 0, dupes = 0
        for (const q of Object.values(qty)) {
          if (q >= 1) have++
          if (q >= 2) dupes++
        }
        stats[uid] = { have, dupes }
      })

      setGroup(groupDoc.data() as { name: string; createdBy: string })
      setMembers(memberList)
      setStatsByUser(stats)
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
