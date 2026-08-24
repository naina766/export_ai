import { rabbitmq } from "@/lib/rabbitmq/connection";
import { assertTopology } from "@/lib/rabbitmq/topology";
import { startOutboxWorker, stopOutboxWorker } from "./outbox.worker";
import { startDiscoveryWorker } from "./discovery.worker";
import { startValidationWorker } from "./validation.worker";
import { startAIWorker } from "./ai.worker";
import { startEmailWorker } from "./email.worker";
import { startSchedulerWorker, stopSchedulerWorker } from "./scheduler.worker";
import { startReportWorker } from "./report.worker";

async function main() {
  console.log("==================================================");
  console.log("🚀 EXPORT AI — Distributed Worker Cluster Starting");
  console.log("==================================================");

  try {
    const channel = await rabbitmq.getChannel();
    if (channel) {
      await assertTopology(channel);
      console.log("✓ RabbitMQ topology ready.");
    } else {
      console.warn("⚠️ RabbitMQ channel unavailable at boot. Workers will operate in fallback mode.");
    }

    // Launch all workers
    await startOutboxWorker(2500);
    await startSchedulerWorker(15000);
    await startDiscoveryWorker();
    await startValidationWorker();
    await startAIWorker();
    await startEmailWorker();
    await startReportWorker();

    console.log("==================================================");
    console.log("✨ All 7 Workers Online & Listening to Queues:");
    console.log("  • Outbox Worker (PostgreSQL -> RabbitMQ)");
    console.log("  • Discovery Worker (discovery.queue)");
    console.log("  • Validation Worker (validation.queue)");
    console.log("  • AI Qualification Worker (ai.queue)");
    console.log("  • Email Send Worker (email.queue)");
    console.log("  • Campaign Scheduler Worker (cron polling)");
    console.log("  • Report Worker (report.queue)");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Worker cluster failed to start:", (error as Error).message);
  }
}

async function shutdown() {
  console.log("\n🛑 Gracefully shutting down worker cluster...");
  stopOutboxWorker();
  stopSchedulerWorker();
  await rabbitmq.close();
  console.log("✓ Worker cluster terminated safely.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
