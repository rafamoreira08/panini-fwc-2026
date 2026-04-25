'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Nome obrigatório' }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })

  revalidatePath('/dashboard')
  redirect(`/groups/${group.id}`)
}

export async function joinGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const inviteCode = (formData.get('invite_code') as string).trim()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (groupError || !group) return { error: 'Código de convite inválido' }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'Você já é membro deste grupo' }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  redirect(`/groups/${group.id}`)
}

export async function joinGroupByCode(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (!group) return { error: 'Convite inválido' }

  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  revalidatePath('/dashboard')
  redirect(`/groups/${group.id}`)
}
