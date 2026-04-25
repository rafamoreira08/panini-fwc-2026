interface ProgressBarProps {
  have: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ have, total, showLabel = true }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((have / total) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 tabular-nums w-16 text-right">
          {have}/{total} ({pct}%)
        </span>
      )}
    </div>
  )
}
