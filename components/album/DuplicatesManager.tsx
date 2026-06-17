'use client'

import { useState } from 'react'
import { ChevronDown, Minus, Plus, Copy, Check } from 'lucide-react'
import { ALL_STICKERS } from '@/lib/stickers'
import { QuantityMap } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getEmojiForSticker } from '@/lib/flagEmojis'

interface DuplicatesManagerProps {
  quantities: QuantityMap
  onQuantityChange: (stickerId: string, quantity: number) => void
  duplicatesCount: number
}

export function DuplicatesManager({ quantities, onQuantityChange, duplicatesCount }: DuplicatesManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const duplicates = ALL_STICKERS.filter(s => (quantities[s.id] ?? 0) >= 2)
    .map(s => ({
      ...s,
      quantity: quantities[s.id] ?? 0,
    }))
    .sort((a, b) => a.sequentialId - b.sequentialId)

  const handleDecrement = (stickerId: string, currentQty: number) => {
    if (currentQty > 0) {
      onQuantityChange(stickerId, currentQty - 1)
    }
  }

  const handleIncrement = (stickerId: string, currentQty: number) => {
    onQuantityChange(stickerId, currentQty + 1)
  }

  const handleCopyToClipboard = () => {
    const text = duplicates
      .map(s => {
        const emoji = getEmojiForSticker(s.code)
        const reps = s.quantity - 1
        return `${emoji} ${s.id} (#${s.sequentialId}) - ${reps} ${reps === 1 ? 'repetida' : 'repetidas'}`
      })
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Repetidas</p>
          <p className="text-2xl font-display font-bold text-amber-700">{duplicatesCount}</p>
        </div>
        <ChevronDown
          size={20}
          className={cn('text-amber-600 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {duplicates.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Você não tem figurinhas repetidas ainda
              </div>
            ) : (
              <>
                {/* Header com botão de copiar */}
                <div className="sticky top-0 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200 flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar para WhatsApp
                      </>
                    )}
                  </button>
                </div>

                {/* List */}
                <div className="divide-y">
                  {duplicates.map(sticker => {
                    const emoji = getEmojiForSticker(sticker.code)
                    const reps = sticker.quantity - 1
                    return (
                      <div key={sticker.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{emoji}</span>
                            <span className="text-sm font-bold text-gray-900">{sticker.id}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                              #{sticker.sequentialId}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{sticker.name}</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleDecrement(sticker.id, sticker.quantity)}
                            className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Remover 1"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-sm font-bold w-8 text-center">{sticker.quantity}</span>
                          <button
                            onClick={() => handleIncrement(sticker.id, sticker.quantity)}
                            className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                            title="Adicionar 1"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
