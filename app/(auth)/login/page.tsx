import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Globe } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-600 to-green-800">
      <div className="w-full max-w-sm">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-5">
            <span className="text-5xl leading-none">⚽</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight mb-2">
            Panini Copa 2026
          </h1>
          <p className="text-green-100 text-base">Gerencie e troque suas figurinhas do campeonato</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-200">
            <Globe size={16} className="text-green-300" />
            <span>Conecte-se com colecionadores</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 uppercase tracking-tight mb-1">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-gray-500 mb-6">Faça login na sua conta para continuar</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-green-200 mt-8">
          Protegido por autenticação segura com Firebase
        </p>
      </div>
    </div>
  )
}
