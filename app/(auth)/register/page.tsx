import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">Panini Copa 2026</h1>
          <p className="text-gray-500 mt-1 text-sm">Crie sua conta para começar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Criar conta</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
