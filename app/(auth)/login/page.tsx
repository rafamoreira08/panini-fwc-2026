import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">Panini Copa 2026</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie e troque suas figurinhas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entrar</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
