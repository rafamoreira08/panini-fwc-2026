'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Plus, BookOpen, Loader, Share2, ArrowRight } from 'lucide-react'
import { getUserGroups, joinGroup } from '@/app/actions/groups'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { getFirebaseFirestore, getFirebaseAuth } from '@/lib/firebase/client'

interface Group {
  id: string
  name: string
  inviteCode: string
  createdBy: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<(Group & { memberCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const loadGroups = async () => {
    try {
      const auth = getFirebaseAuth()
      await auth.authStateReady()
      const user = auth.currentUser
      if (!user) return

      const userGroups = (await getUserGroups()) as Group[]
      const groupsWithCounts = await Promise.all(
        userGroups.map(async g => {
          const q = query(collection(getFirebaseFirestore(), 'groupMembers'), where('groupId', '==', g.id))
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

  useEffect(() => {
    loadGroups()
  }, [])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setJoining(true)

    try {
      await joinGroup(inviteCode)
      setInviteCode('')
      await loadGroups()
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar no grupo')
    } finally {
      setJoining(false)
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-gray-900">
          Meus Grupos de Troca
        </h1>
        <p className="text-gray-500">Gerencie seus grupos e negocie figurinhas com seus amigos</p>
      </div>

      {/* Join by code */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 size={20} className="text-green-600" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-gray-900">
            Entrar em um Grupo
          </h2>
        </div>
        <form onSubmit={handleJoin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Cole o código de convite</label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código de convite"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="flex-1"
                disabled={joining}
              />
              <Button type="submit" variant="primary" disabled={joining || !inviteCode.trim()}>
                {joining ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-sm flex items-center gap-2">
              <span className="font-semibold">Erro:</span>
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Groups list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-gray-900">
            {groups.length > 0 ? `Seus ${groups.length} Grupo${groups.length !== 1 ? 's' : ''}` : 'Nenhum Grupo Ainda'}
          </h2>
          <Link href="/groups/new">
            <Button size="sm" variant="primary">
              <Plus size={16} className="mr-1" />
              Criar Grupo
            </Button>
          </Link>
        </div>

        {groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-400 hover:shadow-lg transition-all duration-200 h-full touch-manipulation">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display font-bold uppercase tracking-tight text-gray-900 group-hover:text-green-700 transition-colors text-lg mb-1">
                        {group.name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                        <Users size={14} />
                        <span className="font-bold text-gray-700">{group.memberCount}</span>
                        {group.memberCount === 1 ? 'membro' : 'membros'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                      <BookOpen size={20} className="text-green-600" />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Clique para acessar</p>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-gray-300" size={32} />
            </div>
            <p className="font-display font-bold uppercase tracking-tight text-gray-900 text-xl mb-1">
              Você ainda não está em nenhum grupo
            </p>
            <p className="text-gray-500 mb-6">Crie um novo grupo ou peça o código de convite para alguém</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/groups/new">
                <Button size="lg">Criar Meu Primeiro Grupo</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
