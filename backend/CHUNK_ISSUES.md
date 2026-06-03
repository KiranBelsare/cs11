# Chunk Issues — Cross-Chunk Coordination

Updated after staleness tracking implementation (end of Chunk 5).

---

## Issue 1 — `answers` populate in `findById` references non-existent field
**File:** `src/questions/questions.service.ts` — `findById()`
**Status: ✅ Resolved in Chunk 4**
- `answers: Types.ObjectId[]` added to Question schema
- `findById` no longer tries to populate answers

---

## Issue 2 — Question missing `votes[]` array
**File:** `src/questions/question.schema.ts`
**Status: ✅ Resolved in Chunk 4**
- `votes: [{ userId, value }]` added to Question schema

---

## Issue 3 — `aiMatchFaqId` not recorded on `forceSubmit`
**File:** `src/questions/question.schema.ts`
**Status: Open (Phase 2)**
- `aiMatchFaqId` is null when student forces submission
- `aiMatchRate` analytics will be undercounted as a result
- **Note (2026-06-03):** forceSubmit query param type corrected from string to boolean in questions.controller.ts — no functional change (runtime coercion already worked via ValidationPipe transform: true), but type is now accurate
- Revisit in Phase 2

---

## Issue 4 — `rebuild-index` endpoint on AI service
**File:** `src/answers/answers.service.ts`, `src/admin/admin.service.ts`
**Status: Open — AI side needs to implement `POST /rebuild-index`**
- Both callers fire the endpoint
- Staleness tracking ensures failures are observable via `indexStalenessHours` in analytics
- On failure, `lastIndexRebuild` timestamp is NOT updated — staleness grows in the dashboard

---

## Issue 5 — Question vote handling service
**File:** `src/questions/questions.service.ts`
**Status: Open**
- Question schema has `votes[]` array but no vote toggle/flip method
- Needs `questions.vote()` mirroring `answers.vote()` logic
- To be implemented when voting is wired up to frontend

---

## Issue 6 — Staleness tracking now implemented ✅
**Files:** `src/admin/meta.schema.ts`, `meta.module.ts`, `meta.service.ts`
**Status: ✅ Resolved**
- `Meta` collection with single document `{ _id: 'global', lastIndexRebuild: Date }`
- `lastIndexRebuild` stamped ONLY on successful AI index rebuild
- `GET /admin/analytics` returns `indexStalenessHours` (null if never rebuilt)
- Failures are observable: `indexStalenessHours` keeps growing until a successful rebuild

---

## Issue 7 — Duplicate axios instances with different base URLs (frontend)
**Files:** `src/lib/api.ts` vs `src/services/api.ts`
**Status: ✅ Resolved (Chunk 7 Group B)**
- `useAuth.ts` migrated: `@/services/api` → `@/lib/api`
- `services/auth.ts` migrated: `./api` → `@/lib/api`
- `src/services/api.ts` deleted
- `src/hooks/useVote.ts` deleted (was only other consumer; useVote was dead code — never imported anywhere)
- All frontend API calls now use `@/lib/api` (baseURL: `VITE_API_URL || '/api'`)

---

## Issue 8 — `useVote` hook POSTs to `/votes` but backend has no such route
**File:** `src/hooks/useVote.ts`
**Status: ✅ Resolved (Chunk 7 Group B) — deleted as dead code**
- `useVote` hook confirmed to be imported nowhere in the codebase
- FAQ voting in `faqs.$id.tsx` already uses direct inline `api.post('/faqs/${id}/vote')` — correct pattern
- Answer voting will follow the same direct inline pattern when implemented
- Hook deleted; no backend route needed

---

## Issue 9 — `Outlet` imported from `@tanstack/react-router` in `__root.tsx`
**File:** `src/routes/__root.tsx`
**Status: ✅ Resolved (Chunk 7 Group A)** — *superseded by Issue 14 (correct resolution)*
- Original fix attempt: `Outlet` switched to `react-router-dom` — this was incorrect for TanStack Router v1
- Full correction in Chunk 8: all imports unified to `@tanstack/react-router` (see Issue 14)

---

## Issue 10 — Double `AuthProvider` wrapping
**File:** `src/routes/__root.tsx` + `src/main.tsx`
**Status: ✅ Resolved (Chunk 7 Group A)**
- `<AuthProvider>` wrapper removed from `__root.tsx` rootRoute component
- Single `<AuthProvider>` in `main.tsx` now the only instance

---

## Issue 11 — `__root.tsx` mixes `@tanstack/react-router` and `react-router-dom`
**File:** `src/routes/__root.tsx`
**Status: ✅ Resolved (Chunk 7 Group A)** — *superseded by Issue 14 (correct resolution)*
- Original fix attempt noted mixed imports but resolved `Outlet` incorrectly to `react-router-dom`
- Full correction in Chunk 8: complete migration to `@tanstack/react-router` for all routing primitives (see Issue 14)

---

## Issue 12 — TanStack Router `useSearch` type mismatch in CategoryFilter
**File:** `src/components/CategoryFilter.tsx`, `src/components/SearchBar.tsx`, `src/routes/faqs.tsx`
**Status: ✅ Resolved (Chunk 7 Group D)**
- All `useSearch` calls now use explicit generic: `useSearch<{ ... }>({ from: '/faqs' })`
- Casts (`as { ... }`) removed from `CategoryFilter`, `SearchBar`, and `FaqsPage`
- Also fixed `useEffect` deps lint warning in `SearchBar`

---

## Issue 13 — `validateSearch` on `faqsRoute` caused cascading TypeScript errors across the codebase
**File:** `src/routes/__root.tsx`, `src/components/SearchBar.tsx`, `src/components/CategoryFilter.tsx`, `src/routes/faqs.tsx`, `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/contexts/AuthContext.tsx`, `src/components/Navbar.tsx`, `src/components/ProtectedRoute.tsx`, `src/routes/ask.tsx`, `src/routes/faqs.$id.tsx`
**Status: ✅ Resolved (Chunk 8)**
- `validateSearch` on `faqsRoute` added search-param types to the route that TypeScript then enforced on every `navigate()`, `Link`, and `useSearch()` call referencing `/faqs`
- The type inference for TanStack Router v1's `useNavigate` generic function is fragile with code-based routes — `navigate('/path')` fails type-check because the inferred type is too strict
- **Resolution:** `validateSearch` removed from `faqsRoute`. URL search state for SearchBar/CategoryFilter is now managed imperatively via `navigate({ from: '/faqs', search: fn } as any)` — works correctly at runtime, cast bypasses the type inference issue
- Also removed `validateSearch` that introduced `search` as required on all `redirect()` calls in guards
- Pattern documented in `CONTEXT.md` under "TanStack Router v1 TypeScript Gotchas"

---

## Issue 14 — Frontend mixed `@tanstack/react-router` and `react-router-dom` throughout
**File:** `src/components/Navbar.tsx`, `src/components/ProtectedRoute.tsx`, `src/contexts/AuthContext.tsx`, `src/routes/__root.tsx`
**Status: ✅ Resolved (Chunk 8)**
- `Navbar.tsx`, `ProtectedRoute.tsx`, `AuthContext.tsx` all imported from `react-router-dom` while the rest of the app used `@tanstack/react-router`
- `__root.tsx` used both libraries (Outlet from `@tanstack/react-router`, others from `react-router-dom`)
- **Resolution:** All imports unified to `@tanstack/react-router`. `Navbar.tsx` `useMatchRoute` `exact` prop removed (not supported in v1 — use `activeOptions` if needed). `ProtectedRoute.tsx` `navigate('/login')` now `navigate({ to: '/login' } as any)` to match v1's generic function signature
- **Note:** Issue 9's resolution description is incorrect — it says `Outlet` was switched to `react-router-dom`, but `Outlet` for code-based TanStack Router must come from `@tanstack/react-router`. The correct fix (applied in this chunk) is the reverse: everything should be from `@tanstack/react-router`

---

## Issue 15 — Promote-to-FAQ endpoint missing from backend
**File:** `src/questions/questions.controller.ts`
**Status: ✅ Resolved (Chunk 10)**
- `POST /questions/:id/promote-faq` implemented on `QuestionsController` — matches frontend URL directly
- Body: `{ answerId?: string, title: string, category: string, tags?: string[] }`
- `answerId` optional; falls back to the accepted answer if omitted
- Creates a new FAQ (published), marks answer as `isOfficialAdminAnswer: true`, closes the question
- Calls AI rebuild-index after success (fire-and-forget)
- `AnswersController` previously had a duplicate at `POST /questions/:questionId/answers/promote-faq` — removed 2026-06-03 (see Issue 16)

---

## Issue 16 — Duplicate `promote-faq` route on `AnswersController`
**File:** `src/answers/answers.controller.ts`, `src/questions/questions.controller.ts`
**Status: ✅ Resolved (2026-06-03)**
- `QuestionsController` already had `POST /questions/:id/promote-faq` — matching frontend URL
- `AnswersController` had a second `POST /questions/:questionId/answers/promote-faq` — same handler, never called by frontend
- **Fix:** Removed the duplicate route and unused `AdminGuard` import from `AnswersController`
- `QuestionsController` remains the sole active endpoint

---



## Issue 19 — AiMatcherService graceful-degradation design observation
**File:** src/questions/ai-matcher.service.ts
**Status: Not a bug (design)**
- When AI service is unreachable, catch returns { matched: false } — question proceeds to MongoDB for community answering (correct by design)
- When AI response is malformed, matches[0] is undefined, 	op.confidence is undefined, comparison returns alse — question saved (correct by design)
- Intentional fault tolerance: the community is the fallback when AI fails
- No code change needed
## Issue 18 — `vote()` missing `questionId` ownership check
**File:** `src/answers/answers.service.ts`, `src/answers/answers.controller.ts`
**Status: ✅ Resolved (2026-06-03)**
- `AnswersController.vote()` accepted `questionId` in URL but never passed it to the service
- Service's `vote()` method never validated that the answer's `questionId` matched the URL param
- Malicious user could vote on any answer from any question if they knew the `answerId`
- **Fix:** `vote()` service method now takes `questionId` param and validates `answer.questionId.toString() === questionId` before allowing the vote; throws `ForbiddenException` on mismatch

---

## Issue 17 — E2E tests require a live MongoDB instance (no in-memory fixture yet)
**File:** `backend/test/`
**Status: Open
- All e2e tests import `AppModule` directly, which connects to `MONGODB_URI` env var (defaults to `mongodb://localhost:27017/crowdfaq`)
- `mongodb-memory-server` is in `devDependencies` but not wired as a test fixture
- For local/dev runs: set `MONGODB_URI` to a local MongoDB instance, or integrate `MongooseModule.forRoot()` with an in-memory server in the test bootstrap
- `import request = require('supertest')` compiles cleanly with `tsc` (confirmed Chunk 10)
- `supertest` + `@types/supertest` added to `devDependencies` in Chunk 10