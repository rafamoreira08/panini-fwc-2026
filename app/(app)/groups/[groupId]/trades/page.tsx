import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { TradeSearch } from '@/components/trades/TradeSearch'
import { MyDuplicates } from '@/components/trades/MyDuplicates'

export default async function TradesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
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
