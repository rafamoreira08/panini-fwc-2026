'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { getSafeRedirectPath } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // O cookie de sessão expira em ~1h e o usuário pode cair aqui mesmo com a
  // sessão do Firebase ainda válida no navegador (ex: aba aberta há mais tempo).
  // Nesse caso, renovamos o cookie e seguimos direto, sem pedir login de novo.
  useEffect(() => {
    let active = true
    async function resumeExistingSession() {
      try {
        const auth = getFirebaseAuth()
        await auth.authStateReady()
        const user = active ? auth.currentUser : null
        if (!user) {
          if (active) setCheckingSession(false)
          return
        }
        const token = await user.getIdToken()
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (active && res.ok) {
          router.replace(getSafeRedirectPath(searchParams.get('next')))
          return
        }
      } catch {
        // segue para o formulário normal de login
      }
      if (active) setCheckingSession(false)
    }
    resumeExistingSession()
    return () => {
      active = false
    }
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn(new FormData(e.currentTarget))
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        router.push(getSafeRedirectPath(searchParams.get('next')))
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="animate-spin text-green-600" size={28} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
        <Input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
        <Input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full mt-6" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>

      <p className="text-center text-sm text-gray-600 pt-2">
        Não tem conta?{' '}
        <Link
          href="/register"
          className="text-green-600 hover:text-green-700 font-semibold transition-colors"
        >
          Criar conta grátis
        </Link>
      </p>
    </form>
  )
}
