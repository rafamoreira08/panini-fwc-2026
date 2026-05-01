'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Users, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Álbum',
    icon: BookOpen,
    match: (path: string) => path === '/dashboard',
  },
  {
    href: '/groups',
    label: 'Grupos',
    icon: Users,
    match: (path: string) => path === '/groups',
  },
  {
    href: '/groups/new',
    label: '+ Grupo',
    icon: PlusCircle,
    match: (path: string) => path === '/groups/new',
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch min-h-[60px]">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] cursor-pointer transition-colors duration-150',
                isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn('transition-all duration-150', isActive && 'text-green-600')}
              />
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wide leading-none font-display',
                  isActive ? 'text-green-600' : 'text-gray-500'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
