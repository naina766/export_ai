import { createConsumer, ConsumerPayload } from "@/lib/rabbitmq/consumer";
import { QUEUES } from "@/lib/rabbitmq/topology";
import { prisma } from "@/lib/prisma";

interface ReportJobPayload {
  reportType: "EXPORT_PERFORMANCE" | "LEAD_FUNNEL" | "CAMPAIGN_SUMMARY";
  userId?: string;
}

export async function startReportWorker() {
  await createConsumer<ReportJobPayload>(
    { queueName: QUEUES.REPORT, prefetch: 2, maxRetries: 3 },
    async (data: ConsumerPayload<ReportJobPayload>) => {
      const { reportType } = data.payload;
      console.log(`[Report Worker] Generating ${reportType} report...`);

      const [totalLeads, totalCampaigns, totalSent, totalOpportunities, totalQuotations] =
        await Promise.all([
          prisma.buyerLead.count(),
          prisma.campaign.count(),
          prisma.emailLog.count({ where: { status: "SENT" } }),
          prisma.salesOpportunity.count(),
          prisma.quotation.count(),
        ]);

      const summary = {
        generatedAt: new Date().toISOString(),
        reportType,
        metrics: {
          totalLeads,
          totalCampaigns,
          totalSent,
          totalOpportunities,
          totalQuotations,
        },
      };

      console.log(`[Report Worker] Report generated successfully:`, JSON.stringify(summary));
      return summary;
    }
  );
}
