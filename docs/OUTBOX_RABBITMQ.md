# RabbitMQ & The Transactional Outbox Pattern

## 1. The Dual-Write Problem

In a distributed or event-driven architecture, business operations often require two distinct actions:
1. Mutating the operational database (e.g. inserting a `BuyerLead`).
2. Publishing an event to a message broker (e.g. publishing to RabbitMQ for AI classification).

If these two actions are performed independently without a shared distributed transaction (which is slow, fragile, and not supported across HTTP/AMQP boundaries), dual-write failures inevitably occur:

### Failure Scenario A: Publish-First Failure
```text
Client Request
      │
      ▼
1. Publish to RabbitMQ (Success)
      │
      ▼
2. Write to PostgreSQL (FAILS: DB constraint error / network disconnect)
      │
      ▼
Result: Phantom Event.
The worker picks up the job, searches PostgreSQL for `lead_123`, finds nothing, and crashes or throws an error.
```

### Failure Scenario B: Database-First Failure
```text
Client Request
      │
      ▼
1. Write to PostgreSQL (Success & Committed)
      │
      ▼
2. Publish to RabbitMQ (FAILS: RabbitMQ broker rebooting / network timeout)
      │
      ▼
Result: Stranded Record.
The lead exists in PostgreSQL, but the background event is lost forever. The buyer is never classified or contacted.
```

---

## 2. The Transactional Outbox Solution

The **Transactional Outbox Pattern** solves the dual-write problem by leveraging the ACID guarantees of the relational database.

Instead of publishing directly to RabbitMQ during the HTTP request lifecycle, the application writes the business record AND an `OutboxEvent` record within the **same local database transaction**.

```text
┌──────────────────────────────────────────────────────────┐
│                   PRISMA TRANSACTION                     │
│                                                          │
│   1. INSERT INTO "buyer_leads" (...)                     │
│   2. INSERT INTO "outbox_events" (                       │
│        eventKey: "lead:123:classify",                    │
│        eventType: "AI_CLASSIFY",                         │
│        status: "PENDING",                                │
│        attempts: 0,                                      │
│        payload: { leadId: "123" }                        │
│      )                                                   │
└────────────────────────────┬─────────────────────────────┘
                             │
                      Commit or Rollback
                             │
                             ▼
                  Either BOTH succeed
                    or BOTH fail
```

### Event Lifecycle & State Progression
* **`PENDING`**: Event created within database transaction; awaiting publication to RabbitMQ broker.
* **`PUBLISHED`**: Successfully confirmed by RabbitMQ broker (`channel.publish()` succeeded). `publishedAt` timestamp recorded.
* **`FAILED`**: Publication failed (e.g., broker unreachable). Available for batch polling flush.
* **Re-enqueue Resilience**: If an aggregate event is re-triggered, `upsert` resets the status back to `PENDING`, sets `error: null`, and increments `attempts`.

---

## 3. RabbitMQ Topology & Routing

The application defines a durable, resilient topology in `lib/rabbitmq/topology.ts`:

### Exchanges
1. **`export.jobs.exchange`** (`topic`, durable: `true`): Routes asynchronous tasks to queues based on routing keys.
2. **`export.dlx`** (`direct`, durable: `true`): Dead-letter exchange that receives unparseable or retry-exhausted messages.

### Routing Keys & Work Queues
| Queue Name | Routing Key | Purpose |
|---|---|---|
| `discovery.queue` | `discovery.start` | Runs international wholesale directory crawling |
| `validation.queue` | `validation.email` | RFC-5322 syntax, domain MX, and disposable checks |
| `ai.queue` | `ai.classify` | Gemini 1.5 Flash commercial fit evaluation |
| `email.queue` | `campaign.send` | Paced Gmail API outreach delivery |
| `report.queue` | `report.generate` | PDF quotation and export catalog rendering |
| `dead-letter.queue` | `dead-letter` | Dead-letter queue for inspection and alerting |

---

## 4. Consumer Resilience, Retries & Dead Letter Queue (DLQ)

The consumer (`lib/rabbitmq/consumer.ts`) implements enterprise safety controls:

### 1. Immediate DLQ Routing for Malformed JSON
Unparseable messages (invalid syntax or non-object payloads) will never succeed on retry. The consumer catches the parse error, logs an alert, and rejects immediately:
```typescript
channel.nack(msg, false, false); // requeue = false routes directly to DLX
```

### 2. Controlled Exponential Backoff
For transient worker errors, the consumer inspects `headers["x-retry-count"]`:
* Attempt 1: 1,000 ms backoff
* Attempt 2: 2,000 ms backoff
* Attempt 3: 4,000 ms backoff (capped at 10,000 ms)
* Attempt 4+: Exceeds `maxRetries` (3) → sent to DLQ via `channel.nack(msg, false, false)`.

### 3. Broker Boot Standby Loop
If RabbitMQ is still booting when the worker process starts, the worker does not crash immediately. Instead, it logs a standby message and initiates a non-blocking 5-second connection polling loop.

### 4. Graceful Shutdown
When receiving `SIGINT` or `SIGTERM`:
1. Stop accepting new messages from channels (`channel.cancel()`).
2. Settle inflight jobs.
3. Close RabbitMQ channel and connection cleanly.
4. Disconnect Prisma client.
5. Exit process with code 0.
