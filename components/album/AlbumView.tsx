'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { upsertSticker } from '@/app/actions/stickers'
import { ALL_STICKERS, GROUPS, TEAMS, StickerDef } from '@/lib/stickers'
import { getEmojiForSticker } from '@/lib/flagEmojis'
import { TeamSection } from './TeamSection'
import { ProgressBar } from './ProgressBar'
import { AlbumSummary } from './AlbumSummary'
import { QuantityMap } from '@/lib/types'

type StatusFilter = 'all' | 'missing' | 'duplicates'

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function matchesQuery(sticker: StickerDef, query: string): boolean {
  if (!query) return true
  const q = query.trim().toLowerCase()
  if (!q) return true
  const flag = getEmojiForSticker(sticker.code)
  return (
    sticker.id.toLowerCase().includes(q) ||
    sticker.code.toLowerCase().includes(q) ||
    sticker.name.toLowerCase().includes(q) ||
    String(sticker.sequentialId).includes(q) ||
    String(sticker.number).includes(q) ||
    pad2(sticker.number).includes(q) ||
    (!!flag && flag.includes(query.trim()))
  )
}

interface AlbumViewProps {
  initialQuantities: QuantityMap
  onQuantitiesChange?: (quantities: QuantityMap) => void
}

export function AlbumView({ initialQuantities, onQuantitiesChange }: AlbumViewProps) {
  const [quantities, setQuantities] = useState<QuantityMap>(initialQuantities)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const matchesStatus = useCallback(
    (sticker: StickerDef) => {
      const qty = quantities[sticker.id] ?? 0
      if (status === 'missing') return qty === 0
      if (status === 'duplicates') return qty >= 2
      return true
    },
    [quantities, status]
  )

  const filterStickers = useCallback(
    (list: StickerDef[]) => list.filter(s => matchesQuery(s, search) && matchesStatus(s)),
    [search, matchesStatus]
  )

  const isFiltering = search.trim() !== '' || status !== 'all'

  const totalMatches = useMemo(
    () => (isFiltering ? ALL_STICKERS.filter(s => matchesQuery(s, search) && matchesStatus(s)).length : 0),
    [search, matchesStatus, isFiltering]
  )

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

  // FWC stickers (filtered + full)
  const fwcIntroAll = ALL_STICKERS.filter(s => s.section === 'fwc' && s.number <= 8)
  const fwcHistoryAll = ALL_STICKERS.filter(s => s.section === 'fwc' && s.number >= 9)
  const fwcIntro = filterStickers(fwcIntroAll)
  const fwcHistory = filterStickers(fwcHistoryAll)
  const fwcAll = ALL_STICKERS.filter(s => s.section === 'fwc')
  const fwcHave = fwcAll.filter(s => (quantities[s.id] ?? 0) >= 1).length

  const ccAll = ALL_STICKERS.filter(s => s.section === 'coca_cola')
  const ccStickers = filterStickers(ccAll)
  const ccHave = ccAll.filter(s => (quantities[s.id] ?? 0) >= 1).length

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
    { label: 'Coca-Cola', have: ccHave, total: ccAll.length },
  ]

  const fullStickersOf = (code: string): StickerDef[] =>
    ALL_STICKERS.filter(s => s.code === code)
  const stickersOf = (code: string): StickerDef[] => filterStickers(fullStickersOf(code))

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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar país, sigla, número ou #seq..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'missing', 'duplicates'] as const).map(opt => {
            const label = opt === 'all' ? 'Todas' : opt === 'missing' ? 'Faltantes' : 'Repetidas'
            const active = status === opt
            return (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? opt === 'missing'
                      ? 'bg-gray-700 text-white'
                      : opt === 'duplicates'
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            )
          })}
          {isFiltering && (
            <span className="text-xs text-gray-500 ml-auto tabular-nums">
              {totalMatches} {totalMatches === 1 ? 'figurinha' : 'figurinhas'}
            </span>
          )}
        </div>
      </div>

      {!isFiltering && (
        <>
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
        </>
      )}

      {isFiltering && totalMatches === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Nenhuma figurinha encontrada com esses filtros.
        </div>
      )}

      {/* FWC */}
      {(fwcIntro.length > 0 || fwcHistory.length > 0) && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">FWC</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {fwcIntro.length > 0 && (
              <TeamSection
                code="FWC"
                name="Página Inicial"
                group={null}
                stickers={fwcIntro}
                fullStickers={fwcIntroAll}
                quantities={quantities}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            )}
            {fwcHistory.length > 0 && (
              <TeamSection
                code="FWC"
                name="FIFA World Cup History"
                group={null}
                stickers={fwcHistory}
                fullStickers={fwcHistoryAll}
                quantities={quantities}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            )}
          </div>
        </section>
      )}

      {/* Groups */}
      {GROUPS.map(grp => {
        const teams = TEAMS.filter(t => t.group === grp)
        const teamsWithStickers = teams
          .map(team => ({ team, stickers: stickersOf(team.code) }))
          .filter(({ stickers }) => stickers.length > 0)
        if (teamsWithStickers.length === 0) return null

        const progress = groupProgress.find(gp => gp.grp === grp)!
        const pct = progress.total === 0 ? 0 : Math.round((progress.have / progress.total) * 100)
        return (
          <section key={grp}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Grupo {grp}
              </h3>
              {!isFiltering && (
                <span className="text-xs text-gray-500 font-mono">
                  {progress.have}/{progress.total} ({pct}%)
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {teamsWithStickers.map(({ team, stickers }) => (
                <TeamSection
                  key={team.code}
                  code={team.code}
                  name={team.name}
                  group={team.group}
                  stickers={stickers}
                  fullStickers={fullStickersOf(team.code)}
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
      {ccStickers.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Coca-Cola</h3>
          <TeamSection
            code="CC"
            name="Coca-Cola"
            group={null}
            stickers={ccStickers}
            fullStickers={ccAll}
            quantities={quantities}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </section>
      )}
    </div>
  )
}
