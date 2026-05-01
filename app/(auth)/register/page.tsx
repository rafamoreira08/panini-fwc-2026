import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-sm">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <span className="text-5xl">⚽</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panini Copa 2026</h1>
          <p className="text-gray-600 text-base">Comece sua coleção de figurinhas agora</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>🎉</span>
            <span>Grátis e fácil de usar</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Criar sua conta</h2>
          <p className="text-sm text-gray-500 mb-6">Junte-se à comunidade de colecionadores</p>
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Protegido por autenticação segura com Firebase
        </p>
      </div>
    </div>
  )
}
