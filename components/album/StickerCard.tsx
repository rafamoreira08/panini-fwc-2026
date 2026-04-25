'use client'

import { cn } from '@/lib/utils'

interface StickerCardProps {
  stickerId: string
  number: number
  quantity: number
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
}

export function StickerCard({ stickerId, number, quantity, onIncrement, onDecrement }: StickerCardProps) {
  const missing = quantity === 0
  const duplicate = quantity >= 2

  return (
    <button
      onClick={() => onIncrement(stickerId)}
      onContextMenu={(e) => { e.preventDefault(); onDecrement(stickerId) }}
      title={`${stickerId} — ${missing ? 'Falta' : quantity === 1 ? 'Tenho' : `Repetida x${quantity - 1}`}\nClique para adicionar · Clique direito para remover`}
      className={cn(
        'relative w-10 h-10 rounded flex items-center justify-center text-xs font-bold border-2 transition-all select-none cursor-pointer',
        {
          'bg-gray-100 border-gray-200 text-gray-400': missing,
          'bg-green-50 border-green-400 text-green-700': quantity === 1,
          'bg-amber-50 border-amber-400 text-amber-700': duplicate,
        }
      )}
    >
      {number}
      {duplicate && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          +{quantity - 1}
        </span>
      )}
    </button>
  )
}
