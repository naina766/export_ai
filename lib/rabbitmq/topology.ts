import { Channel } from "amqplib";

export const EXCHANGES = {
  JOBS: process.env.RABBITMQ_EXCHANGE || "export.jobs.exchange",
  DLX: process.env.RABBITMQ_DLX || "export.dlx",
} as const;

export const QUEUES = {
  DISCOVERY: "discovery.queue",
  VALIDATION: "validation.queue",
  AI: "ai.queue",
  EMAIL: "email.queue",
  REPORT: "report.queue",
  DEAD_LETTER: "dead-letter.queue",
} as const;

export const ROUTING_KEYS = {
  DISCOVERY_START: "discovery.start",
  VALIDATION_EMAIL: "validation.email",
  AI_CLASSIFY: "ai.classify",
  CAMPAIGN_SEND: "campaign.send",
  REPORT_GENERATE: "report.generate",
} as const;

export interface QueueBinding {
  queue: string;
  routingKey: string;
}

export const TOPOLOGY_BINDINGS: QueueBinding[] = [
  { queue: QUEUES.DISCOVERY, routingKey: ROUTING_KEYS.DISCOVERY_START },
  { queue: QUEUES.VALIDATION, routingKey: ROUTING_KEYS.VALIDATION_EMAIL },
  { queue: QUEUES.AI, routingKey: ROUTING_KEYS.AI_CLASSIFY },
  { queue: QUEUES.EMAIL, routingKey: ROUTING_KEYS.CAMPAIGN_SEND },
  { queue: QUEUES.REPORT, routingKey: ROUTING_KEYS.REPORT_GENERATE },
];

/**
 * Asserts durable topic exchanges, dead-letter queues, and bindings.
 */
export async function assertTopology(channel: Channel): Promise<void> {
  // 1. Assert Dead Letter Exchange and Queue
  await channel.assertExchange(EXCHANGES.DLX, "direct", { durable: true });
  await channel.assertQueue(QUEUES.DEAD_LETTER, { durable: true });
  await channel.bindQueue(QUEUES.DEAD_LETTER, EXCHANGES.DLX, "dead-letter");

  // 2. Assert Main Topic Jobs Exchange
  await channel.assertExchange(EXCHANGES.JOBS, "topic", { durable: true });

  // 3. Assert Work Queues with DLX routing
  for (const binding of TOPOLOGY_BINDINGS) {
    await channel.assertQueue(binding.queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGES.DLX,
        "x-dead-letter-routing-key": "dead-letter",
      },
    });

    await channel.bindQueue(binding.queue, EXCHANGES.JOBS, binding.routingKey);
  }

  console.log("[RabbitMQ] Topology successfully asserted (Exchanges, Queues, DLQ, Bindings).");
}
