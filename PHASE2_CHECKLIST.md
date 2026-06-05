# Phase 2 & Not-Yet-Built Checklist

> Compiled 2026-06-03. Update this file as items are completed.

---

## ⚠️ Partial — Backend Done, Frontend Not Wired Up

### 1. Voting on Questions ✅ Frontend wired up (2026-06-03)
- **Backend:** `POST /questions/:id/vote` — toggle/flip/add, self-vote prevented
- **Frontend:** Vote buttons added to `QuestionDetailPage` meta row (`questions.$id.tsx`)
  - Inline arrows next to "Asked by {author}" in the question card meta
  - Colour-coded score (green positive, red negative, grey zero)
  - Disabled when user is the question author
  - `onSettled` invalidates `['question', id]` query
- **See:** `FUTURE_FEATURES.md` — option to add voting to the questions list as well

---

## ✅ Recently Completed (2026-06-04)

### 2. `aiMatchFaqId` Not Saved on Question Create — Fixed
- **Problem:** Shape 2 (AI match): controller returned `{ aiMatch, faq }` without persisting the question — matched FAQ ID was discarded. Shape 1/forceSubmit: referenced undefined `matchedFaqId` variable → `ReferenceError`.
- **Impact:** `aiMatchRate` in analytics always undercounted.
- **Fix (2026-06-04):** `questions.controller.ts` — Shape 2 now captures `intentOrMatch.faq.id` and calls `create(dto, userId, capturedFaqId)`; Shape 1/forceSubmit simplified (no undefined var). `ask.tsx` — `onSuccess` captures `payload` (2nd arg) so reject → force-submit posts the correct form data.
- **Files:** `backend/src/questions/questions.controller.ts`, `frontend/src/routes/ask.tsx`

### 3. `rebuild-index` AI Endpoint — Pending AI side
- **Backend:** `AdminService.rebuildIndex()` calls `POST <AI_SERVICE_URL>/rebuild-index`
- **Python service:** Endpoint is pending implementation on the AI microservice side.
- **Action:** Implement `POST /rebuild-index` in the Python FAISS service (sentence-transformers + FAISS).
  - Should rebuild the FAISS index from all published FAQs and return success/failure.
  - On success: update `Meta.lastIndexRebuild`.
  - On failure: leave `lastIndexRebuild` untouched (staleness will grow and surface in dashboard).

### 4. Superadmin Pages
- **Backend:** `canManageSystem(role)` guard exists (`roles.ts`), `isSuperadmin(role)` helper exists.
- **Frontend:** No dedicated superadmin UI. Route guard not yet enforcing superadmin-only routes.
- **Action:** Design and build superadmin-specific pages (e.g., user management, system-wide config).

---

## ❌ Not Yet Built

### 5. Flag / Report Flow
- **Backend:** `flags` module exists — `Flag` schema, `FlagsService`, `FlagsController`, plus `comment` field (added 2026-06-03).
- **Frontend:** `FlagModal` + `FlagButton` built. Added to `AnswerCard` (icon) and `FaqDetailPage` (icon). `AdminFlagsPage` at `/admin/flags` with status tabs and review/dismiss/resolve actions.
- **Route:** `/admin/flags` — added to admin sidebar + route tree.
- **Status:** ✅ Done 2026-06-03

### 6. Socket.IO Real-Time Updates
- **Status:** Phase 2 in original spec. Not started.
- **Action:** Add Socket.IO server to NestJS, client to frontend. Events: vote count changes, new answers, question status changes, new FAQ published.

### 7. E2E Tests — ✅ Done (2026-06-04)
- **Backend tests:** Live in `backend/test/` (`auth.e2e-spec.ts`, `questions.e2e-spec.ts`, `voting.e2e-spec.ts`, `admin.e2e-spec.ts`). Run via `npm run test:e2e`.
- **Setup:** `TestDatabase` class in `test/setup-test-db.ts` using `mongodb-memory-server`. `beforeAll` connects before `Test.createTestingModule`, `afterAll` closes.
- **Timeout:** `testTimeout: 60000` in `jest-e2e.json` (5s default too short for MongoDB binary download).
- **Key fixes applied:**
  - `question.schema.ts`: `category` made optional (DTO validation optional, Mongoose schema `required: true` was blocking saves)
  - `auth.service.ts`: `name` added to JWT payload → `/auth/me` returns `{ userId, name, email, role }`
  - `http-exception.filter.ts`: `CastError` (Mongoose invalid ObjectId) now returns 404 instead of 500
  - Test assertions corrected: `contributedBy: expect.any(String)` (Mongoose raw serialization), accept-answer re-fetches after PATCH, resolved questions still accept answers (only `closed` rejects), vote flip sequence uses `added` not `changed`
- **Result:** 28/28 tests pass

### 8. Reputation System
- **Current state:** `User.reputation` field exists. `AnswersService.vote()` increments the answer author's reputation (`+10` per upvote, `-5` per downvote reversal).
- **Missing:** No explicit reputation earning logic surfaced to users. No UI for reputation display (except top contributors in analytics). No earning events for accepted answers, question views, FAQ contributions, etc.
- **Action:** Define reputation earning events, build a `ReputationService`, add a reputation history/breakdown view for users.

---

## Recently Completed (2026-06-03)

- [x] `QuestionsService.vote()` + `POST /questions/:id/vote` endpoint (backend)
- [x] `aiMatchFaqId` ownership check in `AnswersService.vote()`
- [x] Duplicate `promote-faq` route removed from `AnswersController`
- [x] `forceSubmit` query param typed correctly (`boolean` not `string`)
- [x] Issue #25 category `[object Object]` in admin FAQ manager (pre-resolved)

## Recently Completed (2026-06-04)

- [x] Item #2 — `aiMatchFaqId` now saved on question create (`questions.controller.ts` Shape 2 captures `intentOrMatch.faq.id` and passes to `create()`; Shape 1/forceSubmit fixed; `ask.tsx` `pendingPayload` fix for reject flow)