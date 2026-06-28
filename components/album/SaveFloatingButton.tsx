'use client'

import { useEffect, useRef, useState } from 'react'
import { Save, Loader, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'saving' | 'success' | 'error'

interface SaveFloatingButtonProps {
  pendingCount: number
  onSave: () => Promise<void>
}

export function SaveFloatingButton({ pendingCount, onSave }: SaveFloatingButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (pendingCount > 0 && phase === 'success') setPhase('idle')
  }, [pendingCount, phase])

  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  async function handleClick() {
    if (phase === 'saving' || pendingCount === 0) return
    setPhase('saving')
    try {
      await onSave()
      setPhase('success')
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setPhase('idle'), 1500)
    } catch {
      setPhase('error')
    }
  }

  const visible = pendingCount > 0 || phase === 'saving' || phase === 'success' || phase === 'error'
  if (!visible) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50">
      <button
        onClick={handleClick}
        disabled={phase === 'saving' || pendingCount === 0}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm shadow-lg transition-colors touch-manipulation disabled:opacity-70',
          phase === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : phase === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
      >
        {phase === 'saving' && <Loader size={16} className="animate-spin" />}
        {phase === 'success' && <Check size={16} />}
        {phase === 'error' && <AlertCircle size={16} />}
        {phase === 'idle' && <Save size={16} />}
        <span>
          {phase === 'success'
            ? 'Salvo!'
            : phase === 'error'
            ? 'Tentar de novo'
            : phase === 'saving'
            ? 'Salvando...'
            : `Salvar (${pendingCount})`}
        </span>
      </button>
    </div>
  )
}
