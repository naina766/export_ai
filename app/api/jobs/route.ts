import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError, getPaginationParams, paginatedResponse } from "@/lib/api";

// GET /api/jobs
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { page, limit, skip, search, sortBy, sortOrder } =
      getPaginationParams(req.nextUrl.searchParams);

    const queue = req.nextUrl.searchParams.get("queue");
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { jobId: { contains: search, mode: "insensitive" } },
          { correlationId: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(queue && { queue }),
      ...(status && { status }),
    };

    const [jobs, total, countsByStatus] = await Promise.all([
      prisma.jobLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobLog.count({ where }),
      prisma.jobLog.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const queueStats = {
      QUEUED: countsByStatus.find((c) => c.status === "QUEUED")?._count._all || 0,
      RUNNING: countsByStatus.find((c) => c.status === "RUNNING")?._count._all || 0,
      COMPLETED: countsByStatus.find((c) => c.status === "COMPLETED")?._count._all || 0,
      FAILED: countsByStatus.find((c) => c.status === "FAILED")?._count._all || 0,
      RETRYING: countsByStatus.find((c) => c.status === "RETRYING")?._count._all || 0,
    };

    return successResponse({
      items: jobs,
      stats: queueStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
