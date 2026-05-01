import { RegisterForm } from '@/components/auth/RegisterForm'
import { Sparkles } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-green-700">
      <div className="w-full max-w-sm">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-5">
            <span className="text-5xl leading-none">⚽</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight mb-2">
            Panini Copa 2026
          </h1>
          <p className="text-blue-100 text-base">Comece sua coleção de figurinhas agora</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-200">
            <Sparkles size={16} className="text-blue-300" />
            <span>Grátis e fácil de usar</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 uppercase tracking-tight mb-1">
            Criar sua conta
          </h2>
          <p className="text-sm text-gray-500 mb-6">Junte-se à comunidade de colecionadores</p>
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-blue-200 mt-8">
          Protegido por autenticação segura com Firebase
        </p>
      </div>
    </div>
  )
}
