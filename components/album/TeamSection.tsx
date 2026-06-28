'use client'

import { StickerCard } from './StickerCard'
import { StickerCardQuick } from './StickerCardQuick'
import { ProgressBar } from './ProgressBar'
import { StickerDef } from '@/lib/stickers'
import { getEmojiForSticker } from '@/lib/flagEmojis'
import { EditMethod } from '@/lib/types'
import { Check } from 'lucide-react'

interface TeamSectionProps {
  code: string
  name: string
  group: string | null
  stickers: StickerDef[]
  quantities: Record<string, number>
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  /** Optional full sticker list — when set (e.g. when stickers is a filtered subset), progress is computed against it instead of the filtered list. */
  fullStickers?: StickerDef[]
  editMethod?: EditMethod
}

export function TeamSection({ code, name, group, stickers, quantities, onIncrement, onDecrement, fullStickers, editMethod = 'safe' }: TeamSectionProps) {
  const progressList = fullStickers ?? stickers
  const have = progressList.filter(s => (quantities[s.id] ?? 0) >= 1).length
  const total = progressList.length
  const isComplete = have === total && total > 0
  const flag = getEmojiForSticker(code)

  return (
    <div className={`rounded-lg border transition-all ${
      isComplete
        ? 'bg-gradient-to-br from-green-50 to-green-50 border-green-300 shadow-sm'
        : 'bg-white border-gray-200 shadow-xs'
    }`}>
      <div className="p-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {group && (
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">
                Grupo {group}
              </span>
            )}
            {flag && (
              <span className="text-2xl shrink-0 leading-none" aria-hidden>{flag}</span>
            )}
            <div className="min-w-0">
              <h4 className={`font-display font-bold uppercase text-sm tracking-tight transition-colors ${
                isComplete ? 'text-green-700' : 'text-gray-900'
              }`}>
                {name}
              </h4>
              <p className="text-xs text-gray-400 font-mono">{code}</p>
            </div>
          </div>

          {isComplete ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-full text-xs font-display font-bold uppercase tracking-wide shrink-0">
              <Check size={13} />
              <span>Completo</span>
            </div>
          ) : (
            <div className="text-right text-xs text-gray-500 shrink-0">
              <div className="font-mono font-bold text-gray-700">{have}/{total}</div>
              <div className="text-green-600 font-bold">{Math.round((have / total) * 100)}%</div>
            </div>
          )}
        </div>
      </div>

      {!isComplete && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <ProgressBar have={have} total={total} size="sm" />
        </div>
      )}

      <div className="p-4 flex flex-wrap gap-2">
        {stickers.map(s =>
          editMethod === 'safe' ? (
            <StickerCard
              key={s.id}
              stickerId={s.id}
              number={s.number}
              sequentialId={s.sequentialId}
              quantity={quantities[s.id] ?? 0}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ) : (
            <StickerCardQuick
              key={s.id}
              stickerId={s.id}
              number={s.number}
              sequentialId={s.sequentialId}
              quantity={quantities[s.id] ?? 0}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          )
        )}
      </div>
    </div>
  )
}
