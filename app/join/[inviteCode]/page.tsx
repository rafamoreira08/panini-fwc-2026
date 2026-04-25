import { createClient } from '@/lib/supabase/server'
import { joinGroupByCode } from '@/app/actions/groups'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${inviteCode}`)
  }

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single()

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900">Convite inválido</h1>
          <p className="text-gray-500 mt-2">Este link de convite não existe ou expirou.</p>
          <Link href="/dashboard" className="inline-block mt-4">
            <Button>Ir para meus grupos</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/groups/${group.id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚽</div>
        <h1 className="text-xl font-bold text-gray-900">Você foi convidado!</h1>
        <p className="text-gray-600 mt-2">
          Para entrar no grupo <span className="font-semibold text-green-700">{group.name}</span>
        </p>
        <form
          action={async () => {
            'use server'
            await joinGroupByCode(inviteCode)
          }}
          className="mt-6"
        >
          <Button type="submit" size="lg" className="w-full">
            Entrar no grupo
          </Button>
        </form>
        <Link href="/dashboard" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
          Cancelar
        </Link>
      </div>
    </div>
  )
}
