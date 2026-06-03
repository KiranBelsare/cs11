import { useState } from 'react'
import { FlagModal } from './FlagModal'

interface FlagButtonProps {
  targetId: string
  targetType: 'faq' | 'question' | 'answer'
  /** Show as text link instead of icon button */
  text?: boolean
}

export function FlagButton({ targetId, targetType, text = false }: FlagButtonProps) {
  const [open, setOpen] = useState(false)

  if (text) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Report
        </button>
        {open && <FlagModal targetId={targetId} targetType={targetType} onClose={() => setOpen(false)} />}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report this"
        className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
      </button>
      {open && <FlagModal targetId={targetId} targetType={targetType} onClose={() => setOpen(false)} />}
    </>
  )
}
