'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { joinGroupByCode } from '@/app/actions/groups'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Loader } from 'lucide-react'

export default function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params)
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const auth = getFirebaseAuth()
        await auth.authStateReady()
        const user = auth.currentUser
        if (!user) {
          router.push(`/login?next=/join/${inviteCode}`)
          return
        }
        const token = await user.getIdToken()

        const res = await fetch('/api/groups/lookup-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, inviteCode }),
        })

        if (!res.ok) {
          setInvalid(true)
          setLoading(false)
          return
        }

        const data = await res.json()
        if (data.invalid || !data.groupId) {
          setInvalid(true)
          setLoading(false)
          return
        }
        if (data.isMember) {
          router.push(`/groups/${data.groupId}`)
          return
        }

        setGroupName(data.name || '')
        setLoading(false)
      } catch (err) {
        console.error('[JoinPage] load error:', err)
        setInvalid(true)
        setLoading(false)
      }
    }
    load()
  }, [inviteCode, router])

  async function handleJoin() {
    setJoining(true)
    try {
      const groupId = await joinGroupByCode(inviteCode)
      router.push(`/groups/${groupId}`)
    } catch (err: any) {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite inválido</h1>
          <p className="text-gray-600 mb-6">Este link de convite não existe, expirou ou já foi usado.</p>
          <Link href="/dashboard">
            <Button size="lg">Ir para meus grupos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-sm w-full">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <span className="text-4xl">⚽</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Você foi convidado!</h1>
            <p className="text-gray-600">
              Junte-se ao grupo <br />
              <span className="font-bold text-green-700 text-lg">{groupName}</span>
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800">
              ✓ Você poderá compartilhar seu álbum e fazer trocas com outros membros
            </p>
          </div>

          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'Entrando...' : 'Entrar no grupo'}
            </Button>
            <Link href="/dashboard" className="block">
              <button className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2">
                Cancelar
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
