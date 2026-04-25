import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { joinGroup } from '@/app/actions/groups'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Plus, BookOpen } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, joined_at, groups(id, name, invite_code, created_by)')
    .eq('user_id', user!.id)
    .order('joined_at', { ascending: false })

  // Member counts per group
  const groupIds = (memberships ?? []).map(m => m.group_id)
  const memberCounts: Record<string, number> = {}
  if (groupIds.length > 0) {
    const { data: counts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)
    for (const c of counts ?? []) {
      memberCounts[c.group_id] = (memberCounts[c.group_id] ?? 0) + 1
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus grupos</h1>
        <Link href="/groups/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> Novo grupo
          </Button>
        </Link>
      </div>

      {/* Join by code */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Entrar em um grupo</h2>
        <form action={joinGroup} className="flex gap-2">
          <Input name="invite_code" placeholder="Código de convite" className="max-w-xs" />
          <Button type="submit" variant="secondary">Entrar</Button>
        </form>
      </div>

      {/* Group list */}
      {memberships && memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {memberships.map(m => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const group = m.groups as any
            return (
              <Link
                key={m.group_id}
                href={`/groups/${m.group_id}`}
                className="bg-white rounded-xl border p-4 hover:border-green-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {group?.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={13} /> {memberCounts[m.group_id] ?? 1} membro(s)
                      </span>
                    </div>
                  </div>
                  <BookOpen size={20} className="text-gray-300 group-hover:text-green-400 transition-colors mt-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="mx-auto mb-3 text-gray-200" size={48} />
          <p className="font-medium text-gray-500">Você ainda não está em nenhum grupo</p>
          <p className="text-sm mt-1">Crie um grupo ou peça o código de convite para alguém</p>
          <Link href="/groups/new" className="inline-block mt-4">
            <Button>Criar meu primeiro grupo</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
