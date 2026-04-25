'use client'

import { useState, useTransition } from 'react'
import { findTradersForSticker } from '@/app/actions/stickers'
import { GROUPS, TEAMS, ALL_STICKERS } from '@/lib/stickers'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Users, ArrowLeftRight } from 'lucide-react'

interface Trader {
  user_id: string
  name: string
  quantity: number
  canOffer: string[]
}

interface TradeSearchProps {
  groupId: string
}

export function TradeSearch({ groupId }: TradeSearchProps) {
  const [group, setGroup] = useState('')
  const [team, setTeam] = useState('')
  const [number, setNumber] = useState('')
  const [traders, setTraders] = useState<Trader[] | null>(null)
  const [searched, setSearched] = useState('')
  const [isPending, startTransition] = useTransition()

  const teams = group ? TEAMS.filter(t => t.group === group) : []
  const numbers = team
    ? ALL_STICKERS.filter(s => s.code === team).map(s => s.number)
    : []

  function handleSearch() {
    if (!team || !number) return
    const stickerId = ALL_STICKERS.find(s => s.code === team && s.number === Number(number))?.id
    if (!stickerId) return

    startTransition(async () => {
      const result = await findTradersForSticker(groupId, stickerId)
      setTraders(result)
      setSearched(stickerId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Qual figurinha você está procurando?</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={group}
            onChange={e => { setGroup(e.target.value); setTeam(''); setNumber('') }}
            className="flex-1 min-w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seção</option>
            <option value="FWC">FWC</option>
            {GROUPS.map(g => <option key={g} value={g}>Grupo {g}</option>)}
            <option value="CC">Coca-Cola</option>
          </select>

          <select
            value={team}
            onChange={e => { setTeam(e.target.value); setNumber('') }}
            disabled={!group}
            className="flex-1 min-w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
          >
            <option value="">Time</option>
            {group === 'FWC' ? (
              <option value="FWC">FWC</option>
            ) : group === 'CC' ? (
              <option value="CC">Coca-Cola</option>
            ) : (
              teams.map(t => <option key={t.code} value={t.code}>{t.name}</option>)
            )}
          </select>

          <select
            value={number}
            onChange={e => setNumber(e.target.value)}
            disabled={!team}
            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
          >
            <option value="">#</option>
            {(team === 'FWC'
              ? Array.from({ length: 20 }, (_, i) => i)
              : numbers
            ).map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <Button onClick={handleSearch} disabled={!number || isPending}>
            {isPending ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      {traders !== null && (
        <div>
          {traders.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-500">
              <Users className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="font-medium">Ninguém tem essa figurinha para trocar</p>
              <p className="text-sm mt-1">no grupo no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{traders.length}</span> {traders.length === 1 ? 'pessoa tem' : 'pessoas têm'}{' '}
                <span className="font-mono text-green-700">{searched}</span> disponível para troca:
              </p>
              {traders.map(trader => (
                <div key={trader.user_id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                        {trader.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{trader.name}</span>
                    </div>
                    <Badge variant="amber">+{trader.quantity - 1} repet.</Badge>
                  </div>

                  {trader.canOffer.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <ArrowLeftRight size={12} />
                        <span>Suas repetidas que {trader.name.split(' ')[0]} não tem:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {trader.canOffer.map(id => (
                            <span key={id} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-mono">
                              {id}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Você não tem repetidas que ele/ela precisa no momento.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
