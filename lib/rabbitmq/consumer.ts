import { ConsumeMessage, Channel } from "amqplib";
import { rabbitmq } from "./connection";
import { prisma } from "../prisma";
import { EXCHANGES, ROUTING_KEYS } from "./topology";

export interface ConsumerPayload<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  timestamp: string;
}

export type MessageHandler<T = unknown> = (
  data: ConsumerPayload<T>,
  msg: ConsumeMessage
) => Promise<unknown>;

export interface ConsumerOptions {
  queueName?: string;
  prefetch?: number;
  maxRetries?: number;
}

/**
 * Registers a resilient queue consumer with manual ACK and Dead-Letter routing.
 * Supports both createConsumer(queueName, handler, options) and createConsumer(options, handler).
 */
export async function createConsumer<T = unknown>(
  queueOrOptions: string | ConsumerOptions,
  handlerOrOptions: MessageHandler<T> | ConsumerOptions,
  extraOptions?: ConsumerOptions
): Promise<void> {
  let queueName: string;
  let handler: MessageHandler<T>;
  let options: ConsumerOptions = {};

  if (typeof queueOrOptions === "string") {
    queueName = queueOrOptions;
    handler = handlerOrOptions as MessageHandler<T>;
    options = extraOptions || {};
  } else {
    queueName = queueOrOptions.queueName || "default.queue";
    handler = handlerOrOptions as MessageHandler<T>;
    options = queueOrOptions;
  }

  const { prefetch = 10, maxRetries = 3 } = options;
  const channel = await rabbitmq.getChannel();

  if (!channel) {
    throw new Error(`[Consumer: ${queueName}] Cannot start: Channel is unavailable.`);
  }

  await channel.prefetch(prefetch);
  console.log(`[Consumer: ${queueName}] Initialized with prefetch ${prefetch}. Listening for jobs...`);

  channel.consume(queueName, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const startTime = Date.now();
    let parsedData: ConsumerPayload<T> | null = null;

    try {
      parsedData = JSON.parse(msg.content.toString()) as ConsumerPayload<T>;
      const correlationId = msg.properties.correlationId || parsedData.aggregateId;

      // Log job execution start
      await prisma.jobLog.upsert({
        where: { id: parsedData.eventId || msg.properties.messageId || "unknown" },
        update: {
          status: "RUNNING",
          startedAt: new Date(),
        },
        create: {
          id: parsedData.eventId || msg.properties.messageId || "unknown",
          jobId: parsedData.aggregateId,
          correlationId,
          queue: queueName,
          type: parsedData.eventType || queueName,
          status: "RUNNING",
          payload: parsedData.payload ? JSON.parse(JSON.stringify(parsedData.payload)) : undefined,
          startedAt: new Date(),
        },
      });

      // Execute worker handler
      const result = await handler(parsedData, msg);
      const durationMs = Date.now() - startTime;

      // Acknowledge message to RabbitMQ
      channel.ack(msg);

      // Update JobLog on success
      await prisma.jobLog.update({
        where: { id: parsedData.eventId || msg.properties.messageId || "unknown" },
        data: {
          status: "COMPLETED",
          result: result ? JSON.parse(JSON.stringify(result)) : undefined,
          durationMs,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const err = error as Error;
      const durationMs = Date.now() - startTime;
      console.error(`[Consumer: ${queueName}] Error processing message:`, err.message);

      const headers = msg.properties.headers || {};
      const retryCount = (headers["x-retry-count"] as number) || 0;

      if (retryCount < maxRetries) {
        // Increment retry and republish to queue
        console.warn(`[Consumer: ${queueName}] Retrying job (attempt ${retryCount + 1}/${maxRetries})...`);
        channel.ack(msg);

        channel.publish(
          EXCHANGES.JOBS,
          msg.fields.routingKey,
          msg.content,
          {
            ...msg.properties,
            headers: {
              ...headers,
              "x-retry-count": retryCount + 1,
            },
          }
        );

        if (parsedData?.eventId) {
          await prisma.jobLog.update({
            where: { id: parsedData.eventId },
            data: {
              status: "RETRYING",
              attempts: retryCount + 1,
              error: err.message,
            },
          });
        }
      } else {
        // Max retries exceeded: Route to Dead Letter Queue
        console.error(`[Consumer: ${queueName}] Max retries (${maxRetries}) exceeded. Sending to Dead Letter Queue.`);
        channel.nack(msg, false, false); // Triggers dead-letter exchange

        if (parsedData?.eventId) {
          await prisma.jobLog.update({
            where: { id: parsedData.eventId },
            data: {
              status: "FAILED",
              attempts: maxRetries + 1,
              error: err.message,
              durationMs,
              completedAt: new Date(),
            },
          });
        }
      }
    }
  });
}
