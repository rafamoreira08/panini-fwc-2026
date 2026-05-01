import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:shadow-sm',
        'hover:border-gray-300 active:border-gray-300',
        'placeholder:text-gray-400 placeholder:font-normal',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-100',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'
export { Input }
