import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/analytics/funnel
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const [
      discoveredCount,
      validatedCount,
      qualifiedCount,
      contactedCount,
      repliedCount,
      opportunitiesCount,
      quotationsCount,
      wonCount,
    ] = await Promise.all([
      prisma.buyerLead.count(),
      prisma.buyerLead.count({ where: { emailStatus: "VALID" } }),
      prisma.buyerLead.count({ where: { leadScore: { gte: 70 } } }),
      prisma.buyerLead.count({ where: { outreachStatus: { in: ["SENT", "REPLIED"] } } }),
      prisma.buyerLead.count({ where: { outreachStatus: "REPLIED" } }),
      prisma.salesOpportunity.count(),
      prisma.quotation.count(),
      prisma.salesOpportunity.count({ where: { stage: "CLOSED_WON" } }),
    ]);

    const funnelStages = [
      { name: "Discovered Buyers", count: discoveredCount, percentage: 100, color: "#3b82f6" },
      {
        name: "Validated Emails",
        count: validatedCount,
        percentage: discoveredCount > 0 ? Math.round((validatedCount / discoveredCount) * 100) : 0,
        color: "#06b6d4",
      },
      {
        name: "AI Qualified Leads",
        count: qualifiedCount,
        percentage: discoveredCount > 0 ? Math.round((qualifiedCount / discoveredCount) * 100) : 0,
        color: "#6366f1",
      },
      {
        name: "Outreach Sent",
        count: contactedCount,
        percentage: discoveredCount > 0 ? Math.round((contactedCount / discoveredCount) * 100) : 0,
        color: "#8b5cf6",
      },
      {
        name: "Buyer Responses",
        count: repliedCount,
        percentage: contactedCount > 0 ? Math.round((repliedCount / contactedCount) * 100) : 0,
        color: "#10b981",
      },
      {
        name: "Sales Opportunities",
        count: opportunitiesCount,
        percentage: repliedCount > 0 ? Math.round((opportunitiesCount / repliedCount) * 100) : 0,
        color: "#f59e0b",
      },
      {
        name: "Export Quotations",
        count: quotationsCount,
        percentage: opportunitiesCount > 0 ? Math.round((quotationsCount / opportunitiesCount) * 100) : 0,
        color: "#ec4899",
      },
      {
        name: "Closed Won Orders",
        count: wonCount,
        percentage: quotationsCount > 0 ? Math.round((wonCount / quotationsCount) * 100) : 0,
        color: "#059669",
      },
    ];

    return successResponse({ funnel: funnelStages });
  } catch (error) {
    return handleApiError(error);
  }
}
