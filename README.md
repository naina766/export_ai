# 🔮 EXPORT AI — Enterprise B2B Export Sales Operating System
### AI-Assisted Buyer Qualification, Gmail Outreach, Transactional Outbox & Wholesale Export Workflows

**EXPORT AI** is a production-grade B2B Sales Operating System tailored for international wholesale exporters of artisanal Himalayan sound wellness instruments (Tibetan hand-hammered singing bowls, 7-chakra tuned sets, gongs, and meditation accessories).

The system coordinates provider-based wholesale buyer discovery (with simulated providers for development/testing), Google Gemini 1.5 Flash commercial qualification, automated Gmail outreach campaigns with human approval gating, proforma quotation calculation (FOB/CIF/EXW), and a distributed RabbitMQ background worker cluster operating with the **Transactional Outbox pattern**.

---

## 🌟 Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Next.js 16 App Router Frontend                        │
│   • Command Center Dashboard (Live DB)   • 8-Stage Sales Pipeline Kanban    │
│   • Buyer Discovery Cockpit              • Proforma Quotation Summary       │
│   • Dense Buyer Leads CRM Directory      • 6-Step AI Outreach Campaign      │
│   • Tabbed CRM Detail Experience         • Responsive Mobile Drawer Shell   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes & Edge Middleware                     │
│   • Route Authentication Guard           • Sliding-Window Rate Limiting     │
│   • Strict Zod Schema Validation         • Security Headers (HSTS, CSP)     │
│   • Role-Based Access Control (RBAC)     • Gmail OAuth2 Integration         │
│   • Single-Use Signed OAuth State        • SHA-256 Hashed Refresh Tokens    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL 16 via Prisma ORM                         │
│   • ACID Transactions ($transaction)     • Query-Backed B-tree Indexes      │
│   • Foreign Key Referential Integrity    • Cascade Deletion Rules           │
│   • Safe First-Admin Bootstrap Locking   • Default False AI Email Approval  │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ Commits Atomically Inside Local Transaction
                   ▼
┌──────────────────────────────────────┐
│       Transactional Outbox Table     │
│   • status: PENDING / PUBLISHED      │
│   • compound index: [status, created]│
└──────────────────┬───────────────────┘
                   │ Polling & Publisher Confirms (`publishOutboxEvent`)
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RabbitMQ Message Broker                             │
│   • Main Topic Exchange: `export.jobs.exchange`                             │
│   • Dead Letter Exchange: `export.dlx` (Queue: `dead-letter.queue`)         │
│   • Publisher Confirm Channels: Explicit broker ACKs before status updates  │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ Manual ACK / Exponential Backoff / DLQ Nack
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Distributed Background Workers                         │
│   • discovery.queue: Provider-based buyer discovery pipeline (simulated)   │
│   • validation.queue: RFC-5322 syntax, disposable blocklists & role checks │
│   • ai.queue: Gemini 1.5 Flash evaluation with heuristic fallback engine    │
│   • email.queue: Paced Gmail API outreach (enforcing isApproved gate)       │
│   • report.queue: Performance metrics aggregation & quotation summary       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

* **Lead Command Center & Analytics**: Live database reporting (`/api/analytics/overview`, `/api/analytics/funnel`) displaying real buyer counts, conversion funnel stages, and country distributions with skeleton loading and error states.
* **Transactional Outbox & Broker Confirms**: Eliminates dual-write anomalies across PostgreSQL mutations and RabbitMQ publishing. Events and leads commit atomically; events are only marked `PUBLISHED` after RabbitMQ broker confirmation (`ConfirmChannel`).
* **Resilient RabbitMQ Consumers**: Malformed JSON payloads are immediately routed to Dead-Letter Queues without infinite retry loops; transient failures use exponential backoff (1s, 2s, 4s).
* **Enterprise Security & RBAC**:
  * Public registration privilege escalation eliminated (users assigned `AGENT` unless first-user bootstrap with table-level serialization).
  * Cryptographic SHA-256 hash storage of refresh tokens (raw tokens never stored or logged in PostgreSQL).
  * Single-use HMAC-signed OAuth state with replay protection, clock-skew checks, and TTL expiry.
  * Fail-closed unsubscribe token verification in production with constant-time HMAC comparison.
  * Strict JWT secret length validation (`>= 32` characters in production).
  * Protected lead and campaign deletion enforcing `ADMIN`, `MANAGER`, or owner authorization with transactional child cleanup.
  * In-memory sliding-window rate limiting on authentication and discovery endpoints.
  * 10MB file upload size cap with MIME-type whitelisting.
  * Sanitized unsubscribe endpoints preventing stored or reflected XSS.
* **AI Qualification with Heuristic Fallback**:
  * Google Gemini 1.5 Flash prompt structure protected by `<prospect_data>` XML containers.
  * Strict Zod output schema validation.
  * Deterministic rule-based scoring engine kicks in during API outages, rate limits, or missing keys.
  * **Human Approval Gate**: AI drafts default to `isApproved: false` in the database schema; email dispatch strictly refuses unapproved drafts.
* **Complete Responsive SaaS Layout**: 5-group organized sidebar navigation, mobile drawer with backdrop, and full table pagination with Next.js client routing.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.4 (App Router, Server Actions, React 19) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 5.22.0 |
| **Message Broker** | RabbitMQ 3.12 (AMQP Protocol) |
| **Styling** | Tailwind CSS v4 |
| **Authentication** | Jose (Stateless HMAC-SHA256 JWT, Refresh Token Rotation) |
| **Validation** | Zod v4 |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai`) |
| **Email** | Google APIs (`googleapis` for Gmail OAuth2) |
| **Testing** | Node.js Test Runner (`tsx --test`) |
| **Containerization** | Docker, Docker Compose |

---

## 📚 Technical Documentation Index

Detailed architectural and engineering documents are available in the `docs/` directory:

1. 📖 **[System Architecture Guide](docs/ARCHITECTURE.md)**: Deep dive into the client, API, database, messaging, and worker layers.
2. 🔄 **[RabbitMQ & Transactional Outbox](docs/OUTBOX_RABBITMQ.md)**: The dual-write problem, transaction mechanics, topology, and DLQ routing.
3. 🤖 **[AI Integration & Security](docs/AI_ARCHITECTURE.md)**: Prompt injection defense, input sanitization, Zod output schemas, and fallback scoring.

---

## 💻 Local Setup & Development

### 1. Prerequisites
* Node.js 20+
* Docker & Docker Compose (or local PostgreSQL 16 and RabbitMQ 3.12)
* npm

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/naina766/export_ai.git
cd export_ai
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

Key environment variables:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/export_ai_crm?schema=public"

# Authentication (Minimum 32 characters in production)
JWT_SECRET="development-secret-key-at-least-32-chars-long-for-hmac-sha256"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# RabbitMQ
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_EXCHANGE="export.jobs.exchange"
RABBITMQ_DLX="export.dlx"

# Google Gemini AI (Optional for testing; fallback will activate if unset)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
```

### 4. Initialize Database
```bash
# Push schema and generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample export buyers, products, and campaigns
npm run db:seed
```

### 5. Launch Background Workers
In a separate terminal window:
```bash
npm run workers
```

### 6. Start the Web Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Setup

Run the full stack (PostgreSQL, RabbitMQ, Next.js Web App, and Worker pool) using Docker Compose:

```bash
# Build and launch all services in detached mode
docker compose up --build -d

# Check service logs
docker compose logs -f app
docker compose logs -f worker

# Stop containers
docker compose down
```

---

## 🧪 Automated Testing & Verification

Run the test suite covering authentication, RBAC, outbox state transitions, rate limiting, and lead validation:

```bash
# Run all automated unit and integration tests
npm test

# Run TypeScript strict type-checking
npx tsc --noEmit

# Run ESLint
npm run lint

# Build production bundle
npm run build
```

---

## 🛡️ Default Demo Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@exportai.com` | `Admin@123456` | System Configuration, User Management, Global Deletions |
| **Manager** | `manager@exportai.com` | `Manager@123456` | Campaigns, Leads, Pipeline, Quotations & Discovery |
| **Agent** | `agent@exportai.com` | `Agent@123456` | Assigned Leads, Quotations & Outreach |
