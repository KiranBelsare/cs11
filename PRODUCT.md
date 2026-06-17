# CrowdFAQ

**A living FAQ platform for student communities — where the crowd answers, AI assists, and admins step in last.**

> Built for Vicharanashala Summership · Team 11

---

## The Problem

Every cohort, the same questions flood the chat.
*"Where's my offer letter?" "Has my NOC been approved?" "When does onboarding start?"*

Admins answer them. Again. Students wait. Again.

CrowdFAQ breaks that loop — by making the community the first line of response, and AI the first line of defence.

---

## How It Works

When a student submits a question, three things happen in order:

**1. Intent Detection**
If the question is about a document — NOC, offer letter, onboarding — the platform skips everything else and returns that student's live document status instantly. No AI call. No admin involvement. No waiting.

**2. AI Matching**
If it's not a document query, the question is compared against the existing FAQ knowledge base using semantic similarity. A confident match surfaces the answer immediately with a suggestion banner. The student either accepts it and moves on, or dismisses it and submits their question anyway.

**3. Community Queue**
If neither layer resolves it, the question goes to the community. Experienced interns answer, vote, and resolve. Admins only see what genuinely needs them — which is rarely much.

---

## Two Features Worth Looking At

### AI-Powered Deflection

The semantic matching layer is built entirely within the MERN stack — no external AI service, no Python microservice, no separate deployment. Embeddings are generated via Ollama locally or Hugging Face in the cloud, switchable with a single environment variable. Cosine similarity runs inside NestJS.

If the embedding provider goes down, the platform degrades gracefully. Questions still save. Students are never blocked.

The result: most repeat questions never reach the admin queue. They're answered before they're even asked.

### Reputation System

Participation without recognition is participation that fades. CrowdFAQ tracks every contribution an intern makes and translates it into a visible reputation score.

Six earning events:

| What you did | Points |
|---|---|
| Posted an answer | +2 |
| Your answer was upvoted | +10 |
| Your answer was accepted | +15 |
| Your answer was promoted to a FAQ by an admin | +25 |
| Your answer was downvoted | −2 |

Every intern can see their full earning history — what they earned, when, and why. The top contributors surface in the admin analytics dashboard. Reputation never goes below zero.

This feature isn't cosmetic. It gamifies the overall experience and serves as positive incentivization - the reason experienced interns participate instead of lurking.

---

## What's Built

| Area | Status |
|---|---|
| FAQ knowledge base — browse, search, filter | ✅ |
| Intent detection — document status, zero latency | ✅ |
| AI matching — semantic similarity, graceful degradation | ✅ |
| Community Q&A — ask, answer, vote, accept | ✅ |
| Reputation system — earning events, history, leaderboard | ✅ |
| Flag and moderation flow | ✅ |
| Admin resolution queue | ✅ |
| Admin analytics + Query Insights | ✅ |
| Real-time updates via Socket.IO | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, TanStack Router, TanStack Query, Tailwind CSS |
| Backend | NestJS, Mongoose, MongoDB Atlas |
| AI | Ollama / Hugging Face Inference API — switchable via env var |
| Real-time | Socket.IO |
| Testing | Jest + mongodb-memory-server |
| Auth | JWT, role-based guards |

---

*Team 11 · Vicharanashala Summership · 10 members*