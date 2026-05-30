# CrowdFAQ — Backend

NestJS REST API for the CrowdFAQ crowd-sourced FAQ platform.

---

## Prerequisites

- Node.js v20+
- npm v10+
- MongoDB Atlas connection string
- Python AI microservice running on Port 5001

---

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # fill in real values from the team lead
npm run start:dev
```

Server runs on **Port 5000** by default.

Verify:
```bash
curl http://localhost:5000/api/health
# { "status": "ok" }
```

Seed the database on first run only:
```bash
curl -X POST http://localhost:5000/api/seed
```

Trigger initial AI index build after seeding:
```bash
curl -X POST http://localhost:5000/api/admin/rebuild-index \
  -H "Authorization: Bearer <admin_token>"
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | Token validity duration (e.g. `7d`) |
| `BCRYPT_ROUNDS` | bcrypt salt rounds (recommended `12`) |
| `AI_SERVICE_URL` | Python AI microservice base URL (default `http://localhost:5001`) |

`MONGO_URI` and `JWT_SECRET` are shared privately by the team lead. Never commit `.env`.

---

## Running All Three Services

```bash
# Terminal 1 — Python AI microservice
cd ai-service
pip install -r requirements.txt
uvicorn main:app --port 5001

# Terminal 2 — NestJS backend
cd backend
npm run start:dev

# Terminal 3 — React frontend
cd frontend
npm run dev
```

---

## Module Structure

```
src/
├── main.ts                         Entry point
├── app.module.ts                   Root module
├── config/roles.ts                 Role constants
│
├── auth/                           Signup, login, JWT, guards
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── index.ts
│   └── guards/
│       ├── jwt.guard.ts
│       ├── admin.guard.ts
│       ├── superadmin.guard.ts
│       └── index.ts
│
├── users/                          User model and service
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── schemas/user.schema.ts
│
├── faqs/                           Official FAQ knowledge base
│   ├── faqs.controller.ts
│   ├── faqs.service.ts
│   ├── faqs.module.ts
│   └── dtos/
│
├── questions/                      Question submission and AI matching
│   ├── questions.controller.ts
│   ├── questions.service.ts
│   ├── questions.module.ts
│   └── ai-matcher.service.ts
│
├── answers/                        Community answers, voting, SP awards
│   ├── answers.controller.ts
│   ├── answers.service.ts
│   ├── answers.module.ts
│   └── dtos/
│
├── categories/                     FAQ categories
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── categories.module.ts
│
├── admin/                          Admin queue, analytics, staleness tracking
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── analytics.service.ts
│   ├── meta.schema.ts
│   ├── meta.service.ts
│   └── meta.module.ts
│
├── ai/                             Proxy to Python AI microservice
│   ├── ai.controller.ts
│   ├── ai.service.ts
│   └── ai.module.ts
│
├── flags/                          Content flagging
│   ├── flags.controller.ts
│   ├── flags.service.ts
│   └── flags.module.ts
│
└── seed/                           Database seeder
    ├── seed.controller.ts
    ├── seed.service.ts
    └── seed.module.ts
```

---

## Auth Endpoints

### POST `/api/auth/signup`

Public. Role is always forced to `intern` — any role field in the body is stripped.

```json
// Request
{ "name": "...", "email": "...", "password": "..." }

// 201 Success
{ "message": "User registered successfully", "userId": "..." }
```

| Status | Reason |
|---|---|
| 400 | Missing field / invalid email / password under 8 chars |
| 409 | Email already registered |
| 429 | Rate limit exceeded |

---

### POST `/api/auth/login`

Public. Rate limited — 10 requests per IP per 60 seconds.

```json
// Request
{ "email": "...", "password": "..." }

// 200 Success
{ "token": "...", "role": "intern", "name": "..." }
```

| Status | Reason |
|---|---|
| 401 | Invalid credentials (same message for wrong password and unknown email) |
| 429 | Rate limit exceeded |

---

## Guards

Import from the barrel:

```typescript
import { JwtGuard, AdminGuard, SuperadminGuard } from '../auth/guards';
```

### `JwtGuard`
Verifies the Bearer JWT. Populates `req.user` with `{ userId, role, name }`.
Must run before `AdminGuard` or `SuperadminGuard`.

```typescript
@UseGuards(JwtGuard)
@Get('questions')
getQuestions() { ... }
```

Returns `401 "Unauthorized"` for invalid/missing token, `401 "Token expired"` for expired token.

---

### `AdminGuard`
Allows `admin` and `superadmin`. Blocks `intern`.
Always chain after `JwtGuard`.

```typescript
@UseGuards(JwtGuard, AdminGuard)
@Post('faqs')
createFaq() { ... }
```

Returns `403 "Forbidden: admin access only"`.

---

### `SuperadminGuard`
Allows `superadmin` only. `admin` does not pass.
Always chain after `JwtGuard`.

```typescript
@UseGuards(JwtGuard, SuperadminGuard)
@Put('users/:id/role')
updateUserRole() { ... }
```

Returns `403 "Forbidden: superadmin access only"`.

---

### Chaining Rule

```typescript
// Correct
@UseGuards(JwtGuard, AdminGuard)

// Wrong — AdminGuard runs without req.user being populated
@UseGuards(AdminGuard)
```

---

## User Roles

Defined in `src/config/roles.ts`. Three valid values — no others exist anywhere in the codebase.

| Role | Who | Passes |
|---|---|---|
| `intern` | Default for all signups | `JwtGuard` |
| `admin` | Programme coordinators | `JwtGuard`, `AdminGuard` |
| `superadmin` | Lead coordinators | All three guards |

---

## User Schema

Defined in `src/users/schemas/user.schema.ts`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | String | required | |
| `email` | String | required, unique | Lowercased |
| `passwordHash` | String | required | Never returned in any response |
| `role` | String | `intern` | enum: intern / admin / superadmin |
| `spurthyPoints` | Number | `0` | +10 on peer resolution accepted, +2 per upvote received |
| `peerResolutionCount` | Number | `0` | Incremented on answer accept — Verified Resolver badge at ≥ 3 |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

`passwordHash` is removed from all responses by a `toJSON` transform on the schema.

---

## AI Service Integration

| Caller | Endpoint | When |
|---|---|---|
| `questions/ai-matcher.service.ts` | `POST /match` | Every question submission |
| `answers/answers.service.ts` | `POST /rebuild-index` | Answer promoted to FAQ |
| `admin/admin.service.ts` | `POST /rebuild-index` | Manual admin trigger |

Rebuild calls are fire-and-forget. Failures do not block users. Staleness is tracked in the `Meta` collection (`src/admin/meta.schema.ts`) and surfaced as `indexStalenessHours` in `GET /admin/analytics`.

---

## Known Open Issues

See `CHUNK_ISSUES.md` for full details.

| # | File | Status |
|---|---|---|
| 3 | `questions/question.schema.ts` | `aiMatchFaqId` null on `forceSubmit` — undercounts `aiMatchRate`. Deferred to Phase 2. |
| 4 | `answers/answers.service.ts`, `admin/admin.service.ts` | AI service needs to implement `POST /rebuild-index`. Staleness tracking makes failures visible. |
| 5 | `questions/questions.service.ts` | `votes[]` exists on Question schema but no `questions.vote()` method yet. |

---

## API Docs

Swagger UI available at `http://localhost:5000/api/docs` once the server is running.
