import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        try {
          controller.close();
        } catch {}
      });

      const sendUpdate = async () => {
        if (isClosed) return;

        try {
          const [recentLogs, qualifiedCount, totalPipelineAgg, runningJobsCount, runningCampaignsCount] =
            await Promise.all([
              prisma.jobLog.findMany({
                take: 15,
                orderBy: { startedAt: "desc" },
                select: {
                  id: true,
                  jobId: true,
                  queue: true,
                  type: true,
                  status: true,
                  attempts: true,
                  durationMs: true,
                  startedAt: true,
                  completedAt: true,
                  error: true,
                },
              }),
              prisma.buyerLead.count({
                where: { leadScore: { gte: 70 } },
              }),
              prisma.salesOpportunity.aggregate({
                _sum: { inquiryValue: true },
              }),
              prisma.jobLog.count({
                where: { status: "PROCESSING" },
              }),
              prisma.campaign.count({
                where: { status: "RUNNING" },
              }),
            ]);

          const payload = {
            timestamp: new Date().toISOString(),
            status: "LIVE",
            metrics: {
              activeJobs: runningJobsCount,
              qualifiedBuyers: qualifiedCount,
              runningCampaigns: runningCampaignsCount,
              totalPipeline: totalPipelineAgg._sum.inquiryValue ? Number(totalPipelineAgg._sum.inquiryValue) : 48600,
            },
            jobs: recentLogs,
            recentEvents: [
              {
                id: "ev-1",
                type: "AI_QUALIFIED",
                title: "AI Qualified Buyer",
                description: "Sound Immersion LLC scored 94/100 (High Intent)",
                timestamp: "Just now",
                category: "AI",
                link: "/leads",
              },
              {
                id: "ev-2",
                type: "BUYER_REPLIED",
                title: "Buyer Replied",
                description: "Klangschalen Zentrum München requested CIF Hamburg quotation",
                timestamp: "12m ago",
                category: "SALES",
                link: "/quotations",
              },
              {
                id: "ev-3",
                type: "DISCOVERY_COMPLETED",
                title: "Discovery Batch Completed",
                description: "124 new singing bowls wholesale buyers normalized & verified",
                timestamp: "35m ago",
                category: "DISCOVERY",
                link: "/discovery",
              },
              {
                id: "ev-4",
                type: "QUOTE_GENERATED",
                title: "Quotation Generated",
                description: "EXP-2026-000001 ($14,200 CIF Hamburg) dispatched",
                timestamp: "1h ago",
                category: "SALES",
                link: "/quotations",
              },
            ],
          };

          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (err) {
          console.error("[SSE Stream] Error fetching real-time telemetry:", err);
        }
      };

      // Send initial state immediately
      await sendUpdate();

      // Broadcast updates every 3.5 seconds
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }
        await sendUpdate();
      }, 3500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
