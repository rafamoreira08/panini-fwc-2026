import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'amber' | 'gray' | 'blue'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-green-100 text-green-700': variant === 'green',
          'bg-amber-100 text-amber-700': variant === 'amber',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-blue-100 text-blue-700': variant === 'blue',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
