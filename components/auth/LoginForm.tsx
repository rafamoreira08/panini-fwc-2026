'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
      setLoading(false)
    }
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
