# 🔍 EXPORT AI CRM — COMPREHENSIVE REPOSITORY AUDIT

**Audit Date:** September 2026  
**Auditor:** Senior Principal Full-Stack & Systems Engineer (Antigravity AI)  
**Target Repository:** `naina766/real_estate_crm`  
**Application Title:** EXPORT AI — Enterprise B2B Export Sales Operating System & CRM  
**Status:** Audit Complete — Action Plan Established  

---

## EXECUTIVE SUMMARY

A rigorous, end-to-end architectural, security, database, worker, AI, and UI/UX audit was conducted on the entire codebase. The project contains a genuinely strong full-stack foundation: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL via Prisma ORM, RabbitMQ AMQP messaging with dedicated exchanges and DLQ, an Outbox transaction pattern, Gemini 1.5 Flash AI qualification, and Google OAuth Gmail delivery.

However, several critical vulnerabilities, broken operational flows, missing deployment artifacts, and frontend display inconsistencies prevent it from being production-grade and portfolio-ready. 

This audit document catalogs every issue categorized by domain with exact file locations, technical severity, recommended remediations, and fix decisions.

---

## A. ALREADY STRONG

1. **Architectural Cohesion & Modern Tech Stack:**
   - Next.js 16 App Router with React 19, strict TypeScript, and Tailwind CSS v4.
   - Clean separation between API route handlers (`app/api/`), business services (`lib/`), background workers (`workers/`), and presentation components (`components/`).

2. **Distributed Messaging Topology (`lib/rabbitmq/topology.ts`):**
   - Implements a dedicated direct exchange (`export.jobs.exchange`) with individual routing keys (`discovery.start`, `validation.email`, `ai.classify`, `campaign.send`, `report.generate`).
   - Declares a dead-letter exchange (`export.dlx`) and dead-letter queue (`export.dlq`) configured via `x-dead-letter-exchange`.

3. **Outbox Pattern Architecture (`lib/rabbitmq/outbox.ts`):**
   - Outbox event table (`outbox_events`) storing unique event keys, aggregate types, JSON payloads, and delivery statuses (`PENDING`, `PUBLISHED`, `FAILED`).
   - Transactional creation helper `createOutboxEvent(tx, ...)` designed to bind business state changes and outbox event creation into a single atomic database transaction.

4. **Multi-Gate Email Safety Pipeline (`workers/email.worker.ts`):**
   - Gate 1: Idempotency check (`idempotencyKey`) preventing duplicate dispatch.
   - Gate 2: Campaign active/running status gate.
   - Gate 3: Consent & unsubscribe check (`unsubscribeStatus`, `consentStatus`, `emailStatus === 'INVALID'`).
   - Gate 4: Human-in-the-loop review and personalization approval check (`personalized.isApproved`).
   - Gate 5: Throttling delay between sends.

5. **Cryptographic Security Foundations (`lib/security/`):**
   - AES-256-GCM authenticated encryption/decryption for third-party OAuth access and refresh tokens.
   - Tamper-proof HMAC-SHA256 signed tokens for one-click compliance unsubscribe links.

6. **Deterministic AI Fallback Architecture (`lib/ai/classifyLead.ts`):**
   - Robust rule-based scoring engine operating as a reliable fallback when Gemini API keys are absent or rate-limited.
   - Zod schema validation (`LeadClassificationSchema`) ensuring AI outputs strictly match expected enum types and numeric bounds before persistence.

---

## B. BUGS & BROKEN BEHAVIOR

### B1. Dashboard Displays Hardcoded Mock Numbers Instead of Live Data
- **File:** `app/(dashboard)/dashboard/page.tsx`
- **Problem:** The entire dashboard page renders hardcoded static constants (`count: 4280`, `1180`, `4`, `$48,600`, `14`, `24.2%`, static market breakdowns, and static timeline charts) instead of fetching live database KPIs from `/api/reports/dashboard` or `/api/analytics/overview`.
- **Severity:** High
- **Recommended Fix:** Connect the dashboard component to `/api/reports/dashboard` and `/api/analytics/overview` with proper loading states, skeletons, and zero-state handling.
- **Decision:** **FIX (P0)**

### B2. Foreign Key Constraint Violations on Lead Deletion
- **File:** `app/api/leads/[id]/route.ts` & `prisma/schema.prisma`
- **Problem:** `DELETE /api/leads/:id` performs a raw `prisma.buyerLead.delete()`. Because related models (`Activity`, `FollowUp`, `Notification`, `Task`) lack cascading delete rules (`onDelete: Cascade` or `onDelete: SetNull`), deleting any lead with logged activities or tasks throws a PostgreSQL foreign key constraint violation (Error P2003).
- **Severity:** High
- **Recommended Fix:** Add `onDelete: Cascade` to dependent child models in `schema.prisma` or execute cascade cleanup in a transaction.
- **Decision:** **FIX (P0)**

### B3. Broken Lead Detail Page & Hardcoded Activity Timeline
- **File:** `app/(dashboard)/leads/[id]/page.tsx`
- **Problem:** The Lead Detail page renders a hardcoded static timeline (`act-1`, `act-2`, `act-3`). It ignores actual opportunities, follow-ups, documents, and quotations linked to the lead. When a lead is not found, it renders an unstyled, unnavigable text block. Action buttons invoke full browser window navigation (`window.location.href`).
- **Severity:** High
- **Recommended Fix:** Fetch and display real related data (activities, opportunities, quotations, follow-ups), add structured navigation tabs, and use Next.js `router.push`.
- **Decision:** **FIX (P1)**

### B4. Missing Pagination Controls in Leads Table
- **File:** `app/(dashboard)/leads/page.tsx`
- **Problem:** The leads table fetches page 1 (`limit=20`), stores `total` in state, but renders no pagination controls (Next, Prev, Page numbers). Users cannot view leads beyond the first 20.
- **Severity:** High
- **Recommended Fix:** Add a clean, responsive pagination control bar with current page index, total items, and page navigation buttons.
- **Decision:** **FIX (P1)**

### B5. Worker Cluster Crash on RabbitMQ Disconnection at Boot
- **File:** `workers/index.ts` & `lib/rabbitmq/consumer.ts`
- **Problem:** In `workers/index.ts`, if RabbitMQ is not reachable at startup, it logs a warning but proceeds to call `startDiscoveryWorker()`, etc. Inside `createConsumer`, line 52 throws `[Consumer] Cannot start: Channel is unavailable`, terminating the entire Node.js worker process.
- **Severity:** High
- **Recommended Fix:** In `createConsumer` and worker runners, implement a graceful reconnection retry loop so workers stay alive in standby mode until the broker connects.
- **Decision:** **FIX (P0)**

---

## C. SECURITY PROBLEMS

### C1. Privilege Escalation via Public Registration
- **File:** `app/api/auth/register/route.ts` & `lib/validations/index.ts`
- **Problem:** `RegisterSchema` accepts an optional `role` field. In `route.ts` line 44, the code executes: `role: isFirstUser ? "ADMIN" : role || "AGENT"`. Any anonymous registrant can supply `{ "role": "ADMIN" }` in the POST body to gain full administrative access.
- **Severity:** Critical (P0)
- **Recommended Fix:** Strip `role` from public self-registration. All public registrations must default strictly to `AGENT`. Role assignment must be restricted to authenticated Admin users via `/api/users`.
- **Decision:** **FIX (P0)**

### C2. Insecure Fallback JWT Secret in Production
- **File:** `lib/auth.ts`
- **Problem:** Line 6 uses `process.env.JWT_SECRET || "fallback-secret-change-me"`. If `JWT_SECRET` is omitted in production, tokens are signed with a known public string, allowing trivial authentication bypass and session forgery.
- **Severity:** Critical (P0)
- **Recommended Fix:** Enforce that `JWT_SECRET` is defined and has a minimum length of 32 characters; throw a descriptive startup error in production if missing.
- **Decision:** **FIX (P0)**

### C3. Unauthenticated User Enumeration Endpoint
- **File:** `app/api/users/[id]/route.ts`
- **Problem:** `GET /api/users/:id` contains no authentication check (`getAuthUser` is not called). Any unauthenticated user can enumerate system users, extracting email addresses, full names, phone numbers, and roles.
- **Severity:** High (P0)
- **Recommended Fix:** Enforce `const user = await getAuthUser(req); if (!user) return errorResponse("Unauthorized", 401);`.
- **Decision:** **FIX (P0)**

### C4. Missing Role/Ownership Guard on Lead Deletion
- **File:** `app/api/leads/[id]/route.ts`
- **Problem:** `DELETE /api/leads/:id` verifies only that the requester is logged in. An `AGENT` can delete any lead, including leads assigned to managers or other agents.
- **Severity:** High (P0)
- **Recommended Fix:** Restrict deletion to users with role `ADMIN` or `MANAGER`, or verify that `user.userId === lead.assignedToId || user.userId === lead.createdById`.
- **Decision:** **FIX (P0)**

### C5. Complete Absence of API Rate Limiting
- **File:** Entire `app/api/` layer
- **Problem:** Although documented in `.env.example`, no rate limiting is implemented. Endpoints like `/api/auth/login`, `/api/auth/register`, `/api/leads`, and `/api/discovery/start` are vulnerable to brute-force attacks and denial-of-service.
- **Severity:** High (P1)
- **Recommended Fix:** Implement an in-memory sliding window or token-bucket rate limiter utility and apply it to authentication, discovery, and AI routes.
- **Decision:** **FIX (P1)**

### C6. Missing Security Headers
- **File:** `next.config.ts`
- **Problem:** No HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`) are configured.
- **Severity:** Medium (P1)
- **Recommended Fix:** Add standard security headers in `next.config.ts`.
- **Decision:** **FIX (P1)**

### C7. Unrestricted File Uploads
- **File:** `app/api/upload/route.ts`
- **Problem:** The upload route reads the entire file into memory with `await file.arrayBuffer()` without validating MIME type, extension, or maximum file size before streaming to Cloudinary.
- **Severity:** High (P1)
- **Recommended Fix:** Enforce maximum file size (e.g. 10MB) and whitelist allowed MIME types (JPEG, PNG, WebP, PDF).
- **Decision:** **FIX (P1)**

### C8. Unescaped HTML Interpolation in Unsubscribe Route
- **File:** `app/api/unsubscribe/route.ts`
- **Problem:** Dynamic input strings (`lead.email`, `title`, `message`) are interpolated directly into raw HTML template strings without entity escaping, creating stored/reflected XSS exposure.
- **Severity:** Medium (P1)
- **Recommended Fix:** Add an HTML entity escaping helper for dynamic parameters in `renderHtml`.
- **Decision:** **FIX (P1)**

---

## D. BACKEND PROBLEMS

### D1. Unsanitized `sortBy` Parameter in Prisma Queries
- **File:** `app/api/leads/route.ts` (and `lib/api.ts`)
- **Problem:** `sortBy` parameter from query string is passed directly into `orderBy: { [sortBy]: sortOrder }`. If a caller passes an arbitrary or non-existent property name, Prisma throws an unhandled database exception resulting in 500 errors.
- **Severity:** Medium (P1)
- **Recommended Fix:** Whitelist allowed sort keys (`createdAt`, `leadScore`, `companyName`, `updatedAt`).
- **Decision:** **FIX (P1)**

### D2. Non-Transactional Refresh Token Rotation
- **File:** `app/api/auth/refresh/route.ts`
- **Problem:** Refresh token rotation deletes the old token (`prisma.refreshToken.delete`) and creates the new one in separate un-sequenced queries. If the server crashes or the second query fails, the user is permanently logged out.
- **Severity:** Medium (P1)
- **Recommended Fix:** Execute delete and create within `prisma.$transaction`.
- **Decision:** **FIX (P1)**

### D3. Inefficient Per-Row Transactions in CSV Import
- **File:** `app/api/leads/import/route.ts`
- **Problem:** For each CSV row, the endpoint initiates an independent `prisma.$transaction`. Importing 500 leads issues 500 separate round-trip transactions, triggering request timeouts.
- **Severity:** Medium (P1)
- **Recommended Fix:** Chunk records and execute batched insertions.
- **Decision:** **FIX (P1)**

### D4. Missing Global Next.js Middleware
- **File:** Root directory
- **Problem:** No `middleware.ts` exists. Route protection is handled ad-hoc in layout files, allowing unauthenticated requests to hit internal rendering passes before redirecting.
- **Severity:** Medium (P1)
- **Recommended Fix:** Add `middleware.ts` with JWT verification, route guarding for `/dashboard/*`, and public asset passthrough.
- **Decision:** **FIX (P1)**

---

## E. DATABASE PROBLEMS

### E1. Missing Critical Indexes on High-Volume Foreign Keys
- **File:** `prisma/schema.prisma`
- **Problem:** Several foreign keys and search query columns lack indexes:
  - `BuyerLead`: missing indexes on `assignedToId`, `createdById`, `createdAt`.
  - `SalesOpportunity`: missing indexes on `leadId`, `assignedToId`, `productId`.
  - `Activity`: missing indexes on `leadId`, `userId`, `opportunityId`, `createdAt`.
  - `FollowUp`: missing indexes on `userId`, `leadId`, `scheduledAt`, `isCompleted`.
  - `Notification`: missing indexes on `userId`, `isRead`.
  - `Task`: missing indexes on `assignedToId`, `status`, `dueDate`.
  - `Quotation`: missing indexes on `leadId`, `opportunityId`.
  - `OutboxEvent`: compound index `[status, createdAt]` missing for polling efficiency.
- **Severity:** High (P1)
- **Recommended Fix:** Add specific indexes with explicit query justification documented in the schema and final report.
- **Decision:** **FIX (P1)**

### E2. Cascading Delete and Referential Integrity Gaps
- **File:** `prisma/schema.prisma`
- **Problem:** As discovered by `prisma/clean-orphans.ts`, foreign keys on `Activity`, `FollowUp`, `Notification`, and `Task` lack delete actions, blocking record deletion when parents are removed.
- **Severity:** High (P0)
- **Recommended Fix:** Add `onDelete: Cascade` to parent-dependent relations and `onDelete: SetNull` to optional user assignments.
- **Decision:** **FIX (P0)**

---

## F. RABBITMQ & OUTBOX PROBLEMS

### F1. Unparseable JSON Retried as Transient Errors
- **File:** `lib/rabbitmq/consumer.ts`
- **Problem:** If a corrupted or malformed JSON message lands on a queue, `JSON.parse` throws an error. The catch block treats it as a retryable error and republishes the malformed message up to `maxRetries` times.
- **Severity:** High (P0)
- **Recommended Fix:** Check for JSON syntax errors; reject (`nack(false, false)`) immediately to Dead Letter Queue without retrying.
- **Decision:** **FIX (P0)**

### F2. Instant Retry republishing Without Backoff
- **File:** `lib/rabbitmq/consumer.ts`
- **Problem:** When an error occurs, the consumer immediately calls `channel.publish` to the same queue. If Gemini API or Gmail is temporarily rate-limiting, all 3 retries are consumed in under 10 milliseconds, permanently failing the job.
- **Severity:** High (P0)
- **Recommended Fix:** Implement delay or backoff header inspection, or delay requeueing to prevent instant retry exhaustion.
- **Decision:** **FIX (P0)**

### F3. Outbox Event Upsert Does Not Re-Queue Failed Events
- **File:** `lib/rabbitmq/outbox.ts`
- **Problem:** In `createOutboxEvent`, `upsert` specifies `update: {}`. If an event key exists in `FAILED` status, calling `createOutboxEvent` does not reset it to `PENDING` or increment attempts, so it remains stuck in `FAILED`.
- **Severity:** Medium (P1)
- **Recommended Fix:** Allow `update: { status: "PENDING", error: null }` when re-enqueuing an existing event key.
- **Decision:** **FIX (P1)**

---

## G. AI PROBLEMS

### G1. Prompt Injection Vulnerability in Gemini Prompts
- **File:** `lib/ai/classifyLead.ts` & `lib/ai/personalizeEmail.ts`
- **Problem:** User-supplied fields (`lead.companyName`, `lead.notes`, `lead.contactPerson`) are directly interpolated into Gemini prompt strings without sanitation or boundary encapsulation. A malicious prospect could inject instruction overrides.
- **Severity:** Medium (P1)
- **Recommended Fix:** Sanitize input strings (strip delimiters, cap character length) and enclose lead data inside structured `<prospect_data>` XML tags with explicit system directives.
- **Decision:** **FIX (P1)**

### G2. Fake AI Metrics Displayed in UI
- **File:** `app/(dashboard)/leads/page.tsx` & `app/(dashboard)/leads/[id]/page.tsx`
- **Problem:** The detail drawer renders hardcoded static strings: `94% Confidence`, `98% Compatibility`, `High Intent`, `Deliverability: Verified Active`.
- **Severity:** Medium (P2)
- **Recommended Fix:** Bind UI badges strictly to actual database columns: `lead.leadScore`, `lead.aiConfidence`, `lead.aiReasoning`, `lead.buyerIntent`, and `lead.emailStatus`.
- **Decision:** **FIX (P2)**

---

## H. TESTING GAPS

### H1. Minimal High-Risk Workflow Test Coverage
- **File:** `tests/`
- **Problem:** Only 4 unit tests exist (email validator, token encryption, lead scoring heuristics, unsubscribe token). There are zero automated tests covering:
  - Authentication & JWT issuance / rejection.
  - Role-based authorization & permission checks.
  - Outbox event generation and state updates.
  - Consumer malformed message rejection.
  - Lead CRUD and validation constraints.
- **Severity:** High (P1)
- **Recommended Fix:** Add comprehensive test suites using the native `tsx --test` test runner targeting high-risk failure modes.
- **Decision:** **FIX (P1)**

---

## I. UI/UX PROBLEMS

### I1. Broken Mobile Layout & Sidebar Blocking
- **File:** `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopNavbar.tsx`
- **Problem:** Sidebar and Navbar use unconditional `ml-[240px]` or `ml-[72px]`. On mobile screens (<768px), the main viewport is crushed offscreen. There is no mobile overlay backdrop or hamburger menu button.
- **Severity:** High (P2)
- **Recommended Fix:** Implement responsive mobile navigation: hide fixed sidebar on mobile (`hidden md:flex`), add a slide-out mobile drawer with backdrop overlay, add hamburger toggle in `TopNavbar`, and use `md:ml-[240px]` on main content.
- **Decision:** **FIX (P2)**

### I2. Sidebar Navigation Grouping Polish
- **File:** `components/layout/Sidebar.tsx`
- **Problem:** Current sidebar navigation groupings could be better structured for B2B CRM workflows (Workspace, Outreach, Intelligence, Management, Admin).
- **Severity:** Medium (P2)
- **Recommended Fix:** Re-organize navigation items logically into clear functional sections matching existing application routes.
- **Decision:** **FIX (P2)**

### I3. Missing Empty and Error States
- **File:** Multiple pages in `app/(dashboard)/`
- **Problem:** Certain views (opportunities kanban, analytics empty data, campaign recipient lists) show blank screens or generic text when data is empty or requests fail.
- **Severity:** Medium (P2)
- **Recommended Fix:** Standardize empty state illustrations with actionable call-to-action buttons.
- **Decision:** **FIX (P2)**

---

## J. PERFORMANCE PROBLEMS

### J1. Unpaginated Opportunity & Quotation Queries
- **File:** `app/api/opportunities/route.ts`, `app/api/quotations/route.ts`
- **Problem:** Routes fetch all records with `findMany` without pagination or limiting, leading to large responses as the database grows.
- **Severity:** Medium (P1)
- **Recommended Fix:** Add pagination parameters (`page`, `limit`) and sensible defaults (`take: 50`).
- **Decision:** **FIX (P1)**

---

## K. DEPLOYMENT PROBLEMS

### K1. Missing Dockerfile and Dockerfile.worker
- **File:** `docker-compose.yml`
- **Problem:** `docker-compose.yml` specifies `build: { dockerfile: Dockerfile }` for the web app and `build: { dockerfile: Dockerfile.worker }` for workers. Neither file exists in the repository, making containerized deployment impossible.
- **Severity:** Critical (P0)
- **Recommended Fix:** Create production multi-stage `Dockerfile` (Next.js standalone build) and `Dockerfile.worker` (worker runner).
- **Decision:** **FIX (P0)**

---

## L. DOCUMENTATION PROBLEMS

### L1. Inaccurate Claims & Missing Architectural Documents
- **File:** `README.md` and missing `docs/`
- **Problem:** README claims SQLite support when PostgreSQL-specific enums are used throughout Prisma schema; claims rate limiting when none is present. Missing architectural docs for Outbox, AI, interview preparation, and verified resume claims.
- **Severity:** Medium (P1)
- **Recommended Fix:** Update README with verified facts, and generate complete architecture documents (`docs/ARCHITECTURE.md`, `docs/OUTBOX_RABBITMQ.md`, `docs/AI_ARCHITECTURE.md`, `docs/INTERVIEW_GUIDE.md`, `docs/RESUME_CLAIMS.md`).
- **Decision:** **FIX (P1)**

---

## M. OPTIONAL IMPROVEMENTS (P3)
1. Add subtle keyboard shortcut tooltips to table rows.
2. Add quick filter chips for one-click buyer stage filtering.
*(Note: These will only be addressed after all P0, P1, and P2 objectives are met.)*
