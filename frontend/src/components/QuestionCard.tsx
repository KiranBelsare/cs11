import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import api from '@/lib/api'
import { AnswerCard } from './AnswerCard'
import { SubmitAnswerForm } from './SubmitAnswerForm'
import type { Question, Answer } from '@/types'

interface QuestionCardProps {
  question: Question
  hiddenIds: Set<string>
  onSkip: (id: string) => void
  expandedId: string | null
  onExpand: (id: string | null) => void
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getVoteScore(upvotes: number, downvotes: number) {
  return upvotes - downvotes
}

export function QuestionCard({
  question,
  hiddenIds,
  onSkip,
  expandedId,
  onExpand,
}: QuestionCardProps) {
  const queryClient = useQueryClient()
  const isExpanded = expandedId === question._id
  const hasAcceptedAnswer = question.status === 'resolved' || question.status === 'closed'

  // Fetch existing answers when expanded
  const { data: answers = [], isLoading: answersLoading } = useQuery({
    queryKey: ['answers', question._id],
    queryFn: async () => {
      const { data } = await api.get('/answers', { params: { questionId: question._id } })
      return data as Answer[]
    },
    enabled: isExpanded,
  })

  function handleExpand() {
    if (hasAcceptedAnswer) return
    onExpand(isExpanded ? null : question._id)
  }

  function handleSkip(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSkip(question._id)
  }

  function handleAnswerSuccess() {
    onExpand(null)
    queryClient.invalidateQueries({ queryKey: ['resolveQueue'] })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (hiddenIds.has(question._id)) return null

  const authorName = typeof question.askedBy === 'object'
    ? (question.askedBy as any).name
    : 'Anonymous'
  const category = typeof question.category === 'object'
    ? (question.category as any)
    : null
  const score = getVoteScore(question.upvotes, question.downvotes)

  const visibleTags = question.tags?.slice(0, 3) ?? []
  const extraTagCount = (question.tags?.length ?? 0) - 3

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
      {/* Card header — always visible */}
      <div className="p-5">
        {/* Row 1: category badge + skip */}
        <div className="flex items-center justify-between mb-2">
          {category ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: category.color || '#6366f1' }}
            >
              {category.name}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              General
            </span>
          )}

          {hasAcceptedAnswer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resolved
            </span>
          )}
        </div>

        {/* Row 2: title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          <Link
            to="/questions/$id"
            params={{ id: question._id }}
            className="hover:text-indigo-600 transition-colors"
          >
            {question.title}
          </Link>
        </h3>

        {/* Row 3: body preview */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{question.body}</p>

        {/* Row 4: tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {visibleTags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">
                #{tag}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-xs text-gray-400">+{extraTagCount} more</span>
            )}
          </div>
        )}

        {/* Row 5: meta + stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Asked by {authorName}</span>
            <span>·</span>
            <span>{relativeTime(question.createdAt)}</span>
            <span>·</span>
            <span>{answers.length} answer{answers.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Vote score */}
            <span className={`text-xs font-medium ${
              score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {score > 0 ? `+${score}` : score}
            </span>

            {/* Answer toggle */}
            {!hasAcceptedAnswer && (
              <button
                onClick={handleExpand}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isExpanded ? 'Close ↑' : 'Answer this question ↓'}
              </button>
            )}

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* Expanded answer section */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
          {/* Existing answers */}
          {answersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : answers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No answers yet — be the first!</p>
          ) : (
            <div className="space-y-3">
              {answers.map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  questionId={question._id}
                  questionAuthorId={typeof question.askedBy === 'object' ? question.askedBy._id : ''}
                  hasAcceptedAnswer={hasAcceptedAnswer}
                />
              ))}
            </div>
          )}

          {/* Submit form */}
          <SubmitAnswerForm
            questionId={question._id}
            onSuccess={handleAnswerSuccess}
          />

          {/* Inline success message area — SubmitAnswerForm handles errors inline */}
        </div>
      )}
    </div>
  )
}