import { createGroup } from '@/app/actions/groups'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGroupPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Criar grupo</h1>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-600 mb-4">
          Um grupo é onde você e seus amigos gerenciam os álbuns juntos e podem fazer trocas.
        </p>
        <form action={createGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do grupo
            </label>
            <Input name="name" required placeholder="Ex: Família Silva, Turma da Copa..." />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Criar grupo
          </Button>
        </form>
      </div>
    </div>
  )
}
