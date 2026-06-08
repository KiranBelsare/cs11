import { useState, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'
import { QuestionCard } from '@/components/QuestionCard'
import type { Question } from '@/types'

interface SearchState {
  search?: string
  category?: string
}

interface QuestionsPageResponse {
  data: Question[]
  totalCount: number
  page: number
}

export function ResolvePage() {
  const { user } = useAuth()
  const search = useSearch({ from: '/resolve' } as any) as SearchState

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['resolveQueue', { search: search.search, category: search.category }],
    queryFn: ({ pageParam, queryKey }) => {
      const { search: qSearch, category: qCategory } = queryKey[1] as { search?: string; category?: string }
      const params: Record<string, string> = {
        status: 'open',
        page: String(pageParam),
        limit: '10',
      }
      if (qSearch) params.search = qSearch
      if (qCategory) params.category = qCategory
      return api.get<QuestionsPageResponse>('/questions', { params }).then((res) => res.data)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalCount / 10)
      if (lastPage.page < totalPages) return lastPage.page + 1
      return undefined
    },
  })

  function handleSkip(id: string) {
    setHiddenIds((prev) => new Set(prev).add(id))
  }

  function handleExpand(id: string | null) {
    setExpandedId(id)
  }

  const allQuestions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  )

  const visibleQuestions = useMemo(
    () => allQuestions.filter((q) => !hiddenIds.has(q._id)),
    [allQuestions, hiddenIds],
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resolve questions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse open questions and share your knowledge. You earn reputation for every answer.
        </p>
        {user && (
          <p className="mt-0.5 text-xs text-gray-400">
            Your reputation: <span className="font-medium">{(user as any).reputation ?? 0}</span>
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="space-y-3 mb-6">
        <SearchBar baseRoute="/resolve" placeholder="Search open questions…" />
        <CategoryFilter baseRoute="/resolve" />
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : visibleQuestions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-base mb-1">No open questions right now.</p>
          <p className="text-sm text-gray-400">Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              hiddenIds={hiddenIds}
              onSkip={handleSkip}
              expandedId={expandedId}
              onExpand={handleExpand}
            />
          ))}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}