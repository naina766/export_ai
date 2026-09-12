# Comprehensive Engineering Interview Guide: EXPORT AI CRM

This guide contains interview questions and rigorous, code-grounded answers based **strictly on the actual implementation** of the EXPORT AI codebase.

---

## 1. Project & Domain

### Q: What problem does this project solve?
**A:** EXPORT AI is an Enterprise B2B Export Sales Operating System tailored for wholesale exporters of Himalayan wellness instruments (Tibetan hand-hammered singing bowls, tuned chakra sets, and meditation accessories). Unlike domestic B2C sales, wholesale exports involve $2,000–$50,000+ orders, Incoterms negotiations (FOB, CIF, EXW), directory discovery, RFC-5322 email validation, and long-running AI qualification workflows. The system coordinates lead ingestion, AI commercial scoring, and quotation pipelines across a distributed worker pool with dual-write safety.

### Q: Can you walk me through the end-to-end architecture?
**A:** 
1. **Client**: Next.js 16 App Router UI with responsive sidebar drawer, tabular data views, and command palette.
2. **Edge / Middleware**: Security headers (HSTS, CSP, X-Frame-Options), route authentication guards, and in-memory sliding-window rate limiters.
3. **API & Business Logic**: Next.js route handlers validate inputs with Zod schemas and enforce role-based access control (RBAC).
4. **Data Persistence**: Prisma ORM executes ACID transactions against PostgreSQL 16.
5. **Event Delivery**: In the same database transaction as the lead creation, an `OutboxEvent` is committed.
6. **Message Broker**: An outbox publisher flushes pending events to RabbitMQ topic exchanges (`export.jobs.exchange`).
7. **Workers**: Independent background workers consume from dedicated queues with manual ACKs, exponential retry backoff, and dead-letter queue routing (`export.dlx`).
8. **Downstream Integrations**: Gemini 1.5 Flash for qualification, Gmail OAuth2 for outreach, and jsPDF for proforma quotations.

### Q: What was the hardest engineering challenge in this project?
**A:** Solving the dual-write problem between PostgreSQL and RabbitMQ. Initially, publishing directly from route handlers created orphan records whenever RabbitMQ suffered transient connection latency. Implementing the Transactional Outbox pattern with atomic `$transaction` commits, idempotent re-enqueue logic, and consumer DLQ routing ensured that business data and messaging events never get out of sync.

### Q: What is the biggest limitation of the current architecture?
**A:** The rate limiter and outbox polling are currently in-process/in-memory. For a horizontally auto-scaled multi-container deployment, the rate limiter would need a distributed Redis store to share sliding-window request counts, and outbox event polling would require distributed locking (such as PostgreSQL `FOR UPDATE SKIP LOCKED` or advisory locks) to prevent concurrent polling workers from picking up the same pending event.

---

## 2. PostgreSQL & Prisma

### Q: Why PostgreSQL instead of MongoDB or SQLite?
**A:** Wholesale export sales require strict relational integrity. Quotations link to Opportunities, which link to BuyerLeads, which own Activities, FollowUps, and Tasks. Furthermore, proforma quotations calculate financial totals with line-item currency values and foreign key constraints. PostgreSQL provides full ACID transactional guarantees, row-level locking, and rich indexing capabilities required for commercial financial systems.

### Q: What indexes did you add and why?
**A:** 
* `buyer_leads`: Indexes on `assignedToId`, `createdById`, and `createdAt` to support filtering by owner, creator, and chronological pagination.
* `outbox_events`: Compound index on `[status, createdAt]` specifically optimized for the outbox worker polling query (`WHERE status = 'PENDING' ORDER BY createdAt ASC`).
* `activities`: Indexes on `leadId`, `userId`, `opportunityId`, and `createdAt` for rapid timeline rendering.
* `follow_ups`: Indexes on `userId`, `leadId`, `scheduledAt`, and `isCompleted` for task scheduling lookups.
* `quotations`: Indexes on `leadId`, `opportunityId`, and `status`.

### Q: How do transactions prevent data corruption during lead deletion?
**A:** When a lead is deleted in `app/api/leads/[id]/route.ts`, multiple related child records must be safely cleaned up. We use `prisma.$transaction` to atomically delete child `Activity`, `FollowUp`, `Task`, `Notification`, and `Quotation` records before deleting the parent lead. If any deletion fails, the entire transaction rolls back, preventing foreign key constraint violations and orphan records.

---

## 3. RabbitMQ & Messaging

### Q: Why use RabbitMQ instead of processing everything synchronously in API routes?
**A:** Operations like bulk lead directory scraping, RFC-5322 DNS MX lookups, Google Gemini AI API calls, and PDF generation have high or unpredictable latency (500ms to 10+ seconds). Running them synchronously in HTTP handlers would cause HTTP request timeouts (504 Gateway Timeout), degrade user experience, and risk thread exhaustion on the web server. RabbitMQ buffers workload spikes and allows workers to process jobs asynchronously at a controlled pace.

### Q: What happens if RabbitMQ goes down?
**A:** Because of the Transactional Outbox pattern, the API route does not depend on RabbitMQ being online. The business data and the `OutboxEvent` (status: `PENDING`) are committed to PostgreSQL. When RabbitMQ comes back online, the outbox flush worker discovers pending events and publishes them to the broker. The worker processes also feature a boot standby loop that retries connection every 5 seconds instead of crashing.

### Q: What is a Dead-Letter Queue (DLQ) and how do you use it?
**A:** A DLQ is an exchange/queue destination where messages are routed when they cannot be processed. In our system:
1. **Malformed JSON**: Caught during JSON parsing in `lib/rabbitmq/consumer.ts`. These are immediately rejected via `channel.nack(msg, false, false)` without useless retries.
2. **Max Retries Exceeded**: When a retryable error occurs, the message is retried up to 3 times with exponential backoff (1s, 2s, 4s). If all 3 attempts fail, it is nacked without requeue and routed to `dead-letter.queue` for debugging.

### Q: How do you achieve idempotent processing?
**A:** Network partitions can cause duplicate message deliveries (at-least-once delivery). In our workers, every event carries a unique `eventId` and `eventKey` (e.g. `lead:123:classify`). The consumer logs job status to `JobLog` using an `upsert` on the unique `id`. In addition, business updates check current entity state before making duplicate changes.

---

## 4. Artificial Intelligence (Gemini)

### Q: How do you prevent prompt injection?
**A:**
1. **Input Sanitization**: We strip control characters, backticks, and HTML/XML brackets to prevent tag escaping.
2. **Explicit XML Delimiters**: Prospect data is wrapped inside `<prospect_data>...</prospect_data>`.
3. **Strict Boundary Directives**: The system prompt instructs Gemini to treat everything inside the delimiters strictly as data to be evaluated, never as instructions to execute.
4. **Zero AI Authorization**: Gemini is **never** permitted to make authorization, role assignment, or financial deletion decisions. It only outputs analytical metadata.

### Q: How do you handle AI failures or hallucinations?
**A:**
1. **Output Schema Validation**: The response from Gemini is parsed with a strict Zod schema (`QualificationResultSchema`). If fields are missing, out of range, or hallucinated, the parse throws an error.
2. **Deterministic Fallback**: If Gemini fails, times out, or the API key is missing, `calculateFallbackLeadScore()` calculates a deterministic heuristic score based on buyer type, verified email domain, and export market.

---

## 5. Security & RBAC

### Q: What security vulnerabilities did you identify and resolve?
**A:**
1. **Registration Privilege Escalation**: The original `RegisterSchema` allowed the client to supply `role: "ADMIN"`. We removed `role` from the schema and enforced `role: isFirstUser ? "ADMIN" : "AGENT"`.
2. **Weak JWT Secret Fallback**: Replaced hardcoded fallback secrets with `getJwtSecret()`, enforcing a minimum 32-character secret length and throwing a fatal error if missing in production.
3. **Unauthenticated User Enumeration**: Added authentication checks to `GET /api/users/:id` returning 401 for anonymous requests.
4. **Unauthorized Lead Deletion**: Enforced RBAC check allowing only `ADMIN`, `MANAGER`, or the assigned lead owner to execute DELETE requests.
5. **Reflected XSS in Unsubscribe**: Added HTML escaping to query parameters rendered in the unsubscribe confirmation page.
6. **Unrestricted File Uploads**: Enforced a 10MB size limit and a MIME-type whitelist before buffer allocation.
7. **Arbitrary Database Field Sorting**: Whitelisted allowed `sortBy` fields in `/api/leads`.

### Q: How does your rate limiting work?
**A:** We implemented an in-memory sliding-window rate limiter (`lib/security/rate-limit.ts`) that tracks client request timestamps. For sensitive auth endpoints (`/api/auth/login`, `/api/auth/register`), requests exceeding the threshold receive a `429 Too Many Requests` response with standard headers (`Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`).
