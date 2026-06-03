import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

const FLAG_REASONS = [
  'Spam',
  'Inappropriate content',
  'Inaccurate information',
  'Duplicate',
  'Other',
] as const

interface FlagModalProps {
  targetId: string
  targetType: 'faq' | 'question' | 'answer'
  onClose: () => void
}

export function FlagModal({ targetId, targetType, onClose }: FlagModalProps) {
  const [reason, setReason] = useState<typeof FLAG_REASONS[number] | ''>('')
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)

  const labelMap = { faq: 'FAQ', question: 'Question', answer: 'Answer' }

  const flagMutation = useMutation({
    mutationFn: () =>
      api.post('/flags', {
        targetId,
        targetType,
        reason: reason as string,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => setDone(true),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        {!done ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Report {labelMap[targetType]}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Help us understand what's wrong with this {labelMap[targetType].toLowerCase()}.
              Reports are reviewed by admins.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as typeof FLAG_REASONS[number])}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">Select a reason...</option>
                  {FLAG_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any extra context that might help the admins..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">{comment.length}/500</p>
              </div>
            </div>

            {flagMutation.isError && (
              <p className="mt-3 text-xs text-red-500">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => flagMutation.mutate()}
                disabled={!reason || flagMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {flagMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Report submitted</h3>
            <p className="text-sm text-gray-500 mb-5">
              Thank you for helping keep the community safe. Admins will review this report.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}