'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

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
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-900 text-sm mb-1">Convidar membros</h3>
      <p className="text-xs text-gray-500 mb-3">Compartilhe o link abaixo para convidar pessoas para o grupo.</p>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">
          /join/{inviteCode}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
