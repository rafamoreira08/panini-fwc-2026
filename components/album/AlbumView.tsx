'use client'

import { useState, useCallback, useRef } from 'react'
import { upsertSticker } from '@/app/actions/stickers'
import { ALL_STICKERS, GROUPS, TEAMS, StickerDef } from '@/lib/stickers'
import { TeamSection } from './TeamSection'
import { ProgressBar } from './ProgressBar'
import { QuantityMap } from '@/lib/types'

interface AlbumViewProps {
  groupId: string
  initialQuantities: QuantityMap
}

export function AlbumView({ groupId, initialQuantities }: AlbumViewProps) {
  const [quantities, setQuantities] = useState<QuantityMap>(initialQuantities)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const persist = useCallback(
    (stickerId: string, qty: number) => {
      clearTimeout(timers.current[stickerId])
      timers.current[stickerId] = setTimeout(() => {
        upsertSticker(groupId, stickerId, qty).catch(console.error)
      }, 400)
    },
    [groupId]
  )

  const onIncrement = useCallback(
    (id: string) => {
      setQuantities(prev => {
        const next = (prev[id] ?? 0) + 1
        persist(id, next)
        return { ...prev, [id]: next }
      })
    },
    [persist]
  )

  const onDecrement = useCallback(
    (id: string) => {
      setQuantities(prev => {
        const current = prev[id] ?? 0
        if (current === 0) return prev
        const next = current - 1
        persist(id, next)
        return { ...prev, [id]: next }
      })
    },
    [persist]
  )

  const totalHave = ALL_STICKERS.filter(s => (quantities[s.id] ?? 0) >= 1).length
  const totalDupes = ALL_STICKERS.filter(s => (quantities[s.id] ?? 0) >= 2).length

  // FWC stickers
  const fwcIntro = ALL_STICKERS.filter(s => s.section === 'fwc' && s.number <= 8)
  const fwcHistory = ALL_STICKERS.filter(s => s.section === 'fwc' && s.number >= 9)
  const ccStickers = ALL_STICKERS.filter(s => s.section === 'coca_cola')

  const stickersOf = (code: string): StickerDef[] =>
    ALL_STICKERS.filter(s => s.code === code)

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Progresso geral</h2>
          <div className="flex gap-3 text-sm">
            <span className="text-green-600 font-medium">{totalHave} completas</span>
            <span className="text-amber-600 font-medium">{totalDupes} repetidas</span>
          </div>
        </div>
        <ProgressBar have={totalHave} total={ALL_STICKERS.length} />
        <p className="text-xs text-gray-400 mt-2">
          Clique para marcar · Clique direito para desmarcar
        </p>
      </div>

      {/* FWC */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">FWC</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TeamSection
            code="FWC"
            name="Página Inicial"
            group={null}
            stickers={fwcIntro}
            quantities={quantities}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
          <TeamSection
            code="FWC"
            name="FIFA World Cup History"
            group={null}
            stickers={fwcHistory}
            quantities={quantities}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </div>
      </section>

      {/* Groups */}
      {GROUPS.map(grp => {
        const teams = TEAMS.filter(t => t.group === grp)
        return (
          <section key={grp}>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Grupo {grp}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map(team => (
                <TeamSection
                  key={team.code}
                  code={team.code}
                  name={team.name}
                  group={team.group}
                  stickers={stickersOf(team.code)}
                  quantities={quantities}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Coca-Cola */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Coca-Cola</h3>
        <TeamSection
          code="CC"
          name="Coca-Cola"
          group={null}
          stickers={ccStickers}
          quantities={quantities}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </section>
    </div>
  )
}
