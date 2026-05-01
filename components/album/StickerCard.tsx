'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

const LONG_PRESS_MS = 400

interface StickerCardProps {
  stickerId: string
  number: number
  quantity: number
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
}

export function StickerCard({ stickerId, number, quantity, onIncrement, onDecrement }: StickerCardProps) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const didLongPress = useRef(false)

  const missing = quantity === 0
  const duplicate = quantity >= 2

  function startPress() {
    didLongPress.current = false
    timerRef.current = setTimeout(() => {
      didLongPress.current = true
      setOpen(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30)
    }, LONG_PRESS_MS)
  }

  function cancelPress() {
    clearTimeout(timerRef.current)
  }

  function handlePointerUp() {
    cancelPress()
    if (!didLongPress.current) {
      onIncrement(stickerId)
    }
    didLongPress.current = false
  }

  return (
    <div className="relative">
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          {/* floating controls */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 px-3 py-2">
            <button
              className="w-10 h-10 rounded-xl bg-red-50 text-red-600 text-xl font-bold flex items-center justify-center active:bg-red-100 transition-colors"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDecrement(stickerId) }}
            >
              −
            </button>
            <span className="w-8 text-center text-base font-bold text-gray-800 tabular-nums">
              {quantity}
            </span>
            <button
              className="w-10 h-10 rounded-xl bg-green-50 text-green-600 text-xl font-bold flex items-center justify-center active:bg-green-100 transition-colors"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onIncrement(stickerId) }}
            >
              +
            </button>
          </div>
        </>
      )}

      <button
        onPointerDown={startPress}
        onPointerUp={handlePointerUp}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={e => { e.preventDefault(); onDecrement(stickerId) }}
        aria-label={`Figurinha ${number} — ${missing ? 'Falta' : quantity === 1 ? 'Tenho' : `${quantity - 1} repetida(s)`}`}
        className={cn(
          'relative w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-colors duration-150 select-none touch-manipulation cursor-pointer',
          {
            'bg-gray-100 border-gray-200 text-gray-400': missing,
            'bg-green-50 border-green-400 text-green-700': quantity === 1,
            'bg-amber-50 border-amber-400 text-amber-700': duplicate,
          }
        )}
      >
        {number}
        {duplicate && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none pointer-events-none">
            +{quantity - 1}
          </span>
        )}
      </button>
    </div>
  )
}
