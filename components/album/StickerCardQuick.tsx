'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const AUTO_CLOSE_MS = 3000
const LONG_PRESS_MS = 450
const MOVE_TOLERANCE = 10
const TAP_COOLDOWN_MS = 250

interface StickerCardQuickProps {
  stickerId: string
  number: number
  sequentialId: number
  quantity: number
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  showSequential?: boolean
}

export function StickerCardQuick({
  stickerId,
  number,
  sequentialId,
  quantity,
  onIncrement,
  onDecrement,
  showSequential = false,
}: StickerCardQuickProps) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const gestureRef = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout>; longPress: boolean } | null>(null)
  const lastTapRef = useRef(0)

  const missing = quantity === 0
  const duplicate = quantity >= 2

  function scheduleAutoClose() {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpen(false), AUTO_CLOSE_MS)
  }

  function close() {
    clearTimeout(closeTimerRef.current)
    setOpen(false)
  }

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  function endGesture() {
    if (gestureRef.current) clearTimeout(gestureRef.current.timer)
    gestureRef.current = null
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (open) return // a tap while open just closes (handled in onPointerUp)

    const timer = setTimeout(() => {
      if (gestureRef.current) {
        gestureRef.current.longPress = true
        setOpen(true)
        scheduleAutoClose()
      }
    }, LONG_PRESS_MS)

    gestureRef.current = { x: e.clientX, y: e.clientY, timer, longPress: false }
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gestureRef.current
    if (!g || g.longPress) return
    if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > MOVE_TOLERANCE) {
      endGesture() // treat as scroll — no tap/long-press fires
    }
  }

  function onPointerUp() {
    if (open) {
      close()
      endGesture()
      return
    }

    const g = gestureRef.current
    if (g && !g.longPress) {
      const now = Date.now()
      if (now - lastTapRef.current > TAP_COOLDOWN_MS) {
        lastTapRef.current = now
        onIncrement(stickerId)
      }
    }
    endGesture()
  }

  function onPointerCancel() {
    endGesture()
  }

  return (
    <div className="relative">
      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-20" onClick={close} />

          {/* floating stepper */}
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 px-3 py-2"
            onPointerDown={e => e.stopPropagation()}
          >
            <button
              className="w-11 h-11 rounded-xl bg-red-50 text-red-600 text-2xl font-bold flex items-center justify-center active:bg-red-200 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:active:bg-red-50"
              onClick={e => {
                e.stopPropagation()
                if (quantity > 0) {
                  onDecrement(stickerId)
                  scheduleAutoClose()
                }
              }}
              disabled={quantity === 0}
              aria-label="Remover 1"
            >
              −
            </button>
            <span className="w-9 text-center text-lg font-bold text-gray-800 tabular-nums">
              {quantity}
            </span>
            <button
              className="w-11 h-11 rounded-xl bg-green-50 text-green-600 text-2xl font-bold flex items-center justify-center active:bg-green-200 hover:bg-green-100 transition-colors"
              onClick={e => {
                e.stopPropagation()
                onIncrement(stickerId)
                scheduleAutoClose()
              }}
              aria-label="Adicionar 1"
            >
              +
            </button>
          </div>
        </>
      )}

      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
        aria-label={`${stickerId} (#${sequentialId}) — ${missing ? 'Falta' : quantity === 1 ? 'Tenho' : `${quantity - 1} repetida(s)`}`}
        className={cn(
          'relative w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold border-2 transition-colors duration-150 select-none touch-manipulation cursor-pointer',
          {
            'bg-gray-100 border-gray-200 text-gray-400': missing && !open,
            'bg-green-50 border-green-400 text-green-700': quantity === 1 && !open,
            'bg-amber-50 border-amber-400 text-amber-700': duplicate && !open,
            'ring-2 ring-offset-1 ring-blue-400': open,
          }
        )}
        title={`${stickerId} (#${sequentialId})`}
      >
        <span className="leading-tight text-[10px]">{showSequential ? sequentialId : stickerId.split('-')[1]}</span>
        <span className="text-[7px] opacity-60 leading-none">{showSequential ? `#${sequentialId}` : '#' + sequentialId}</span>
        {duplicate && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none pointer-events-none">
            +{quantity - 1}
          </span>
        )}
      </button>
    </div>
  )
}
