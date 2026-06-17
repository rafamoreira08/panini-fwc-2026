'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlbumView } from '@/components/album/AlbumView'
import { DuplicatesManager } from '@/components/album/DuplicatesManager'
import { MissingManager } from '@/components/album/MissingManager'
import { Loader } from 'lucide-react'
import { upsertSticker } from '@/app/actions/stickers'
import { ALL_STICKERS } from '@/lib/stickers'
import { QuantityMap } from '@/lib/types'
import { getFirebaseAuth } from '@/lib/firebase/client'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [albumStats, setAlbumStats] = useState({ have: 0, total: ALL_STICKERS.length, dupes: 0, missing: 0 })
  const [quantities, setQuantities] = useState<QuantityMap>({})

  useEffect(() => {
    async function loadAlbum() {
      try {
        console.log('[Dashboard] Starting loadAlbum')
        const auth = getFirebaseAuth()
        console.log('[Dashboard] Auth initialized')
        await auth.authStateReady()
        console.log('[Dashboard] Auth ready')
        const user = auth.currentUser
        console.log('[Dashboard] Current user:', user?.uid)
        if (!user) {
          console.log('[Dashboard] No user, returning')
          return
        }

        const token = await user.getIdToken()
        console.log('[Dashboard] Got token, calling API...')

        const response = await fetch('/api/user-stickers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()
        console.log('[Dashboard] Loaded', Object.keys(result).length, 'stickers')
        setQuantities(result)
      } catch (err) {
        console.error('[Dashboard] Failed to load album:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
  }, [])

  // Atualizar stats em tempo real baseado em quantities
  useEffect(() => {
    let have = 0,
      dupes = 0
    for (const qty of Object.values(quantities)) {
      if (qty >= 1) have++
      if (qty >= 2) dupes += qty - 1
    }
    const missing = ALL_STICKERS.length - have
    setAlbumStats({ have, dupes, missing, total: ALL_STICKERS.length })
  }, [quantities])

  const handleDuplicateChange = useCallback((stickerId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [stickerId]: quantity }))
    upsertSticker(stickerId, quantity).catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  const albumPercentage = Math.round((albumStats.have / albumStats.total) * 100)

  return (
    <div className="space-y-8">
      {/* Main Album Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-gray-900">
            ⚽ Meu Álbum
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-5">
            Seu álbum pessoal compartilhado com todos os seus grupos
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-green-600 leading-none mb-1">
                {albumStats.have}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Tenho</p>
            </div>
            <div className="text-center border-l border-gray-100 lg:border-l-0 lg:border-x">
              <p className="font-display text-4xl font-bold text-blue-600 leading-none mb-1">
                {albumPercentage}%
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Progresso</p>
            </div>
            <div>
              <DuplicatesManager 
                quantities={quantities}
                onQuantityChange={handleDuplicateChange}
                duplicatesCount={albumStats.dupes}
              />
            </div>
            <div>
              <MissingManager 
                quantities={quantities}
                missingCount={albumStats.missing}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold">{albumStats.have} de {albumStats.total} figurinhas</span>
              <span className="font-semibold text-gray-400">{albumStats.missing} faltando</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(2, albumPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Album View */}
      <AlbumView initialQuantities={quantities} onQuantitiesChange={setQuantities} />
    </div>
  )
}
