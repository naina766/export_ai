import { flushPendingOutbox } from "@/lib/rabbitmq/outbox";

let isRunning = false;
let intervalTimer: NodeJS.Timeout | null = null;

export async function startOutboxWorker(intervalMs = 2000) {
  console.log(`[Outbox Worker] Starting polling loop every ${intervalMs}ms...`);

  const loop = async () => {
    if (isRunning) return;
    try {
      isRunning = true;
      const count = await flushPendingOutbox(50);
      if (count > 0) {
        console.log(`[Outbox Worker] Published ${count} events to RabbitMQ.`);
      }
    } catch (err) {
      console.error("[Outbox Worker] Polling error:", (err as Error).message);
    } finally {
      isRunning = false;
    }
  };

  await loop();
  intervalTimer = setInterval(loop, intervalMs);
}

export function stopOutboxWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  console.log("[Outbox Worker] Stopped.");
}
