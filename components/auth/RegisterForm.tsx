'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Check } from 'lucide-react'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

  const passwordStrength = password.length >= 6 ? 'strong' : 'weak'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signUp(new FormData(e.currentTarget))
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        router.push('/dashboard')
        return
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
        <Input
          name="name"
          required
          placeholder="Seu nome completo"
          disabled={loading}
        />
      </div>

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
          placeholder="Mínimo 6 caracteres"
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="mt-2 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`} />
          <span className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordStrength === 'strong' ? 'Força: Boa' : 'Mínimo 6 caracteres'}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!error && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Conta segura</p>
            <p className="text-xs">Protegida por autenticação com Firebase</p>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full mt-6" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar conta grátis'}
      </Button>

      <p className="text-center text-sm text-gray-600 pt-2">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="text-green-600 hover:text-green-700 font-semibold transition-colors"
        >
          Entrar aqui
        </Link>
      </p>
    </form>
  )
}
