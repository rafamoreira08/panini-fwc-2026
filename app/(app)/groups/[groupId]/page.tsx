import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/server'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { AlbumView } from '@/components/album/AlbumView'
import { InviteSection } from '@/components/groups/InviteSection'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { QuantityMap } from '@/lib/types'

export default async function AlbumPage({ params }: { params: Promise<{ groupId: string }> }) {
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

  // Get user's stickers for this group
  const q = query(
    collection(firestore, 'userStickers'),
    where('userId', '==', user.uid),
    where('groupId', '==', groupId)
  )
  const stickersSnapshot = await getDocs(q)

  const quantities: QuantityMap = {}
  for (const doc of stickersSnapshot.docs) {
    quantities[doc.data().stickerId] = doc.data().quantity
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
      </div>

      <GroupTabs groupId={groupId} active="album" />
      <InviteSection inviteCode={group.inviteCode} />
      <AlbumView groupId={groupId} initialQuantities={quantities} />
    </div>
  )
}
