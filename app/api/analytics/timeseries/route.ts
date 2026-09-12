import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import {
  isValidRange,
  getTimeRangeBounds,
  aggregateTimeseriesData,
  ValidRange,
} from "@/lib/analytics/timeseries";

// GET /api/analytics/timeseries?range=7D|30D|90D|12M
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range");

    if (rangeParam && !isValidRange(rangeParam)) {
      return errorResponse(
        "Invalid range parameter. Supported ranges: 7D, 30D, 90D, 12M",
        400
      );
    }

    const range: ValidRange = (rangeParam as ValidRange) || "30D";
    const bounds = getTimeRangeBounds(range);

    const [leads, opportunities, emailLogs] = await Promise.all([
      prisma.buyerLead.findMany({
        where: {
          createdAt: {
            gte: bounds.startDate,
            lte: bounds.endDate,
          },
        },
        select: {
          createdAt: true,
          leadScore: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.salesOpportunity.findMany({
        where: {
          createdAt: {
            gte: bounds.startDate,
            lte: bounds.endDate,
          },
        },
        select: {
          createdAt: true,
          inquiryValue: true,
          stage: true,
          closedAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.emailLog.findMany({
        where: {
          sentAt: {
            gte: bounds.startDate,
            lte: bounds.endDate,
          },
        },
        select: {
          sentAt: true,
          status: true,
        },
        orderBy: { sentAt: "asc" },
      }),
    ]);

    const result = aggregateTimeseriesData({
      range,
      bounds,
      leads,
      opportunities,
      emailLogs,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
