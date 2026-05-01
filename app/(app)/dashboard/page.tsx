'use client'

import { useState, useEffect } from 'react'
import { AlbumView } from '@/components/album/AlbumView'
import { Loader } from 'lucide-react'
import { getUserStickers } from '@/app/actions/stickers'
import { ALL_STICKERS } from '@/lib/stickers'
import { QuantityMap } from '@/lib/types'
import { getFirebaseAuth } from '@/lib/firebase/client'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [albumStats, setAlbumStats] = useState({ have: 0, total: ALL_STICKERS.length, dupes: 0 })
  const [quantities, setQuantities] = useState<QuantityMap>({})

  useEffect(() => {
    async function loadAlbum() {
      try {
        const auth = getFirebaseAuth()
        await auth.authStateReady()
        const user = auth.currentUser
        if (!user) return

        const stickers = await getUserStickers(user.uid)
        let have = 0,
          dupes = 0
        for (const qty of Object.values(stickers)) {
          if (qty >= 1) have++
          if (qty >= 2) dupes++
        }
        setAlbumStats({ have, dupes, total: ALL_STICKERS.length })
        setQuantities(stickers)
      } catch (err) {
        console.error('Failed to load album:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-green-600 leading-none mb-1">
                {albumStats.have}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Tenho</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="font-display text-4xl font-bold text-blue-600 leading-none mb-1">
                {albumPercentage}%
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Progresso</p>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-amber-500 leading-none mb-1">
                {albumStats.dupes}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Repetidas</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold">{albumStats.have} de {albumStats.total} figurinhas</span>
              <span className="font-semibold text-gray-400">{albumStats.total - albumStats.have} faltando</span>
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
      <AlbumView initialQuantities={quantities} />
    </div>
  )
}
