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
      interestedCount,
      negotiatingCount,
      quotationCount,
      wonCount,
    ] = await Promise.all([
      // 1. Discovered: All buyer leads
      prisma.buyerLead.count(),
      // 2. Validated: Verified email status
      prisma.buyerLead.count({ where: { emailStatus: "VALID" } }),
      // 3. AI Qualified: Score >= 80
      prisma.buyerLead.count({ where: { leadScore: { gte: 80 } } }),
      // 4. Contacted: Outreach sent or replied
      prisma.buyerLead.count({ where: { outreachStatus: { in: ["SENT", "REPLIED"] } } }),
      // 5. Interested: Buyer replied / engaged
      prisma.buyerLead.count({ where: { outreachStatus: "REPLIED" } }),
      // 6. Negotiating: Opportunities in negotiation, quotation, or won
      prisma.salesOpportunity.count({
        where: { stage: { in: ["NEGOTIATION", "QUOTATION", "CLOSED_WON"] } },
      }),
      // 7. Quotation: Formal proforma quotations created
      prisma.quotation.count(),
      // 8. Won: Closed won sales opportunities
      prisma.salesOpportunity.count({ where: { stage: "CLOSED_WON" } }),
    ]);

    const base = discoveredCount > 0 ? discoveredCount : 1;

    const funnelStages = [
      {
        name: "Discovered",
        count: discoveredCount,
        percentage: 100,
        color: "#3b82f6",
      },
      {
        name: "Validated",
        count: validatedCount,
        percentage: Math.min(100, Math.round((validatedCount / base) * 100)),
        color: "#06b6d4",
      },
      {
        name: "AI Qualified",
        count: qualifiedCount,
        percentage: Math.min(100, Math.round((qualifiedCount / base) * 100)),
        color: "#6366f1",
      },
      {
        name: "Contacted",
        count: contactedCount,
        percentage: Math.min(100, Math.round((contactedCount / base) * 100)),
        color: "#8b5cf6",
      },
      {
        name: "Interested",
        count: interestedCount,
        percentage: Math.min(100, Math.round((interestedCount / base) * 100)),
        color: "#10b981",
      },
      {
        name: "Negotiating",
        count: negotiatingCount,
        percentage: Math.min(100, Math.round((negotiatingCount / base) * 100)),
        color: "#f59e0b",
      },
      {
        name: "Quotation",
        count: quotationCount,
        percentage: Math.min(100, Math.round((quotationCount / base) * 100)),
        color: "#ec4899",
      },
      {
        name: "Won",
        count: wonCount,
        percentage: Math.min(100, Math.round((wonCount / base) * 100)),
        color: "#059669",
      },
    ];

    return successResponse({ funnel: funnelStages });
  } catch (error) {
    return handleApiError(error);
  }
}
