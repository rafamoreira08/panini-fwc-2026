import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumView } from '@/components/album/AlbumView'
import { InviteSection } from '@/components/groups/InviteSection'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { QuantityMap } from '@/lib/types'

export default async function AlbumPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const { data: stickers } = await supabase
    .from('user_stickers')
    .select('sticker_id, quantity')
    .eq('user_id', user.id)
    .eq('group_id', groupId)

  const quantities: QuantityMap = {}
  for (const s of stickers ?? []) {
    quantities[s.sticker_id] = s.quantity
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
      </div>

      <GroupTabs groupId={groupId} active="album" />
      <InviteSection inviteCode={group.invite_code} />
      <AlbumView groupId={groupId} initialQuantities={quantities} />
    </div>
  )
}
