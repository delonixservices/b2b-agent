'use client'

interface SortBarProps {
  selected: string
  onSortChange: (sort: string) => void
}

const sortOptions = [
  { label: 'Popular', value: 'popular' },
  { label: 'User Rating (Highest First)', value: 'rating_desc' },
  { label: 'Price (Highest First)', value: 'price_desc' },
  { label: 'Price (Lowest First)', value: 'price_asc' },
]

export default function SortBar({ selected, onSortChange }: SortBarProps) {
  return (
    <div className="bg-white rounded-md shadow p-2 mb-6 flex items-center gap-2">
      <span className="font-semibold text-gray-700 mr-2">SORT BY</span>
      {sortOptions.map((opt, idx) => (
        <>
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={
              'px-4 py-1 rounded-lg font-semibold ' +
              (selected === opt.value
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100')
            }
          >
            {opt.label.split(' ')[0] === 'Price' ? (
              <span className="font-bold">{opt.label.split(' ')[0]}</span>
            ) : null}
            {opt.label.split(' ')[0] === 'Price'
              ? ' ' + opt.label.substring(5)
              : opt.label}
          </button>
          {idx < sortOptions.length - 1 && (
            <span className="mx-2 text-gray-300 font-bold">|</span>
          )}
        </>
      ))}
    </div>
  )
} 