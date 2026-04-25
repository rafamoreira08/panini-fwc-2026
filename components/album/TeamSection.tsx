'use client'

import { StickerCard } from './StickerCard'
import { ProgressBar } from './ProgressBar'
import { StickerDef } from '@/lib/stickers'

interface TeamSectionProps {
  code: string
  name: string
  group: string | null
  stickers: StickerDef[]
  quantities: Record<string, number>
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
}

export function TeamSection({ code, name, group, stickers, quantities, onIncrement, onDecrement }: TeamSectionProps) {
  const have = stickers.filter(s => (quantities[s.id] ?? 0) >= 1).length

  return (
    <div className="bg-white rounded-xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {group && (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              G{group}
            </span>
          )}
          <span className="font-semibold text-gray-800 text-sm">{name}</span>
          <span className="text-xs text-gray-400 font-mono">{code}</span>
        </div>
      </div>
      <ProgressBar have={have} total={stickers.length} />
      <div className="flex flex-wrap gap-1 mt-2">
        {stickers.map(s => (
          <StickerCard
            key={s.id}
            stickerId={s.id}
            number={s.number}
            quantity={quantities[s.id] ?? 0}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        ))}
      </div>
    </div>
  )
}
