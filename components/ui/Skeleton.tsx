import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const skeletons = Array.from({ length: count })

  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg',
            'animate-pulse',
            className
          )}
        />
      ))}
    </>
  )
}

interface SkeletonLineProps {
  width?: string | number
  height?: string | number
}

export function SkeletonLine({ width = '100%', height = '1rem' }: SkeletonLineProps) {
  return (
    <div
      className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse"
      style={{ width, height }}
    />
  )
}
