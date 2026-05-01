'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/app/actions/groups'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      const groupId = await createGroup(name)
      router.push(`/groups/${groupId}`)
    } catch (err: any) {
      setError(err.message || 'Falha ao criar grupo')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6">
        <ArrowLeft size={18} />
        Voltar
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar grupo</h1>
          <p className="text-gray-600">
            Crie um grupo para conectar com amigos e colegas na busca pelas figurinhas.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl">👥</div>
              <div>
                <p className="font-semibold text-gray-900">Convide membros</p>
                <p className="text-sm text-gray-600">Compartilhe um código com amigos para que eles entrem</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">💱</div>
              <div>
                <p className="font-semibold text-gray-900">Faça trocas</p>
                <p className="text-sm text-gray-600">Negocie figurinhas e complete seu álbum juntos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <p className="font-semibold text-gray-900">Acompanhe progresso</p>
                <p className="text-sm text-gray-600">Veja quantas figurinhas cada membro tem</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do grupo
              </label>
              <Input
                name="name"
                required
                placeholder="Ex: Família Silva, Turma da Copa..."
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">O nome do seu grupo será visível para todos os membros</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Criando grupo...' : 'Criar grupo'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
