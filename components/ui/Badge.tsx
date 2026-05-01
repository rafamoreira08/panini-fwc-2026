import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'amber' | 'gray' | 'blue' | 'red'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'gray', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
        },
        {
          'px-2 py-0.5': size === 'sm',
          'px-3 py-1': size === 'md',
        },
        {
          'bg-green-100 text-green-700': variant === 'green',
          'bg-amber-100 text-amber-700': variant === 'amber',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-blue-100 text-blue-700': variant === 'blue',
          'bg-red-100 text-red-700': variant === 'red',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
