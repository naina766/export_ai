import { Prisma, PrismaClient } from "@prisma/client";
import { rabbitmq } from "./connection";
import { EXCHANGES, ROUTING_KEYS, assertTopology } from "./topology";
import { prisma } from "@/lib/prisma";

export interface OutboxEventParams {
  eventKey: string;
  eventType: "DISCOVERY_START" | "VALIDATION_EMAIL" | "AI_CLASSIFY" | "CAMPAIGN_SEND" | "REPORT_GENERATE";
  aggregateType: "DiscoveryJob" | "BuyerLead" | "Campaign" | "Report";
  aggregateId: string;
  payload: Record<string, unknown>;
}

const EVENT_ROUTING_MAP: Record<string, string> = {
  DISCOVERY_START: ROUTING_KEYS.DISCOVERY_START,
  VALIDATION_EMAIL: ROUTING_KEYS.VALIDATION_EMAIL,
  AI_CLASSIFY: ROUTING_KEYS.AI_CLASSIFY,
  CAMPAIGN_SEND: ROUTING_KEYS.CAMPAIGN_SEND,
  REPORT_GENERATE: ROUTING_KEYS.REPORT_GENERATE,
};

/**
 * Creates an OutboxEvent within a Prisma transaction or client.
 */
export async function createOutboxEvent(
  tx: Prisma.TransactionClient | PrismaClient,
  params: OutboxEventParams
) {
  return tx.outboxEvent.upsert({
    where: { eventKey: params.eventKey },
    update: {},
    create: {
      eventKey: params.eventKey,
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload: params.payload as Prisma.InputJsonValue,
      status: "PENDING",
      attempts: 0,
    },
  });
}

/**
 * Publishes an individual outbox event to RabbitMQ and marks it PUBLISHED upon broker confirmation.
 */
export async function publishOutboxEvent(eventId: string): Promise<boolean> {
  const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
  if (!event || event.status === "PUBLISHED") return false;

  const channel = await rabbitmq.getChannel();
  if (!channel) {
    console.warn(`[Outbox] Cannot publish event ${event.id}: RabbitMQ channel unavailable.`);
    return false;
  }

  const routingKey = EVENT_ROUTING_MAP[event.eventType] || "default.job";

  try {
    await assertTopology(channel);

    const messageBuffer = Buffer.from(
      JSON.stringify({
        eventId: event.id,
        eventKey: event.eventKey,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
        createdAt: event.createdAt,
      })
    );

    const published = channel.publish(EXCHANGES.JOBS, routingKey, messageBuffer, {
      persistent: true,
      messageId: event.id,
      correlationId: event.aggregateId,
      timestamp: Date.now(),
      contentType: "application/json",
    });

    if (published) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          attempts: { increment: 1 },
          error: null,
        },
      });

      // Update or create JobLog for UI tracking
      await prisma.jobLog.upsert({
        where: { id: event.id },
        update: {
          status: "QUEUED",
          attempts: { increment: 1 },
        },
        create: {
          id: event.id,
          jobId: event.aggregateId,
          correlationId: event.aggregateId,
          queue: routingKey,
          type: event.eventType,
          status: "QUEUED",
          payload: event.payload ?? undefined,
          attempts: 1,
        },
      });

      return true;
    } else {
      throw new Error("RabbitMQ buffer full, message rejected by broker.");
    }
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`[Outbox] Error publishing event ${event.id}:`, errorMsg);

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        error: errorMsg,
      },
    });

    return false;
  }
}

/**
 * Polling publisher that flushes pending events in batches.
 */
export async function flushPendingOutbox(batchSize = 25): Promise<number> {
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: 10 },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  if (pendingEvents.length === 0) return 0;

  let publishedCount = 0;
  for (const event of pendingEvents) {
    const success = await publishOutboxEvent(event.id);
    if (success) publishedCount++;
  }

  return publishedCount;
}
