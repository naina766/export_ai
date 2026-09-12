# Verified Resume Claims: EXPORT AI CRM

This document catalogues technical resume claims against **actual verifiable code evidence** in this repository. 

> **Important Rule**: Only claims marked with **Safe to Use: YES** should be included on a technical resume or discussed during technical interviews. Unverified metrics or fabricated statistics have been audited and explicitly marked as unsafe.

---

## Verified Claims Matrix

| # | Resume Bullet Claim | Source Code Location | Verifiable Evidence | Safe to Use? |
|---|---|---|---|---|
| 1 | **Architected a distributed B2B CRM using Next.js 16, TypeScript, PostgreSQL 16, and Prisma ORM to manage international wholesale export sales workflows.** | `app/`, `prisma/schema.prisma`, `package.json` | 20+ Prisma database models, Next.js App Router layout, full CRUD on BuyerLeads, Quotations, and Opportunities. | **YES** |
| 2 | **Implemented the Transactional Outbox pattern with RabbitMQ to eliminate the dual-write problem across distributed database writes and asynchronous message publishing.** | `lib/rabbitmq/outbox.ts`, `prisma/schema.prisma` | Atomic `prisma.$transaction` creating `BuyerLead` and `OutboxEvent`; compound index on `[status, createdAt]` for batch polling flush. | **YES** |
| 3 | **Engineered resilient RabbitMQ consumer pipelines with topic exchange routing, manual ACKs, exponential retry backoff, and dead-letter queue (DLQ) routing for unparseable messages.** | `lib/rabbitmq/consumer.ts`, `lib/rabbitmq/topology.ts` | Immediate `channel.nack(false, false)` for malformed JSON, exponential delay (1s, 2s, 4s), and DLX routing to `dead-letter.queue`. | **YES** |
| 4 | **Hardened enterprise authentication and RBAC by eliminating public registration privilege escalation and enforcing a 32-character minimum HMAC-SHA256 JWT secret in production.** | `app/api/auth/register/route.ts`, `lib/validations/index.ts`, `lib/auth.ts` | Stripped `role` from public `RegisterSchema`; `getJwtSecret()` throws fatal error if secret is missing or <32 characters in production; verified in automated tests. | **YES** |
| 5 | **Integrated Google Gemini 1.5 Flash with XML prompt delimiters, input sanitization, and strict Zod schema parsing, paired with a deterministic heuristic fallback lead-scoring engine.** | `lib/ai/classifyLead.ts`, `lib/ai/gemini.ts` | Inputs wrapped in `<prospect_data>` XML containers; Zod schema validation for scores (0–100) and enums; rule-based fallback for API outages. | **YES** |
| 6 | **Designed a tabbed B2B SaaS CRM interface with responsive slide-out drawer, live database KPI metrics, real-time funnel stages, and tabular pagination.** | `components/layout/Sidebar.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/leads/page.tsx` | Responsive mobile navigation (<768px drawer), real data fetched from `/api/analytics/overview` and `/api/analytics/funnel`, Next.js router navigation. | **YES** |
| 7 | **Implemented defense-in-depth API security including sliding-window in-memory rate limiting, Content Security Policy headers, MIME-type validated file uploads, and transactional cascade deletions.** | `lib/security/rate-limit.ts`, `next.config.ts`, `app/api/upload/route.ts`, `app/api/leads/[id]/route.ts` | 429 rate limit enforcement, 10MB upload limit with MIME-type whitelist, XSS escaping in unsubscribe handler. | **YES** |
| 8 | **Authored an automated unit and integration test suite using Node.js test runner covering token verification, role rejection, outbox state progression, and rate limiting.** | `tests/auth-rbac.test.ts`, `tests/outbox-resilience.test.ts`, `tests/crm-workflow.test.ts` | 25 automated tests executed via `tsx --test` with 100% pass rate. | **YES** |
| 9 | **Containerized the full-stack application and background worker processes into multi-stage Alpine Docker images orchestrated via Docker Compose.** | `Dockerfile`, `Dockerfile.worker`, `docker-compose.yml` | Multi-stage Next.js standalone runner, dedicated worker container, healthy service dependency orchestration. | **YES** |

---

## 🚫 Fabricated / Unverified Claims (DO NOT USE)

| Proposed Claim | Why It Is Unsafe | Safe to Use? |
|---|---|---|
| *"Increased query performance by 85% by adding compound database indexes"* | No historical query latency benchmarks exist in the repository to substantiate an exact 85% claim. (Use instead: *Added query-backed B-tree and compound indexes to optimize lead lookup and outbox worker polling.*) | **NO** |
| *"Achieved 99.99% system availability and zero message loss across millions of leads"* | The project has not been operated in a production cluster with continuous Prometheus/Grafana monitoring to prove four-nines SLA. | **NO** |
| *"Trained custom Gemini models to achieve 98.4% AI accuracy"* | The system uses prompt engineering with Gemini 1.5 Flash foundation model and deterministic fallback rules, not custom fine-tuned weights. | **NO** |
| *"Engineered microservices architecture with Apache Kafka and Redis cluster"* | The architecture uses Next.js route handlers, PostgreSQL, and RabbitMQ. Introducing fake technologies for resume keywords will disqualify you in technical interviews. | **NO** |
