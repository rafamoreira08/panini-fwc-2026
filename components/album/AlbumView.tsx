'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { upsertSticker } from '@/app/actions/stickers'
import { ALL_STICKERS, GROUPS, TEAMS, StickerDef } from '@/lib/stickers'
import { TeamSection } from './TeamSection'
import { ProgressBar } from './ProgressBar'
import { AlbumSummary } from './AlbumSummary'
import { QuantityMap } from '@/lib/types'

interface AlbumViewProps {
  initialQuantities: QuantityMap
  onQuantitiesChange?: (quantities: QuantityMap) => void
}

export function AlbumView({ initialQuantities, onQuantitiesChange }: AlbumViewProps) {
  const [quantities, setQuantities] = useState<QuantityMap>(initialQuantities)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Notificar pai quando quantities mudar
  useEffect(() => {
    onQuantitiesChange?.(quantities)
  }, [quantities, onQuantitiesChange])

  const persist = useCallback((stickerId: string, qty: number) => {
    clearTimeout(timers.current[stickerId])
    timers.current[stickerId] = setTimeout(() => {
      upsertSticker(stickerId, qty).catch(console.error)
    }, 400)
  }, [])

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
  const fwcAll = ALL_STICKERS.filter(s => s.section === 'fwc')
  const fwcHave = fwcAll.filter(s => (quantities[s.id] ?? 0) >= 1).length

  const ccStickers = ALL_STICKERS.filter(s => s.section === 'coca_cola')
  const ccHave = ccStickers.filter(s => (quantities[s.id] ?? 0) >= 1).length

  // Group progress
  const groupProgress = GROUPS.map(grp => {
    const teams = TEAMS.filter(t => t.group === grp)
    const groupStickers = ALL_STICKERS.filter(s => s.section === 'team' && teams.some(t => t.code === s.code))
    const have = groupStickers.filter(s => (quantities[s.id] ?? 0) >= 1).length
    return { grp, have, total: groupStickers.length }
  })

  // Summary sections for AlbumSummary
  const summaryData = [
    { label: 'FWC', have: fwcHave, total: fwcAll.length },
    ...groupProgress.map(gp => ({ label: `Grupo ${gp.grp}`, have: gp.have, total: gp.total })),
    { label: 'Coca-Cola', have: ccHave, total: ccStickers.length },
  ]

  const stickersOf = (code: string): StickerDef[] =>
    ALL_STICKERS.filter(s => s.code === code)

  return (
    <div className="space-y-6">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 p-3 rounded-b-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Progresso geral</span>
              <span className="text-xs font-mono text-gray-500">
                {totalHave}/{ALL_STICKERS.length}
              </span>
            </div>
            <ProgressBar have={totalHave} total={ALL_STICKERS.length} showLabel={false} size="sm" />
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">{totalHave}</div>
              <div className="text-gray-500">completas</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-amber-600">{totalDupes}</div>
              <div className="text-gray-500">repetidas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary by section */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">Resumo do Álbum</h2>
        <AlbumSummary sections={summaryData} />
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Progresso detalhado</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex flex-col items-end">
              <span className="text-gray-500 text-xs">Completas</span>
              <span className="text-green-600 font-bold">{totalHave}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-gray-500 text-xs">Repetidas</span>
              <span className="text-amber-600 font-bold">{totalDupes}</span>
            </span>
          </div>
        </div>
        <ProgressBar have={totalHave} total={ALL_STICKERS.length} />
        <p className="text-xs text-gray-400 mt-3">
          💡 Toque para marcar · Pressione e segure para ajustar quantidade
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
        const progress = groupProgress.find(gp => gp.grp === grp)!
        const pct = progress.total === 0 ? 0 : Math.round((progress.have / progress.total) * 100)
        return (
          <section key={grp}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Grupo {grp}
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                {progress.have}/{progress.total} ({pct}%)
              </span>
            </div>
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
