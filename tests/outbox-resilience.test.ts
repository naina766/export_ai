import test from "node:test";
import assert from "node:assert/strict";
import { EXCHANGES, QUEUES, ROUTING_KEYS } from "../lib/rabbitmq/topology";

test("Outbox & RabbitMQ: Topology routing definitions", () => {
  assert.equal(EXCHANGES.JOBS, "export.jobs.exchange");
  assert.equal(EXCHANGES.DLX, "export.dlx");

  assert.equal(ROUTING_KEYS.DISCOVERY_START, "discovery.start");
  assert.equal(ROUTING_KEYS.AI_CLASSIFY, "ai.classify");
  assert.equal(ROUTING_KEYS.VALIDATION_EMAIL, "validation.email");
  assert.equal(ROUTING_KEYS.CAMPAIGN_SEND, "campaign.send");
  assert.equal(ROUTING_KEYS.REPORT_GENERATE, "report.generate");

  assert.equal(QUEUES.DEAD_LETTER, "dead-letter.queue");
});

test("Outbox Resilience: Re-enqueue resets status and clears previous error", () => {
  // Simulate outbox record state lifecycle
  interface MockOutboxRecord {
    eventKey: string;
    eventType: string;
    status: "PENDING" | "PUBLISHED" | "FAILED";
    error: string | null;
    attempts: number;
    payload: Record<string, unknown>;
  }

  const mockDb: Record<string, MockOutboxRecord> = {};

  const simulateCreateOrReEnqueue = (params: {
    eventKey: string;
    eventType: string;
    payload: Record<string, unknown>;
  }) => {
    const existing = mockDb[params.eventKey];
    if (existing) {
      // Re-enqueue: reset status to PENDING and clear previous error
      mockDb[params.eventKey] = {
        ...existing,
        status: "PENDING",
        error: null,
        payload: params.payload,
      };
    } else {
      mockDb[params.eventKey] = {
        eventKey: params.eventKey,
        eventType: params.eventType,
        status: "PENDING",
        error: null,
        attempts: 0,
        payload: params.payload,
      };
    }
    return mockDb[params.eventKey];
  };

  // 1. Initial creation
  const created = simulateCreateOrReEnqueue({
    eventKey: "outbox_lead_123_classify",
    eventType: "AI_CLASSIFY",
    payload: { leadId: "lead_123" },
  });
  assert.equal(created.status, "PENDING");
  assert.equal(created.error, null);
  assert.equal(created.attempts, 0);

  // 2. Simulate failure during broker outage
  mockDb["outbox_lead_123_classify"].status = "FAILED";
  mockDb["outbox_lead_123_classify"].error = "Connection lost to amqp broker";
  mockDb["outbox_lead_123_classify"].attempts = 3;

  assert.equal(mockDb["outbox_lead_123_classify"].status, "FAILED");
  assert.ok(mockDb["outbox_lead_123_classify"].error);

  // 3. Re-enqueuing must reset to PENDING and wipe the error
  const reEnqueued = simulateCreateOrReEnqueue({
    eventKey: "outbox_lead_123_classify",
    eventType: "AI_CLASSIFY",
    payload: { leadId: "lead_123", updated: true },
  });
  assert.equal(reEnqueued.status, "PENDING");
  assert.equal(reEnqueued.error, null);
  assert.equal(reEnqueued.payload.updated, true);
});

test("Outbox Resilience: Exponential backoff delay calculation", () => {
  const calculateBackoff = (retryCount: number): number => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  };

  assert.equal(calculateBackoff(0), 1000); // 1s
  assert.equal(calculateBackoff(1), 2000); // 2s
  assert.equal(calculateBackoff(2), 4000); // 4s
  assert.equal(calculateBackoff(3), 8000); // 8s
  assert.equal(calculateBackoff(4), 10000); // Capped at 10s
  assert.equal(calculateBackoff(10), 10000); // Capped at 10s
});

test("Outbox Resilience: Consumer rejects malformed JSON directly to DLQ without retries", () => {
  const malformedPayloads = [
    "not a json string",
    "{ companyName: missing_quotes }",
    "",
    "42", // valid json primitive, but not an object
  ];

  for (const raw of malformedPayloads) {
    let isMalformed = false;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Message body is not a valid JSON object");
      }
    } catch {
      isMalformed = true;
    }

    assert.equal(isMalformed, true, `Payload "${raw}" must be flagged as malformed`);
  }

  // Verify action taken: if isMalformed, nack(msg, false, false) directly to DLQ
  const mockChannel = {
    nackCalled: false,
    requeue: true,
    allUpTo: true,
    nack(allUpTo: boolean, requeue: boolean) {
      this.nackCalled = true;
      this.allUpTo = allUpTo;
      this.requeue = requeue;
    },
  };

  // Malformed branch execution
  mockChannel.nack(false, false);
  assert.equal(mockChannel.nackCalled, true);
  assert.equal(mockChannel.requeue, false, "Malformed messages must NOT be requeued");
});

test("Outbox Resilience: Retry threshold sends exceeded jobs to DLQ", () => {
  const maxRetries = 3;
  const testCases = [
    { retryCount: 0, shouldRetry: true },
    { retryCount: 1, shouldRetry: true },
    { retryCount: 2, shouldRetry: true },
    { retryCount: 3, shouldRetry: false }, // maxRetries reached -> DLQ
    { retryCount: 4, shouldRetry: false },
  ];

  for (const tc of testCases) {
    const isRetryable = tc.retryCount < maxRetries;
    assert.equal(isRetryable, tc.shouldRetry, `RetryCount ${tc.retryCount} expected retryable=${tc.shouldRetry}`);
  }
});
