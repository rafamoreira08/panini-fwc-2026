import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/server'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { ALL_STICKERS } from '@/lib/stickers'
import { ProgressBar } from '@/components/album/ProgressBar'
import { Badge } from '@/components/ui/Badge'

export default async function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Get group
  const groupDoc = await getDoc(doc(firestore, 'groups', groupId))
  if (!groupDoc.exists()) notFound()

  const group = groupDoc.data()

  // Verify user is a member
  const memberDoc = await getDoc(doc(firestore, 'groupMembers', `${groupId}-${user.uid}`))
  if (!memberDoc.exists()) notFound()

  // Get all members
  const membersQ = query(collection(firestore, 'groupMembers'), where('groupId', '==', groupId))
  const membersSnapshot = await getDocs(membersQ)

  const members = await Promise.all(
    membersSnapshot.docs.map(async m => {
      const userRef = doc(firestore, 'users', m.data().userId)
      const userData = await getDoc(userRef)
      return {
        userId: m.data().userId,
        name: userData.data()?.name || 'Usuário',
        joinedAt: m.data().joinedAt,
      }
    })
  )

  // Get sticker stats per member
  const stickersQ = query(collection(firestore, 'userStickers'), where('groupId', '==', groupId))
  const stickersSnapshot = await getDocs(stickersQ)

  const statsByUser: Record<string, { have: number; dupes: number }> = {}
  for (const doc of stickersSnapshot.docs) {
    const data = doc.data()
    if (!statsByUser[data.userId]) statsByUser[data.userId] = { have: 0, dupes: 0 }
    if (data.quantity >= 1) statsByUser[data.userId].have++
    if (data.quantity >= 2) statsByUser[data.userId].dupes++
  }

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
          const isMe = member.userId === user.uid
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
                    {idx === 0 && (
                      <span className="absolute -top-1 -right-1 text-sm">🏆</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{member.name}</span>
                      {isMe && <Badge variant="blue">Você</Badge>}
                      {isOwner && <Badge variant="green">Criador</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {stats.dupes} repetida(s) disponível(is)
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-700 tabular-nums">
                  #{idx + 1}
                </span>
              </div>
              <ProgressBar have={stats.have} total={totalStickers} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
