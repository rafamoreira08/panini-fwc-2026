'use client'

import { useState, useTransition, useEffect } from 'react'
import { getMyDuplicatesWithNeeders } from '@/app/actions/stickers'
import { STICKER_MAP } from '@/lib/stickers'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown, ChevronUp, Repeat2 } from 'lucide-react'

interface DupeEntry {
  sticker_id: string
  quantity: number
  needers: { user_id: string; name: string }[]
}

export function MyDuplicates({ groupId }: { groupId: string }) {
  const [dupes, setDupes] = useState<DupeEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const result = await getMyDuplicatesWithNeeders(groupId)
      setDupes(result)
      setLoaded(true)
    })
  }, [groupId])

  if (isPending && !loaded) {
    return <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
  }

  if (dupes.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-500">
        <Repeat2 className="mx-auto mb-2 text-gray-300" size={32} />
        <p className="font-medium">Você não tem figurinhas repetidas</p>
        <p className="text-sm mt-1">Marque duplicatas no álbum para aparecerem aqui</p>
      </div>
    )
  }

  // Group by team
  const byTeam: Record<string, DupeEntry[]> = {}
  for (const d of dupes) {
    const s = STICKER_MAP.get(d.sticker_id)
    const key = s?.code ?? 'Outro'
    if (!byTeam[key]) byTeam[key] = []
    byTeam[key].push(d)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Você tem <span className="font-semibold text-amber-600">{dupes.length}</span> figurinha(s) repetida(s) disponíveis para troca.
      </p>

      {Object.entries(byTeam).map(([teamCode, items]) => {
        const teamName = STICKER_MAP.get(items[0].sticker_id)?.name ?? teamCode
        return (
          <div key={teamCode} className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <span className="font-semibold text-sm text-gray-700">{teamName}</span>
              <span className="text-xs text-gray-400 ml-2 font-mono">{teamCode}</span>
            </div>
            <div className="divide-y">
              {items.map(item => {
                const s = STICKER_MAP.get(item.sticker_id)
                const isExpanded = expanded === item.sticker_id
                const extraCount = item.quantity - 1

                return (
                  <div key={item.sticker_id}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.sticker_id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          #{s?.number ?? '?'}
                        </span>
                        <span className="text-sm text-gray-700">{item.sticker_id}</span>
                        <Badge variant="amber">+{extraCount}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.needers.length > 0 ? (
                          <Badge variant="green">{item.needers.length} precisam</Badge>
                        ) : (
                          <Badge variant="gray">0 precisam</Badge>
                        )}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {isExpanded && item.needers.length > 0 && (
                      <div className="px-4 pb-3 pt-0">
                        <p className="text-xs text-gray-500 mb-2">Pessoas que precisam dessa figurinha:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.needers.map(n => (
                            <div
                              key={n.user_id}
                              className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full text-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[10px] font-bold">
                                {n.name[0]?.toUpperCase()}
                              </div>
                              <span className="text-green-800 font-medium">{n.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
