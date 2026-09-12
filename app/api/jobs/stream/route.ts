import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    return errorResponse("Forbidden: Insufficient permissions to access system job stream", 403);
  }

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
              totalPipeline: totalPipelineAgg._sum.inquiryValue
                ? Number(totalPipelineAgg._sum.inquiryValue)
                : 0,
            },
            jobs: recentLogs,
            recentEvents: [],
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
