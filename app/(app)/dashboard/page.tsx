'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Plus, BookOpen, Loader } from 'lucide-react'
import { getUserGroups, joinGroup } from '@/app/actions/groups'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
  inviteCode: string
  createdBy: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<(Group & { memberCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGroups() {
      try {
        const userGroups = (await getUserGroups()) as Group[]

        // Get member counts
        const groupsWithCounts = await Promise.all(
          userGroups.map(async g => {
            const q = query(collection(firestore, 'groupMembers'), where('groupId', '==', g.id))
            const snapshot = await getDocs(q)
            return { ...g, memberCount: snapshot.size }
          })
        )

        setGroups(groupsWithCounts)
      } catch (err) {
        console.error('Failed to load groups:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await joinGroup(inviteCode)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar no grupo')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus grupos</h1>
        <Link href="/groups/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> Novo grupo
          </Button>
        </Link>
      </div>

      {/* Join by code */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Entrar em um grupo</h2>
        <form onSubmit={handleJoin} className="flex gap-2">
          <Input
            placeholder="Código de convite"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="secondary">
            Entrar
          </Button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Group list */}
      {groups.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(group => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white rounded-xl border p-4 hover:border-green-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {group.memberCount} membro(s)
                    </span>
                  </div>
                </div>
                <BookOpen size={20} className="text-gray-300 group-hover:text-green-400 transition-colors mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="mx-auto mb-3 text-gray-200" size={48} />
          <p className="font-medium text-gray-500">Você ainda não está em nenhum grupo</p>
          <p className="text-sm mt-1">Crie um grupo ou peça o código de convite para alguém</p>
          <Link href="/groups/new" className="inline-block mt-4">
            <Button>Criar meu primeiro grupo</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
