'use client'

import { useEffect, useState, useMemo } from 'react'
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { getUserStickers } from '@/app/actions/stickers'
import { ALL_STICKERS, StickerDef } from '@/lib/stickers'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeftRight, Search, Users, Package, Loader, Flame } from 'lucide-react'

interface MemberData {
  userId: string
  name: string
  qty: Record<string, number>
}

interface AvailableSticker {
  sticker: StickerDef
  holders: {
    userId: string
    name: string
    quantity: number
    canOffer: StickerDef[]
    canOfferWithSaturation: Array<StickerDef & { saturation: number }>
  }[]
}

interface SmartTrade {
  member: MemberData
  iCanGive: Array<StickerDef & { rarity: number }>
  iCanGet: StickerDef[]
  maxTrades: number
}

export function TradingHub({ groupId }: { groupId: string }) {
  const [tab, setTab] = useState<'available' | 'smart'>('available')
  const [members, setMembers] = useState<MemberData[]>([])
  const [me, setMe] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [expandedSticker, setExpandedSticker] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const auth = getFirebaseAuth()
      await auth.authStateReady()
      const user = auth.currentUser
      if (!user) return

      const db = getFirebaseFirestore()

      const membersQ = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
      const membersSnap = await getDocs(membersQ)
      const memberIds = membersSnap.docs.map(d => d.data().userId)

      // Load each member's name and global sticker collection in parallel
      const [userDocs, memberQtys] = await Promise.all([
        Promise.all(memberIds.map(uid => getDoc(doc(db, 'users', uid)))),
        Promise.all(memberIds.map(uid => getUserStickers(uid))),
      ])

      const memberList: MemberData[] = memberIds.map((uid, i) => {
        const userData = userDocs[i].data()
        let name = userData?.name || ''

        // Fallback: try email
        if (!name) {
          name = userData?.email || ''
        }

        // Final fallback: just "Usuário" without ID
        if (!name) {
          name = 'Usuário'
        }

        return {
          userId: uid,
          name,
          qty: memberQtys[i],
        }
      })

      setMembers(memberList)
      setMe(memberList.find(m => m.userId === user.uid) ?? null)
      setLoading(false)
    }
    load()
  }, [groupId])

  const others = useMemo(() => members.filter(m => m.userId !== me?.userId), [members, me])

  const available = useMemo((): AvailableSticker[] => {
    if (!me) return []

    // Calcular saturação no grupo
    const holderCount: Record<string, number> = {}
    members.forEach(member => {
      ALL_STICKERS.forEach(sticker => {
        if ((member.qty[sticker.id] ?? 0) >= 1) {
          holderCount[sticker.id] = (holderCount[sticker.id] ?? 0) + 1
        }
      })
    })

    return ALL_STICKERS
      .filter(s => (me.qty[s.id] ?? 0) === 0)
      .filter(s => others.some(m => (m.qty[s.id] ?? 0) >= 2))
      .map(s => ({
        sticker: s,
        holders: others
          .filter(m => (m.qty[s.id] ?? 0) >= 2)
          .map(m => {
            const canOffer = ALL_STICKERS.filter(
              ms => (me.qty[ms.id] ?? 0) >= 2 && (m.qty[ms.id] ?? 0) === 0
            )
            // Ordenar por saturação (mais saturadas primeiro)
            const canOfferSorted = canOffer
              .map(ms => ({
                ...ms,
                saturation: (holderCount[ms.id] ?? 0) / members.length,
              }))
              .sort((a, b) => b.saturation - a.saturation)
              .map(({ saturation, ...s }) => s)

            return {
              userId: m.userId,
              name: m.name,
              quantity: m.qty[s.id],
              canOffer: canOfferSorted,
              canOfferWithSaturation: canOfferSorted.map(ms => ({
                ...ms,
                saturation: (holderCount[ms.id] ?? 0) / members.length,
              })),
            }
          }),
      }))
  }, [me, others, members])

  const filteredAvailable = useMemo(() => {
    if (!filter.trim()) return available
    const q = filter.toLowerCase()
    return available.filter(({ sticker }) =>
      sticker.id.toLowerCase().includes(q) ||
      String(sticker.number).includes(q) ||
      sticker.name.toLowerCase().includes(q) ||
      sticker.code.toLowerCase().includes(q)
    )
  }, [available, filter])

  const smartTrade = useMemo((): SmartTrade | null => {
    if (!me || !selectedMemberId) return null
    const them = members.find(m => m.userId === selectedMemberId)
    if (!them) return null

    const iCanGive = ALL_STICKERS.filter(
      s => (me.qty[s.id] ?? 0) >= 2 && (them.qty[s.id] ?? 0) === 0
    )

    const iCanGet = ALL_STICKERS.filter(
      s => (them.qty[s.id] ?? 0) >= 2 && (me.qty[s.id] ?? 0) === 0
    )

    // Calcular saturação: quantas pessoas no grupo têm cada figurinha
    const holderCount: Record<string, number> = {}
    members.forEach(member => {
      ALL_STICKERS.forEach(sticker => {
        if ((member.qty[sticker.id] ?? 0) >= 1) {
          holderCount[sticker.id] = (holderCount[sticker.id] ?? 0) + 1
        }
      })
    })

    // Stickers ordenadas por saturação no grupo (mais saturadas primeiro)
    // Saturação = % de pessoas que têm a figurinha
    const iCanGiveWithRarity = iCanGive
      .map(s => ({
        ...s,
        rarity: (holderCount[s.id] ?? 0) / members.length,
      }))
      .sort((a, b) => b.rarity - a.rarity) // Ordenar por saturação decrescente

    // Máximo de trocas = mín(que posso dar, que posso receber)
    const maxTrades = Math.min(iCanGive.length, iCanGet.length)

    return {
      member: them,
      iCanGive: iCanGiveWithRarity,
      iCanGet,
      maxTrades,
    }
  }, [me, members, selectedMemberId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-green-600" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('available')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'available' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search size={15} />
          <span>Quero conseguir</span>
          {available.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {available.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('smart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'smart' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowLeftRight size={15} />
          <span>Troca com amigo</span>
        </button>
      </div>

      {/* Tab 1: Available stickers I can get */}
      {tab === 'available' && (
        <div className="space-y-3">
          {available.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Package className="mx-auto mb-3 text-gray-200" size={40} />
              <p className="font-medium text-gray-500">Nenhuma figurinha disponível para você</p>
              <p className="text-sm text-gray-400 mt-1">
                Quando alguém tiver repetidas que você precisa, aparecerão aqui
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Filtrar por time, número ou código..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <p className="text-xs text-gray-400 px-1">
                {filteredAvailable.length} figurinha(s) que você precisa disponíveis no grupo
              </p>

              <div className="space-y-2">
                {filteredAvailable.map(({ sticker, holders }) => {
                  const isOpen = expandedSticker === sticker.id
                  return (
                    <div key={sticker.id} className="bg-white rounded-xl border overflow-hidden">
                      <button
                        onClick={() => setExpandedSticker(isOpen ? null : sticker.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 font-mono text-sm font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                            #{sticker.number}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{sticker.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{sticker.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="green">
                            {holders.length} {holders.length === 1 ? 'pessoa' : 'pessoas'}
                          </Badge>
                          <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t divide-y">
                          {holders.map(holder => (
                            <div key={holder.userId} className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {holder.name[0]?.toUpperCase()}
                                </div>
                                <span className="font-semibold text-sm text-gray-900">{holder.name}</span>
                                <Badge variant="amber">+{holder.quantity - 1} repet.</Badge>
                              </div>

                              {holder.canOffer.length > 0 ? (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                    <ArrowLeftRight size={11} />
                                    O que você pode oferecer (ordenado por dificuldade):
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {holder.canOfferWithSaturation.map(s => {
                                      const saturationPercent = Math.round(s.saturation * 100)
                                      const isHighSaturation = saturationPercent >= 60
                                      return (
                                        <div key={s.id} className="relative group">
                                          <span
                                            className={`text-xs font-mono px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                                              isHighSaturation
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400'
                                                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:border-orange-400'
                                            }`}
                                            title={`${s.name} (${saturationPercent}% do grupo tem)`}
                                          >
                                            {s.id}
                                            {isHighSaturation && (
                                              <Flame size={10} className="text-amber-600" />
                                            )}
                                          </span>
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            {saturationPercent}% tem
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  Você não tem repetidas que {holder.name.split(' ')[0]} precisa agora.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Smart trade with a specific member */}
      {tab === 'smart' && (
        <div className="space-y-4">
          {others.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Users className="mx-auto mb-3 text-gray-200" size={40} />
              <p className="font-medium text-gray-500">Nenhum outro membro no grupo ainda</p>
              <p className="text-sm text-gray-400 mt-1">Compartilhe o código de convite com seus amigos</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar amigo</label>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Escolha uma pessoa do grupo...</option>
                  {others.map(m => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>

              {smartTrade && (
                <div className="space-y-3">
                  {/* Summary bar */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Troca com {smartTrade.member.name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Possível fazer até {smartTrade.maxTrades} troca{smartTrade.maxTrades !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="green">{smartTrade.maxTrades}</Badge>
                  </div>

                  {/* I can give */}
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 bg-green-50 border-b flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-green-800">
                          Posso dar para {smartTrade.member.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Ordenadas por saturação (priorizar as mais comuns)
                        </p>
                      </div>
                      <Badge variant="green">{smartTrade.iCanGive.length}</Badge>
                    </div>
                    {smartTrade.iCanGive.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-5">
                        Nenhuma repetida que {smartTrade.member.name.split(' ')[0]} precisa
                      </p>
                    ) : (
                      <div className="p-3 flex flex-wrap gap-2">
                        {smartTrade.iCanGive.map((s, idx) => {
                          const saturationPercent = Math.round(s.rarity * 100)
                          const isHighSaturation = saturationPercent >= 60
                          return (
                            <div key={s.id} className="relative group">
                              <span
                                className={`text-xs font-mono px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                  isHighSaturation
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400 hover:bg-amber-100'
                                    : 'bg-green-50 text-green-700 border border-green-200 hover:border-green-400 hover:bg-green-100'
                                }`}
                                title={`${s.name} (${saturationPercent}% do grupo tem)`}
                              >
                                {s.id}
                                {isHighSaturation && (
                                  <Flame size={12} className="text-amber-600" />
                                )}
                              </span>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {saturationPercent}% do grupo tem
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* I can get */}
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-blue-800">
                          Posso pegar de {smartTrade.member.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Repetidas de {smartTrade.member.name.split(' ')[0]} que eu não tenho
                        </p>
                      </div>
                      <Badge variant="blue">{smartTrade.iCanGet.length}</Badge>
                    </div>
                    {smartTrade.iCanGet.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-5">
                        {smartTrade.member.name.split(' ')[0]} não tem repetidas que você precisa
                      </p>
                    ) : (
                      <div className="p-3 flex flex-wrap gap-1.5">
                        {smartTrade.iCanGet.map(s => (
                          <span
                            key={s.id}
                            className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg"
                            title={s.name}
                          >
                            {s.id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
