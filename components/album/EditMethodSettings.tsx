'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Settings2, Check, Loader } from 'lucide-react'
import { EditMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

const METHODS: Array<{ id: EditMethod; title: string; description: string }> = [
  {
    id: 'safe',
    title: 'Método Seguro',
    description: 'Toque para abrir os botões − e +. Fecha sozinho depois de alguns segundos.',
  },
  {
    id: 'quick',
    title: 'Método Rápido',
    description: 'Toque rápido já soma 1. Segure para abrir e corrigir (remover ou ajustar).',
  },
  {
    id: 'quick_manual',
    title: 'Método Rápido + Salvar Manual',
    description: 'Mesmo toque/segure do Método Rápido, mas nada é enviado até você tocar em "Salvar".',
  },
]

interface EditMethodSettingsProps {
  value: EditMethod
  onChange: (method: EditMethod) => Promise<void>
}

export function EditMethodSettings({ value, onChange }: EditMethodSettingsProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState<EditMethod | null>(null)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const current = METHODS.find(m => m.id === value) ?? METHODS[0]

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSelect(method: EditMethod) {
    if (method === value || saving) return
    setSaving(method)
    setError('')
    try {
      await onChange(method)
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Falha ao trocar método')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors min-h-[40px] cursor-pointer"
        title="Método de edição"
      >
        <Settings2 size={18} />
        <span className="hidden lg:inline text-xs font-semibold max-w-[140px] truncate">{current.title}</span>
        <ChevronDown size={14} className={cn('text-gray-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 px-1 pb-1">Método de edição</p>
          {METHODS.map(method => {
            const selected = method.id === value
            const isSaving = saving === method.id
            return (
              <button
                key={method.id}
                onClick={() => handleSelect(method.id)}
                disabled={!!saving}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors touch-manipulation disabled:opacity-60',
                  selected ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                      selected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    )}
                  >
                    {isSaving ? (
                      <Loader size={11} className="text-white animate-spin" />
                    ) : selected ? (
                      <Check size={11} className="text-white" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{method.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                  </div>
                </div>
              </button>
            )
          })}

          {error && <p className="text-xs text-red-600 px-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
