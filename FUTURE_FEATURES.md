# Future Features — CrowdFAQ

> Ideas, enhancements, and improvements to consider after Phase 2.
> Compiled 2026-06-03.

---

## UX Enhancements

### Voting on Questions in the List
- **What:** Add compact vote controls (+/−) directly on question cards in `QuestionsPage` (`/questions`) without requiring the user to click into the detail page.
- **Why:** Faster engagement — users can signal quality or interest at a glance without opening every question.
- **Backend:** Already done — `POST /questions/:id/vote` exists.
- **Frontend:** Need to add vote buttons to the `QuestionsPage` list cards, wire to the existing endpoint, optimistic update via `QueryClient`.
- **Status:** Not started
- **Priority:** Medium — nice QoL improvement

---

## Feature Ideas

### Real-Time Updates (Socket.IO)
- Live vote count changes without page refresh
- New answers appear without refresh
- Question status changes reflected immediately
- New FAQ published notifications for admins
- **See:** `PHASE2_CHECKLIST.md`

---

### Reputation System Expansion
- Earn reputation for: accepted answers, FAQ contributions, question upvotes received
- Reputation history / breakdown view per user
- Leaderboard beyond just admin analytics — public-facing reputation display
- **See:** `PHASE2_CHECKLIST.md`

---

### Superadmin Dashboard
- User management (ban, role change, view activity)
- System-wide analytics beyond admin analytics
- AI service health monitoring
- **See:** `PHASE2_CHECKLIST.md`

---

### Flag / Report Flow
- Users can flag FAQs, questions, or answers
- Admin review queue for flagged content
- **See:** `PHASE2_CHECKLIST.md`

---

### Gamification
- Badges for first question, first answer, first accepted answer, 10 FAQs contributed
- Contribution streaks
- "Top contributors this week" widget on `/faqs` landing page

---

### FAQ Version History
- Track changes to FAQ body/title/category/tags
- Admins can see diff between versions
- Rollback capability

---

### Email / Notification In-App
- Notify question author when their question gets an answer
- Notify user when their answer is accepted
- Notify admins when a question is flagged
- In-app notification bell with dropdown

---

### Search Improvements
- Full-text search with highlighted snippets
- Search within a specific category
- "Did you mean?" suggestions
- Search analytics (what are students searching for but not finding?)

---

### Onboarding Flow
- Guided first-time experience for new interns
- Tutorial tooltips on `/ask` and `/faqs`
- Sample question suggestions to get them started

---

_Update this file as ideas mature into planned features._