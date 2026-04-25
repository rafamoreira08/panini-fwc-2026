'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { LogOut, Home, Plus } from 'lucide-react'

interface NavbarProps {
  userName: string
}

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="bg-green-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-xl">⚽</span>
          <span className="hidden sm:inline">Panini Copa 2026</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === '/dashboard' ? 'bg-green-600' : 'hover:bg-green-600'
            }`}
          >
            <Home size={15} />
            <span className="hidden sm:inline">Grupos</span>
          </Link>
          <Link
            href="/groups/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Novo grupo</span>
          </Link>
          <div className="ml-2 h-6 border-l border-green-600" />
          <span className="text-sm text-green-200 px-2 hidden sm:block">{userName}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
