import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/analytics/overview
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const [
      totalBuyers,
      qualifiedBuyers,
      totalEmailsSent,
      repliedBuyers,
      topCountriesRaw,
      productsCategoryRaw,
      pipelineValueRaw,
    ] = await Promise.all([
      prisma.buyerLead.count(),
      prisma.buyerLead.count({ where: { leadScore: { gte: 80 } } }),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.buyerLead.count({ where: { outreachStatus: "REPLIED" } }),
      prisma.buyerLead.groupBy({
        by: ["country"],
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 6,
      }),
      prisma.product.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      prisma.salesOpportunity.aggregate({
        _sum: { inquiryValue: true },
      }),
    ]);

    const replyRate = totalEmailsSent > 0 ? ((repliedBuyers / totalEmailsSent) * 100).toFixed(1) : "0.0";

    const topCountries = topCountriesRaw.map((c) => ({
      country: c.country,
      count: c._count._all,
      percentage: totalBuyers > 0 ? Math.round((c._count._all / totalBuyers) * 100) : 0,
    }));

    const productCategories = productsCategoryRaw.map((p) => ({
      category: p.category.replace(/_/g, " "),
      count: p._count._all,
    }));

    return successResponse({
      kpis: {
        totalBuyers,
        qualifiedBuyers,
        totalEmailsSent,
        replyRate: `${replyRate}%`,
        pipelineValue: pipelineValueRaw._sum.inquiryValue || 0,
      },
      topCountries,
      productCategories,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
