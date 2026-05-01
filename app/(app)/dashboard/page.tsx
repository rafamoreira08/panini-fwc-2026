'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlbumView } from '@/components/album/AlbumView'
import { Users, Plus, BookOpen, Loader, Share2 } from 'lucide-react'
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
          <h1 className="text-3xl font-bold text-gray-900">📖 Meu Álbum</h1>
          <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            + Novo álbum
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">Seu álbum pessoal compartilhado com todos os seus grupos</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-green-600">{albumStats.have}</span>
                <span className="text-xl text-gray-600">de {albumStats.total}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Progresso</p>
              <p className="text-4xl font-bold text-blue-600">{albumPercentage}%</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.max(2, albumPercentage)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{albumStats.total - albumStats.have}</span> para completar
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              <span className="font-semibold text-amber-600">{albumStats.dupes}</span> repetidas para trocar
            </span>
          </div>
        </div>
      </div>

      {/* Album View */}
      <AlbumView initialQuantities={quantities} />
    </div>
  )
}
