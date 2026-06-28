'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { LogOut, BookOpen, Users } from 'lucide-react'

interface NavbarProps {
  userName: string
}

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg text-gray-900 cursor-pointer min-h-[44px]"
        >
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-xl leading-none">⚽</span>
          </div>
          <span className="font-display font-bold uppercase tracking-tight text-green-700 text-base hidden sm:inline">
            Panini Copa 2026
          </span>
          <span className="font-display font-bold uppercase tracking-tight text-green-700 text-base sm:hidden">
            Panini
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Slot para controles específicos da página atual (ex: método de edição do Álbum) */}
          <div id="navbar-page-actions-slot" className="flex items-center" />

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] cursor-pointer ${
                pathname === '/dashboard'
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BookOpen size={18} />
              <span>Meu Álbum</span>
            </Link>

            <Link
              href="/groups"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] cursor-pointer ${
                pathname === '/groups' || pathname.startsWith('/groups/')
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              <span>Meus Grupos</span>
            </Link>

            <div className="h-6 border-l border-gray-200 mx-2" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-700">{userName[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm text-gray-600 truncate max-w-[120px]">{userName}</span>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 min-h-[44px] cursor-pointer"
              title="Sair"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </nav>

          {/* Mobile: only logout button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 min-h-[44px] cursor-pointer"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
