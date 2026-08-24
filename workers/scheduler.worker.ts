import { prisma } from "@/lib/prisma";
import { CampaignStatus, RecipientStatus } from "@prisma/client";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";

let intervalTimer: NodeJS.Timeout | null = null;
let isProcessing = false;

export async function startSchedulerWorker(intervalMs = 15000) {
  console.log(`[Scheduler Worker] Starting campaign scheduler loop every ${intervalMs}ms...`);

  const pollScheduledCampaigns = async () => {
    if (isProcessing) return;
    try {
      isProcessing = true;

      // 1. Find scheduled campaigns that have reached their trigger time
      const now = new Date();
      const dueCampaigns = await prisma.campaign.findMany({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          recipients: {
            where: { status: RecipientStatus.PENDING },
          },
        },
      });

      for (const campaign of dueCampaigns) {
        // Atomic update to avoid race condition across multiple workers
        const updated = await prisma.campaign.updateMany({
          where: {
            id: campaign.id,
            status: CampaignStatus.SCHEDULED,
          },
          data: {
            status: CampaignStatus.RUNNING,
            startedAt: now,
          },
        });

        if (updated.count === 1) {
          console.log(`[Scheduler Worker] Campaign ${campaign.id} (${campaign.name}) launched.`);

          // Enqueue Outbox events for all pending recipients
          for (const recipient of campaign.recipients) {
            await createOutboxEvent(prisma, {
              eventKey: `campaign:${campaign.id}:lead:${recipient.leadId}:send`,
              eventType: "CAMPAIGN_SEND",
              aggregateType: "Campaign",
              aggregateId: campaign.id,
              payload: {
                campaignId: campaign.id,
                leadId: recipient.leadId,
                userId: campaign.createdById,
              },
            });
          }
        }
      }

      // 2. Check running campaigns for completion
      const runningCampaigns = await prisma.campaign.findMany({
        where: { status: CampaignStatus.RUNNING },
        include: {
          recipients: {
            select: { status: true },
          },
        },
      });

      for (const camp of runningCampaigns) {
        const total = camp.recipients.length;
        const finished = camp.recipients.filter((r) =>
          ["SENT", "FAILED", "BOUNCED", "SKIPPED"].includes(r.status)
        ).length;

        if (total > 0 && finished >= total) {
          await prisma.campaign.update({
            where: { id: camp.id },
            data: {
              status: CampaignStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
          console.log(`[Scheduler Worker] Campaign ${camp.id} completed (${finished}/${total} recipients).`);
        }
      }
    } catch (error) {
      console.error("[Scheduler Worker] Error in scheduler loop:", (error as Error).message);
    } finally {
      isProcessing = false;
    }
  };

  await pollScheduledCampaigns();
  intervalTimer = setInterval(pollScheduledCampaigns, intervalMs);
}

export function stopSchedulerWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  console.log("[Scheduler Worker] Stopped.");
}
