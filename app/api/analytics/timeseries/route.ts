import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/analytics/timeseries?range=7D|30D|90D|12M
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30D";

    let days = 30;
    if (range === "7D") days = 7;
    else if (range === "90D") days = 90;
    else if (range === "12M") days = 365;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [leads, opportunities, emailLogs] = await Promise.all([
      prisma.buyerLead.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, leadScore: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.salesOpportunity.findMany({
        select: { createdAt: true, inquiryValue: true, stage: true, closedAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.emailLog.findMany({
        where: { sentAt: { gte: startDate } },
        select: { sentAt: true, status: true },
        orderBy: { sentAt: "asc" },
      }),
    ]);

    // Format monthly or interval labels
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Group pipeline history
    const pipelineMap = new Map<string, { pipeline: number; revenue: number }>();

    for (const opp of opportunities) {
      const date = opp.createdAt;
      const key = months[date.getMonth()];
      const current = pipelineMap.get(key) || { pipeline: 0, revenue: 0 };
      const val = Number(opp.inquiryValue || 0);

      if (opp.stage === "CLOSED_WON") {
        current.revenue += val;
      } else if (opp.stage !== "CLOSED_LOST") {
        current.pipeline += val;
      }
      pipelineMap.set(key, current);
    }

    const pipelineHistory = Array.from(pipelineMap.entries()).map(([month, data]) => ({
      month,
      pipeline: data.pipeline,
      revenue: data.revenue,
    }));

    // Group buyer acquisition
    const leadMap = new Map<string, { discovered: number; qualified: number }>();
    for (const l of leads) {
      const key = months[l.createdAt.getMonth()];
      const current = leadMap.get(key) || { discovered: 0, qualified: 0 };
      current.discovered += 1;
      if (l.leadScore >= 80) {
        current.qualified += 1;
      }
      leadMap.set(key, current);
    }

    const buyerAcquisition = Array.from(leadMap.entries()).map(([month, data]) => ({
      month,
      discovered: data.discovered,
      qualified: data.qualified,
    }));

    // Outreach timeline
    const outreachMap = new Map<string, { sent: number; replied: number; bounced: number }>();
    for (const e of emailLogs) {
      const d = new Date(e.sentAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const current = outreachMap.get(key) || { sent: 0, replied: 0, bounced: 0 };
      if (e.status === "SENT") current.sent += 1;
      else if (e.status === "REPLIED") current.replied += 1;
      else if (e.status === "BOUNCED") current.bounced += 1;
      outreachMap.set(key, current);
    }

    const outreachTimeline = Array.from(outreachMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return successResponse({
      pipelineHistory,
      buyerAcquisition,
      outreachTimeline,
      recordCount: {
        leads: leads.length,
        opportunities: opportunities.length,
        emailLogs: emailLogs.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
