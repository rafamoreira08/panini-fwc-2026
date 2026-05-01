'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

interface InviteSectionProps {
  inviteCode: string
}

export function InviteSection({ inviteCode }: InviteSectionProps) {
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`

  function copy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Convidar membros</h3>
          </div>
          <p className="text-sm text-gray-600">Compartilhe este link para adicionar pessoas ao grupo</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-white border border-blue-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono truncate">
          {inviteUrl}
        </div>
        <button
          onClick={copy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shrink-0 ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          }`}
        >
          {copied ? (
            <>
              <Check size={16} />
              <span className="hidden sm:inline">Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span className="hidden sm:inline">Copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
