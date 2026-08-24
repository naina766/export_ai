import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const [
      totalBuyers,
      verifiedBuyers,
      highFitBuyers,
      totalProducts,
      totalCampaigns,
      totalOpportunities,
      totalQuotations,
      pipelineValue,
      recentLeads,
      topCountries,
    ] = await Promise.all([
      prisma.buyerLead.count(),
      prisma.buyerLead.count({ where: { emailStatus: "VALID" } }),
      prisma.buyerLead.count({ where: { leadScore: { gte: 80 } } }),
      prisma.product.count(),
      prisma.campaign.count(),
      prisma.salesOpportunity.count(),
      prisma.quotation.count(),
      prisma.salesOpportunity.aggregate({ _sum: { inquiryValue: true } }),
      prisma.buyerLead.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, companyName: true, country: true, leadScore: true, createdAt: true },
      }),
      prisma.buyerLead.groupBy({
        by: ["country"],
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 5,
      }),
    ]);

    return successResponse({
      kpis: {
        totalBuyers,
        verifiedBuyers,
        highFitBuyers,
        totalProducts,
        totalCampaigns,
        totalOpportunities,
        totalQuotations,
        pipelineValue: pipelineValue._sum.inquiryValue || 0,
      },
      recentLeads,
      topCountries: topCountries.map((c) => ({
        country: c.country,
        count: c._count._all,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
