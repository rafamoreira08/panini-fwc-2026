import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { ALL_STICKERS } from '@/lib/stickers'
import { ProgressBar } from '@/components/album/ProgressBar'
import { Badge } from '@/components/ui/Badge'

export default async function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, created_by')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, joined_at, profiles(id, name)')
    .eq('group_id', groupId)
    .order('joined_at')

  if (!members) notFound()

  // Verify current user is a member
  const isMember = members.some(m => m.user_id === user.id)
  if (!isMember) notFound()

  // Sticker stats per member
  const { data: allStickers } = await supabase
    .from('user_stickers')
    .select('user_id, sticker_id, quantity')
    .eq('group_id', groupId)

  const statsByUser: Record<string, { have: number; dupes: number }> = {}
  for (const s of allStickers ?? []) {
    if (!statsByUser[s.user_id]) statsByUser[s.user_id] = { have: 0, dupes: 0 }
    if (s.quantity >= 1) statsByUser[s.user_id].have++
    if (s.quantity >= 2) statsByUser[s.user_id].dupes++
  }

  const totalStickers = ALL_STICKERS.length

  const sorted = [...members].sort(
    (a, b) => (statsByUser[b.user_id]?.have ?? 0) - (statsByUser[a.user_id]?.have ?? 0)
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
      <GroupTabs groupId={groupId} active="members" />

      <div className="space-y-3">
        {sorted.map((member, idx) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = member.profiles as any
          const stats = statsByUser[member.user_id] ?? { have: 0, dupes: 0 }
          const isMe = member.user_id === user.id
          const isOwner = member.user_id === group.created_by

          return (
            <div
              key={member.user_id}
              className={`bg-white rounded-xl border p-4 ${isMe ? 'border-green-300 ring-1 ring-green-100' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      {profile?.name?.[0]?.toUpperCase()}
                    </div>
                    {idx === 0 && (
                      <span className="absolute -top-1 -right-1 text-sm">🏆</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{profile?.name}</span>
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
