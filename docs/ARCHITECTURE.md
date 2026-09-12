# System Architecture: EXPORT AI CRM

## 1. Overview & Business Problem

**EXPORT AI** is a specialized Enterprise B2B Export Sales Operating System designed for wholesale exporters of handmade Himalayan wellness instruments (Tibetan singing bowls, 7-chakra tuned sets, gongs, and meditation accessories).

International wholesale B2B trade differs fundamentally from standard B2C or domestic real estate CRM systems:
* **High Transaction Values & Protracted Sales Cycles**: Deals range from $2,000 to $50,000+ USD per wholesale shipment, requiring multi-touch outreach, Incoterms negotiation (FOB, CIF, EXW), and proforma quotation workflows.
* **Complex Data Ingestion & Quality**: Wholesale prospects are discovered across international buyer directories, requiring RFC-5322 compliance verification, MX record verification, and disposable email filtering before outreach.
* **Asynchronous Long-Running Jobs**: Lead discovery, AI classification via Google Gemini, bulk email validation, Gmail API quota-managed outreach, and PDF quotation generation cannot block HTTP requests.
* **Dual-Write Reliability**: When an inquiry is ingested, the lead record and the background job event must succeed or fail together. Losing a background task results in stranded prospects; publishing to a message broker when the database rollbacks causes orphan phantom processing.

---

## 2. End-to-End System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT BROWSER                                  │
│   Next.js 16 (React 19, Tailwind CSS v4, Lucide Icons, Responsive Shell)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EDGE MIDDLEWARE & REVERSE PROXY                          │
│   - Security Headers (HSTS, X-Frame-Options, CSP, Referrer-Policy)          │
│   - Route Protection & Authentication Redirection (/dashboard/*, /leads/*) │
│   - Sliding-Window In-Memory Rate Limiting (/api/auth/*, /api/discovery/*)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS API ROUTER                                 │
│   - Route Handlers (/api/leads, /api/auth, /api/opportunities, etc.)        │
│   - JWT Verification (HMAC-SHA256, >=32-char secret in production)          │
│   - Role-Based Access Control (ADMIN, MANAGER, AGENT)                       │
│   - Request Schema Validation (Zod v4 with strict parameter whitelisting)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRISMA ORM & DATABASE LAYER                          │
│   - PostgreSQL 16 (Managed via Prisma Schema)                               │
│   - ACID Transactions: Lead Mutation + OutboxEvent creation ($transaction)  │
│   - Cascading Deletions: Activities, FollowUps, Tasks, Notifications        │
│   - Query-Optimized B-tree & Compound Indexes                               │
└──────────────────┬──────────────────────────────────────▲───────────────────┘
                   │ Atomically Commits Outbox Event       │
                   ▼                                       │ Workers Read/Update
┌──────────────────────────────────────┐                   │ Records & JobLogs
│      POSTGRESQL OUTBOX TABLE         │                   │
│   - status: PENDING / PUBLISHED      │                   │
│   - attempts, payload, error         │                   │
└──────────────────┬───────────────────┘                   │
                   │ Polling & Flush (`flushPendingOutbox`)│
                   ▼                                       │
┌──────────────────────────────────────────────────────────┴──────────────────┐
│                           RABBITMQ BROKER (AMQP)                            │
│   - Main Topic Exchange: `export.jobs.exchange`                             │
│   - Dead Letter Exchange: `export.dlx` (Direct DLQ: `dead-letter.queue`)    │
│   - Queues: discovery.queue, validation.queue, ai.queue, email.queue, etc.  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Manual Ack / Controlled Retry / Nack
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DISTRIBUTED WORKER PROCESS POOL                         │
│   - Discovery Worker: Simulates B2B wholesale directory crawling            │
│   - Validation Worker: RFC-5322 syntax, domain MX, role-account checks      │
│   - AI Classification Worker: Gemini 1.5 Flash + Fallback intent engine     │
│   - Campaign Email Worker: Gmail OAuth2 rate-paced delivery                 │
│   - PDF Report Worker: Proforma Quotation and Export Catalog generator      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Selection Rationale

| Component | Technology | Rationale & Trade-offs |
|---|---|---|
| **Frontend Framework** | Next.js 16.2.4 (App Router) | Combines server-side rendering for initial load performance with rich React 19 interactive client components for CRM tables and drawers. |
| **Styling & UI** | Tailwind CSS v4 | Provides atomic utility classes and CSS variables for a modern B2B SaaS dark theme (`#070A0F`), avoiding heavy component library overhead. |
| **Language** | TypeScript 5 | Strict static typing across API payloads, database models, and worker payloads ensures compile-time contract enforcement. |
| **Database** | PostgreSQL 16 | ACID transactions, foreign keys, row-level locks, and strong relational integrity are required for wholesale financial quotations and lead ownership. |
| **ORM** | Prisma 5.22.0 | Type-safe database client, schema migrations, and declarative relation cascades (`onDelete: Cascade`, `onDelete: SetNull`). |
| **Message Broker** | RabbitMQ 3.12 (AMQP) | Reliable, battle-tested message broker with support for durable queues, topic routing, manual consumer ACKs, and dead-letter routing (DLX). |
| **Pattern** | Transactional Outbox | Eliminates the dual-write problem by saving business changes and event messages in the same database transaction. |
| **AI Engine** | Google Gemini API (`@google/generative-ai`) | Fast, structured commercial fit scoring and personalized B2B outreach email draft generation. |
| **Authentication** | Jose (Stateless JWT) | Secure HMAC-SHA256 token signing with strict production secret validation (>=32 characters) and refresh token rotation. |

---

## 4. Key Architectural Patterns

### 4.1 The Dual-Write Problem & Transactional Outbox
When an API handler receives a request to import leads or qualify a buyer, it must update PostgreSQL and notify background workers via RabbitMQ. 
* If the broker is called first and the DB commit fails: a ghost worker processes data that does not exist.
* If the DB commits first and the broker is unreachable: the database holds a lead that will never be processed.

**Solution**: The handler inserts the `BuyerLead` and an `OutboxEvent` inside a single `prisma.$transaction`. Both commit atomically. An outbox worker or post-commit publisher polls pending events and delivers them to RabbitMQ. If the broker is temporarily down, the event remains `PENDING` in the database until the broker recovers.

### 4.2 Dead-Letter Queue (DLQ) & Resilience
Every work queue is asserted with arguments:
```json
{
  "x-dead-letter-exchange": "export.dlx",
  "x-dead-letter-routing-key": "dead-letter"
}
```
* **Malformed Payloads**: Unparseable JSON or corrupt messages are immediately rejected via `channel.nack(msg, false, false)` and routed straight to the DLQ without entering endless retry loops.
* **Retryable Failures**: Transient exceptions (e.g., external API timeout) retry up to `maxRetries` (3 attempts) with exponential backoff (1s, 2s, 4s). Once exhausted, the message is routed to `dead-letter.queue` and logged in `JobLog`.

### 4.3 Input Sanitization & Prompt Delimiters
Prospect data is untrusted input. Lead text is sanitized (stripping control codes, markdown link hacks, and delimiter tags) and enclosed in strict XML tags (`<prospect_data>...</prospect_data>`) before being sent to Gemini. Output is validated against Zod schemas, with a deterministic rule-based heuristic fallback if Gemini is unavailable.
