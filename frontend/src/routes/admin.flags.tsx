import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Flag } from '@/types'

const STATUS_TABS = ['All', 'pending', 'reviewed', 'dismissed', 'resolved'] as const
type Tab = typeof STATUS_TABS[number]

const ACTION_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
  resolved: 'Resolved',
}

const TARGET_BADGE: Record<string, string> = {
  faq: 'bg-blue-50 text-blue-600',
  question: 'bg-purple-50 text-purple-600',
  answer: 'bg-orange-50 text-orange-600',
}

export function AdminFlagsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'flags', tab],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '20' })
      if (tab !== 'All') params.set('status', tab)
      return api.get(`/flags?${params}`).then(r => r.data as { data: Flag[]; total: number })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/flags/${id}/review`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  })

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.post(`/flags/${id}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/flags/${id}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  })

  const flags = data?.data ?? []
  const total = data?.total ?? 0

  function actionLabel(flag: Flag) {
    if (flag.status === 'pending') return 'Pending'
    return ACTION_LABELS[flag.status] ?? flag.status
  }

  function actionBadgeColor(flag: Flag) {
    if (flag.status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    if (flag.status === 'reviewed') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (flag.status === 'dismissed') return 'bg-gray-50 text-gray-500 border-gray-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Flag Review</h1>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'pending' && flags.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {flags.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : flags.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No flags here.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Target ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reason</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reported</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.map((flag) => (
                <tr key={flag._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${actionBadgeColor(flag)}`}>
                      {actionLabel(flag)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${TARGET_BADGE[flag.targetType]}`}>
                      {flag.targetType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[100px] truncate" title={flag.targetId}>
                    {flag.targetId}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{flag.reason}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={flag.comment ?? undefined}>
                    {flag.comment ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {flag.status === 'pending' && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => reviewMutation.mutate(flag._id)}
                          disabled={reviewMutation.isPending}
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => dismissMutation.mutate(flag._id)}
                          disabled={dismissMutation.isPending}
                          className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {flag.status === 'reviewed' && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => dismissMutation.mutate(flag._id)}
                          disabled={dismissMutation.isPending}
                          className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => resolveMutation.mutate(flag._id)}
                          disabled={resolveMutation.isPending}
                          className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                    {(flag.status === 'dismissed' || flag.status === 'resolved') && (
                      <span className="text-xs text-gray-400 pr-2">
                        {flag.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}