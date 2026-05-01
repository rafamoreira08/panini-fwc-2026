'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, Users } from 'lucide-react'

type Tab = 'trades' | 'members'

interface GroupTabsProps {
  groupId: string
  active: Tab
}

const tabs: { id: Tab; label: string; href: (id: string) => string; icon: React.ReactNode }[] = [
  { id: 'trades', label: 'Negociar Figurinhas', href: id => `/groups/${id}`, icon: <ArrowLeftRight size={16} /> },
  { id: 'members', label: 'Membros', href: id => `/groups/${id}/members`, icon: <Users size={16} /> },
]

export function GroupTabs({ groupId, active }: GroupTabsProps) {
  return (
    <nav className="flex gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={tab.href(groupId)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200',
            active === tab.id
              ? 'bg-white text-green-700 shadow-sm border border-green-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
