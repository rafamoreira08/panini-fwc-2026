'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { LogOut, Home, Plus, BookOpen } from 'lucide-react'

interface NavbarProps {
  userName: string
}

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">⚽</span>
          </div>
          <span className="hidden sm:inline text-lg">Panini Copa 2026</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              pathname === '/dashboard'
                ? 'bg-green-50 text-green-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} />
            <span className="hidden sm:inline">Meu Álbum</span>
          </Link>

          <Link
            href="/dashboard#grupos"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              pathname.includes('/groups') && !pathname.includes('/groups/new')
                ? 'bg-green-50 text-green-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">Meus Grupos</span>
          </Link>

          <Link
            href="/groups/new"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo grupo</span>
          </Link>

          <div className="h-6 border-l border-gray-200 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2 hidden sm:flex">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-xs font-bold text-green-700">{userName[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm text-gray-600 truncate max-w-[120px]">{userName}</span>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            title="Sair"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
