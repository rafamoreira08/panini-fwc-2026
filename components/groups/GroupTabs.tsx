'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BookOpen, ArrowLeftRight, Users } from 'lucide-react'

type Tab = 'album' | 'trades' | 'members'

interface GroupTabsProps {
  groupId: string
  active: Tab
}

const tabs: { id: Tab; label: string; href: (id: string) => string; icon: React.ReactNode }[] = [
  { id: 'album', label: 'Álbum', href: id => `/groups/${id}`, icon: <BookOpen size={15} /> },
  { id: 'trades', label: 'Trocas', href: id => `/groups/${id}/trades`, icon: <ArrowLeftRight size={15} /> },
  { id: 'members', label: 'Membros', href: id => `/groups/${id}/members`, icon: <Users size={15} /> },
]

export function GroupTabs({ groupId, active }: GroupTabsProps) {
  return (
    <nav className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={tab.href(groupId)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {tab.icon}
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
