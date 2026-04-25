'use server'

import { createClient } from '@/lib/supabase/server'

export async function upsertSticker(groupId: string, stickerId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  if (quantity === 0) {
    await supabase
      .from('user_stickers')
      .delete()
      .match({ user_id: user.id, group_id: groupId, sticker_id: stickerId })
    return
  }

  const { error } = await supabase.from('user_stickers').upsert(
    { user_id: user.id, group_id: groupId, sticker_id: stickerId, quantity },
    { onConflict: 'user_id,group_id,sticker_id' }
  )

  if (error) throw new Error(error.message)
}

export async function getGroupStickers(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_stickers')
    .select('user_id, sticker_id, quantity')
    .eq('group_id', groupId)

  return data ?? []
}

export async function findTradersForSticker(groupId: string, stickerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Who has this sticker as a duplicate (qty >= 2), excluding me
  const { data: traders } = await supabase
    .from('user_stickers')
    .select('user_id, quantity, profiles(name)')
    .eq('group_id', groupId)
    .eq('sticker_id', stickerId)
    .gte('quantity', 2)
    .neq('user_id', user.id)

  if (!traders || traders.length === 0) return []

  // My duplicates
  const { data: myDupes } = await supabase
    .from('user_stickers')
    .select('sticker_id')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .gte('quantity', 2)

  const myDupeIds = new Set((myDupes ?? []).map(s => s.sticker_id))

  // For each trader: which of my dupes they don't have
  const result = await Promise.all(
    traders.map(async (trader) => {
      const { data: theirStickers } = await supabase
        .from('user_stickers')
        .select('sticker_id')
        .eq('user_id', trader.user_id)
        .eq('group_id', groupId)
        .gte('quantity', 1)

      const theyHave = new Set((theirStickers ?? []).map(s => s.sticker_id))
      const canOffer = [...myDupeIds].filter(id => !theyHave.has(id))

      return {
        user_id: trader.user_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (trader.profiles as any)?.name ?? 'Usuário',
        quantity: trader.quantity,
        canOffer,
      }
    })
  )

  return result
}

export async function getMyDuplicatesWithNeeders(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // My duplicates
  const { data: myDupes } = await supabase
    .from('user_stickers')
    .select('sticker_id, quantity')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .gte('quantity', 2)

  if (!myDupes || myDupes.length === 0) return []

  // All members' stickers in the group
  const { data: allStickers } = await supabase
    .from('user_stickers')
    .select('user_id, sticker_id, quantity, profiles(name)')
    .eq('group_id', groupId)
    .neq('user_id', user.id)

  const byUser = new Map<string, { name: string; has: Set<string> }>()
  for (const s of allStickers ?? []) {
    if (!byUser.has(s.user_id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byUser.set(s.user_id, { name: (s.profiles as any)?.name ?? 'Usuário', has: new Set() })
    }
    if (s.quantity >= 1) byUser.get(s.user_id)!.has.add(s.sticker_id)
  }

  return myDupes.map(dupe => {
    const needers = [...byUser.entries()]
      .filter(([, { has }]) => !has.has(dupe.sticker_id))
      .map(([uid, { name }]) => ({ user_id: uid, name }))

    return { sticker_id: dupe.sticker_id, quantity: dupe.quantity, needers }
  })
}
