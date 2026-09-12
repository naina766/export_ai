# 📋 EXPORT AI CRM — FINAL ACTION PLAN

This action plan defines the exact execution sequence to bring the EXPORT AI CRM to production-grade, portfolio-ready, and interview-ready standard.

---

## 🚨 PRIORITY P0 — MUST FIX (Security, Data Integrity, Crashes, Deployment Blockers)

| ID | Component | File(s) | Exact Issue | Resolution Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **Auth Security** | `app/api/auth/register/route.ts`, `lib/validations/index.ts` | Privilege escalation: allows arbitrary `role` parameter on self-registration. | Force `role: isFirstUser ? "ADMIN" : "AGENT"`. Strip `role` from public registration schema. |
| **P0-2** | **Secret Security** | `lib/auth.ts` | Insecure fallback secret `process.env.JWT_SECRET \|\| "fallback-secret-change-me"`. | Enforce minimum 32-char secret in production; throw if missing or weak. |
| **P0-3** | **Auth Guard** | `app/api/users/[id]/route.ts` | `GET /api/users/:id` has no authentication check, leaking user profiles. | Add `getAuthUser(req)` verification; return 401 if unauthenticated. |
| **P0-4** | **RBAC Guard** | `app/api/leads/[id]/route.ts` | `DELETE /api/leads/:id` allows any user to delete any lead. | Require `ADMIN` or `MANAGER` role, or require direct assignment ownership. |
| **P0-5** | **Data Integrity** | `prisma/schema.prisma` | Foreign key violations on lead deletion due to missing cascade rules. | Add `onDelete: Cascade` to `Activity`, `FollowUp`, `Notification`, and `Task` relations. |
| **P0-6** | **Worker Reliability**| `lib/rabbitmq/consumer.ts` | Corrupted/malformed JSON is retried up to 3 times instead of immediate DLQ rejection. | Detect syntax/parse errors; immediately reject to DLQ with `nack(false, false)`. |
| **P0-7** | **Worker Backoff** | `lib/rabbitmq/consumer.ts` | Instant retry republishing without delay exhausts all retries in <10ms on external errors. | Add backoff delay between worker retries to avoid instant exhaustion. |
| **P0-8** | **Worker Startup** | `workers/index.ts` | Process crashes at boot if RabbitMQ is momentarily unreachable. | Implement graceful standby/retry loop for RabbitMQ connection at worker startup. |
| **P0-9** | **Deployment** | `docker-compose.yml`, `Dockerfile`, `Dockerfile.worker` | Referenced Dockerfiles do not exist; containerized startup fails immediately. | Create production-ready `Dockerfile` (Next.js standalone) and `Dockerfile.worker`. |
| **P0-10**| **Live Dashboard** | `app/(dashboard)/dashboard/page.tsx` | Dashboard displays hardcoded static mock numbers instead of live CRM data. | Connect to `/api/reports/dashboard` and `/api/analytics/overview` with real metrics. |

---

## ⚡ PRIORITY P1 — IMPORTANT (Engineering Quality, Robustness, API Standards)

| ID | Component | File(s) | Exact Issue | Resolution Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P1-1** | **Database Indexes** | `prisma/schema.prisma` | Missing query indexes on high-volume foreign keys and status columns. | Add indexes for `BuyerLead(assignedToId, createdAt)`, `SalesOpportunity(leadId, assignedToId)`, `Activity(leadId, userId, createdAt)`, `FollowUp(userId, scheduledAt)`, `OutboxEvent(status, createdAt)`. |
| **P1-2** | **Rate Limiting** | `lib/security/rate-limit.ts`, `app/api/auth/*` | No rate limiting on authentication or AI endpoints. | Implement in-memory token bucket rate limiting for login, register, and discovery. |
| **P1-3** | **Security Headers**| `next.config.ts` | Missing HTTP security headers (CSP, HSTS, X-Frame-Options, etc.). | Configure standard production security headers. |
| **P1-4** | **Input Sanitation**| `lib/ai/classifyLead.ts`, `lib/ai/personalizeEmail.ts` | Unsanitized prompt interpolation vulnerable to prompt overrides. | Sanitize inputs, enforce length boundaries, and wrap lead context in structured tags. |
| **P1-5** | **File Uploads** | `app/api/upload/route.ts` | No MIME-type or file size validation prior to buffer allocation. | Restrict to allowed types (image/png, image/jpeg, application/pdf) and 10MB limit. |
| **P1-6** | **XSS Prevention** | `app/api/unsubscribe/route.ts` | Dynamic strings interpolated directly into HTML output without escaping. | Add HTML entity escaping for user parameters. |
| **P1-7** | **SQL/Prisma Safety**| `app/api/leads/route.ts` | Unsanitized `sortBy` query parameter allows arbitrary field sorting. | Whitelist valid sort fields (`createdAt`, `leadScore`, `companyName`, `updatedAt`). |
| **P1-8** | **Token Rotation** | `app/api/auth/refresh/route.ts` | Token rotation split into non-atomic queries. | Wrap delete and create in `prisma.$transaction`. |
| **P1-9** | **Route Guard** | `middleware.ts` | Missing global Next.js middleware for route protection. | Create `middleware.ts` to guard `/dashboard/*` routes and attach security headers. |
| **P1-10**| **Automated Tests** | `tests/` | Insufficient coverage for auth, RBAC, outbox, consumer, and CRM operations. | Add automated tests for high-risk flows using Node/tsx test runner. |

---

## 🎨 PRIORITY P2 — UI/UX POLISH (Professional B2B SaaS CRM Experience)

| ID | Component | File(s) | Exact Issue | Resolution Plan |
| :--- | :--- | :--- | :--- | :--- |
| **P2-1** | **Mobile Responsiveness** | `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopNavbar.tsx` | Fixed margins (`ml-[240px]`) break mobile viewport; no mobile drawer menu. | Implement responsive mobile drawer with backdrop overlay and hamburger button. |
| **P2-2** | **Sidebar Grouping** | `components/layout/Sidebar.tsx` | Sidebar categories need clear B2B CRM organization. | Group into: WORKSPACE, OUTREACH, INTELLIGENCE, MANAGEMENT, ADMIN matching routes. |
| **P2-3** | **Leads Pagination** | `app/(dashboard)/leads/page.tsx` | Leads table lacks pagination controls. | Implement compact, responsive pagination bar (page numbers, next/prev). |
| **P2-4** | **Lead Detail Overhaul**| `app/(dashboard)/leads/[id]/page.tsx` | Mock timeline, missing opportunities, follow-ups, and quotation relations. | Implement comprehensive tabbed CRM profile with real activities and linked deals. |
| **P2-5** | **AI UI Authenticity** | `app/(dashboard)/leads/page.tsx` | Hardcoded static metrics in AI decision drawer ("94% Confidence", etc.). | Bind strictly to real lead data (`leadScore`, `aiConfidence`, `aiReasoning`). |
| **P2-6** | **Empty & Error States** | All major dashboard pages | Blank screens or unhelpful text on empty data or failures. | Provide informative empty states with clear calls-to-action and retry buttons. |

---

## 📖 DOCUMENTATION & INTERVIEW READINESS

| ID | Artifact | Description |
| :--- | :--- | :--- |
| **DOC-1** | `README.md` | Accurate, comprehensive portfolio overview, architecture diagram, verified credentials, and setup guide. |
| **DOC-2** | `docs/ARCHITECTURE.md` | Full architecture documentation for Next.js, Prisma, PostgreSQL, Outbox, and RabbitMQ. |
| **DOC-3** | `docs/OUTBOX_RABBITMQ.md`| In-depth technical explanation of Outbox pattern, idempotency, retries, and failure modes. |
| **DOC-4** | `docs/AI_ARCHITECTURE.md` | Real Gemini 1.5 Flash integration, prompts, Zod schema validation, and fallback scoring. |
| **DOC-5** | `docs/INTERVIEW_GUIDE.md` | Realistic engineering interview Q&A matching the actual implementation. |
| **DOC-6** | `docs/RESUME_CLAIMS.md` | Verified safe-to-claim resume bullet points grounded in code. |
| **DOC-7** | `docs/FINALIZATION_REPORT.md`| Final post-execution report summarizing all changes, tests, and metrics. |
