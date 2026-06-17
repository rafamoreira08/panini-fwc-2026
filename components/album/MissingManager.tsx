'use client'

import { useState } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { ALL_STICKERS } from '@/lib/stickers'
import { QuantityMap } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getEmojiForSticker } from '@/lib/flagEmojis'

interface MissingManagerProps {
  quantities: QuantityMap
  missingCount: number
}

export function MissingManager({ quantities, missingCount }: MissingManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const missing = ALL_STICKERS.filter(s => (quantities[s.id] ?? 0) === 0)
    .sort((a, b) => a.sequentialId - b.sequentialId)

  const handleCopyToClipboard = () => {
    const text = missing
      .map(s => {
        const emoji = getEmojiForSticker(s.code)
        return `${emoji} ${s.id} (#${s.sequentialId})`
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
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Faltando</p>
          <p className="text-2xl font-display font-bold text-gray-700">{missingCount}</p>
        </div>
        <ChevronDown
          size={20}
          className={cn('text-gray-600 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Panel */}
          <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-[400px] mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[70vh] flex flex-col overflow-hidden">
            {missing.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm font-semibold">
                ✅ Parabéns! Você completou o álbum!
              </div>
            ) : (
              <>
                {/* Header com botão de copiar */}
                <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 flex gap-2 shrink-0">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar Faltantes
                      </>
                    )}
                  </button>
                </div>

                {/* List */}
                <div className="divide-y overflow-y-auto">
                  {missing.map(sticker => {
                    const emoji = getEmojiForSticker(sticker.code)
                    return (
                      <div key={sticker.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                        <span className="text-xl shrink-0" aria-hidden>{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{sticker.id}</span>
                            <span className="text-[10px] leading-none bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                              #{sticker.sequentialId}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{sticker.name}</p>
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
