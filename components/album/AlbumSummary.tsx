import { ProgressBar } from './ProgressBar'

interface SectionProgress {
  label: string
  have: number
  total: number
}

interface AlbumSummaryProps {
  sections: SectionProgress[]
}

export function AlbumSummary({ sections }: AlbumSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map(section => {
        const isComplete = section.have === section.total && section.total > 0

        return (
          <div
            key={section.label}
            className={`rounded-xl border p-3 ${
              isComplete
                ? 'bg-green-50 border-green-300'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold text-sm ${
                isComplete ? 'text-green-700' : 'text-gray-800'
              }`}>
                {section.label}
              </span>
              {isComplete && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                  ✓
                </span>
              )}
            </div>
            <ProgressBar have={section.have} total={section.total} />
          </div>
        )
      })}
    </div>
  )
}
