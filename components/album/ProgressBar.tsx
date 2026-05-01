interface ProgressBarProps {
  have: number
  total: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({ have, total, showLabel = true, size = 'md' }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((have / total) * 100)
  const isComplete = pct === 100

  const heightClass = {
    sm: 'h-2 bg-gray-200',
    md: 'h-3 bg-gray-200',
    lg: 'h-3 bg-gray-100',
  }[size]

  const labelSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size]

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${heightClass} rounded-full overflow-hidden shadow-xs`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : 'bg-gradient-to-r from-green-500 to-emerald-400'
          } shadow-sm`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`${labelSizeClass} text-gray-600 tabular-nums font-medium w-16 text-right`}>
          {have}/{total}
        </span>
      )}
    </div>
  )
}
