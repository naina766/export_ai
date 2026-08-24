import { createConsumer, ConsumerPayload } from "@/lib/rabbitmq/consumer";
import { QUEUES } from "@/lib/rabbitmq/topology";
import { discoveryService } from "@/lib/discovery";
import { prisma } from "@/lib/prisma";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";

interface DiscoveryJobPayload {
  jobId: string;
}

export async function startDiscoveryWorker() {
  await createConsumer<DiscoveryJobPayload>(
    { queueName: QUEUES.DISCOVERY, prefetch: 2, maxRetries: 3 },
    async (data: ConsumerPayload<DiscoveryJobPayload>) => {
      const { jobId } = data.payload;
      console.log(`[Discovery Worker] Processing DiscoveryJob ${jobId}...`);

      const job = await prisma.discoveryJob.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new Error(`DiscoveryJob ${jobId} not found in database.`);
      }

      await prisma.discoveryJob.update({
        where: { id: jobId },
        data: { status: "RUNNING", startedAt: new Date(), progress: 15 },
      });

      // 1. Run discovery pipeline
      const normalizedLeads = await discoveryService.executeDiscovery({
        productKeyword: job.productKeyword,
        targetCountries: job.targetCountries,
        buyerType: job.buyerType,
        sources: job.sources,
        maxResults: job.maxResults,
      });

      await prisma.discoveryJob.update({
        where: { id: jobId },
        data: { progress: 60, leadsFound: normalizedLeads.length },
      });

      let insertedCount = 0;

      // 2. Persist leads with deduplication
      for (const leadData of normalizedLeads) {
        try {
          const existing = await prisma.buyerLead.findUnique({
            where: { normalizedEmail: leadData.normalizedEmail },
          });

          if (!existing) {
            const lead = await prisma.buyerLead.create({
              data: {
                ...leadData,
                createdById: job.userId || undefined,
              },
            });

            insertedCount++;

            // Create Outbox event for AI qualification & score
            await createOutboxEvent(prisma, {
              eventKey: `lead:${lead.id}:classify`,
              eventType: "AI_CLASSIFY",
              aggregateType: "BuyerLead",
              aggregateId: lead.id,
              payload: { leadId: lead.id },
            });
          }
        } catch (err) {
          console.warn(`[Discovery Worker] Duplicate lead skipped (${leadData.normalizedEmail}):`, (err as Error).message);
        }
      }

      await prisma.discoveryJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          leadsFound: insertedCount,
          completedAt: new Date(),
        },
      });

      return {
        jobId,
        totalDiscovered: normalizedLeads.length,
        newLeadsSaved: insertedCount,
      };
    }
  );
}
