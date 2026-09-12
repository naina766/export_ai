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
      highIntentCount,
      strongFitCount,
      moderateFitCount,
      lowFitCount,
      openOpportunities,
      pipelineValueRaw,
      wonCount,
      lostCount,
      activeCampaigns,
      totalEmailsSent,
      repliedEmails,
      bouncedEmails,
      repliedBuyers,
      topCountriesRaw,
      productsCategoryRaw,
    ] = await Promise.all([
      // Total Buyers
      prisma.buyerLead.count(),
      // Qualified Buyers (score >= 80)
      prisma.buyerLead.count({ where: { leadScore: { gte: 80 } } }),
      // Quality distribution bands
      prisma.buyerLead.count({ where: { leadScore: { gte: 90 } } }),
      prisma.buyerLead.count({ where: { leadScore: { gte: 80, lt: 90 } } }),
      prisma.buyerLead.count({ where: { leadScore: { gte: 70, lt: 80 } } }),
      prisma.buyerLead.count({ where: { leadScore: { lt: 70 } } }),
      // Open opportunities (excluding closed)
      prisma.salesOpportunity.count({
        where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
      }),
      // Open pipeline value: SUM(inquiryValue) of open opportunities
      prisma.salesOpportunity.aggregate({
        where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
        _sum: { inquiryValue: true },
      }),
      // Won opportunities
      prisma.salesOpportunity.count({ where: { stage: "CLOSED_WON" } }),
      // Lost opportunities
      prisma.salesOpportunity.count({ where: { stage: "CLOSED_LOST" } }),
      // Active campaigns
      prisma.campaign.count({ where: { status: "RUNNING" } }),
      // Email / outreach logs
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.emailLog.count({ where: { status: "REPLIED" } }),
      prisma.emailLog.count({ where: { status: "BOUNCED" } }),
      // Replied buyers
      prisma.buyerLead.count({ where: { outreachStatus: "REPLIED" } }),
      // Country grouping with lead score average for deterministic corridor recommendation
      prisma.buyerLead.groupBy({
        by: ["country"],
        _count: { _all: true },
        _avg: { leadScore: true },
      }),
      // Product categories
      prisma.product.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    // Pipeline Value (open opportunities only, safe 0)
    const pipelineValue = Number(pipelineValueRaw._sum.inquiryValue || 0);

    // Win Rate: won / (won + lost) * 100
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

    // Email Reply Rate: (repliedEmails / totalEmailsSent) * 100
    const emailReplyRate = totalEmailsSent > 0 ? (repliedEmails / totalEmailsSent) * 100 : 0;

    // Quality Distribution
    const qualityDistribution = [
      {
        band: "90–100",
        label: "High Intent",
        count: highIntentCount,
        percentage: totalBuyers > 0 ? Math.round((highIntentCount / totalBuyers) * 100) : 0,
      },
      {
        band: "80–89",
        label: "Strong Fit",
        count: strongFitCount,
        percentage: totalBuyers > 0 ? Math.round((strongFitCount / totalBuyers) * 100) : 0,
      },
      {
        band: "70–79",
        label: "Moderate Fit",
        count: moderateFitCount,
        percentage: totalBuyers > 0 ? Math.round((moderateFitCount / totalBuyers) * 100) : 0,
      },
      {
        band: "<70",
        label: "Low Fit",
        count: lowFitCount,
        percentage: totalBuyers > 0 ? Math.round((lowFitCount / totalBuyers) * 100) : 0,
      },
    ];

    // Sort top countries deterministically: highest count first, then country name alphabetically for ties
    const sortedCountries = [...topCountriesRaw].sort((a, b) => {
      if (b._count._all !== a._count._all) {
        return b._count._all - a._count._all;
      }
      return a.country.localeCompare(b.country);
    });

    const topCountries = sortedCountries.map((c) => ({
      country: c.country,
      count: c._count._all,
      percentage: totalBuyers > 0 ? Math.round((c._count._all / totalBuyers) * 100) : 0,
      avgScore: Math.round(c._avg.leadScore || 0),
    }));

    // Deterministic Next Action based on actual database corridor statistics
    // Determines the primary corridor from the country with highest buyer concentration and score
    const topCorridor = sortedCountries[0];
    const topRecommendation = topCorridor
      ? {
          country: topCorridor.country,
          buyerCount: topCorridor._count._all,
          avgScore: Math.round(topCorridor._avg.leadScore || 0),
          title: `Prioritize ${topCorridor.country} wellness & sound therapy distributors`,
          description: `Commercial analytics identified peak demand and qualification scores across verified ${topCorridor.country} accounts.`,
          evidence: [
            `High product-fit score (avg. ${Math.round(topCorridor._avg.leadScore || 0)}/100 across ${topCorridor._count._all} ${topCorridor.country} buyers)`,
            `Primary export corridor with verified wholesale purchasing intent`,
            `Ready for CIF / FOB proforma commercial terms & acoustic certificates`,
          ],
        }
      : {
          country: "Global",
          buyerCount: 0,
          avgScore: 0,
          title: "Discover initial wholesale export buyers",
          description: "No international accounts recorded yet. Begin by running a buyer discovery job.",
          evidence: [],
        };

    const productCategories = productsCategoryRaw.map((p) => ({
      category: p.category.replace(/_/g, " "),
      count: p._count._all,
    }));

    return successResponse({
      kpis: {
        totalBuyers,
        qualifiedBuyers,
        pipelineValue,
        activeCampaigns,
        openOpportunities,
        winRate: Number(winRate.toFixed(1)),
        totalEmailsSent,
        repliedEmails,
        repliedBuyers,
        replyRate: `${emailReplyRate.toFixed(1)}%`,
      },
      // Top-level aliases for direct access
      totalBuyers,
      qualifiedBuyers,
      pipelineValue,
      activeCampaigns,
      openOpportunities,
      winRate: Number(winRate.toFixed(1)),
      repliedBuyers,
      repliedEmails,
      qualityDistribution,
      topCountries,
      outreach: {
        sent: totalEmailsSent,
        replied: repliedEmails,
        bounced: bouncedEmails,
        replyRate: Number(emailReplyRate.toFixed(1)),
      },
      topRecommendation,
      productCategories,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
