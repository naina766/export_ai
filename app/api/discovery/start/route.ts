import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { StartDiscoverySchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";

// POST /api/discovery/start
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = StartDiscoverySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid discovery parameters", 400, parsed.error.flatten());
    }

    const { productKeyword, targetCountries, buyerType, sources, maxResults } = parsed.data;

    // Transaction: Create DiscoveryJob + OutboxEvent
    const job = await prisma.$transaction(async (tx) => {
      const createdJob = await tx.discoveryJob.create({
        data: {
          productKeyword,
          targetCountries,
          buyerType,
          sources: sources || ["Google", "Directories", "Websites"],
          maxResults,
          status: "PENDING",
          progress: 0,
          userId: user.userId,
        },
      });

      await createOutboxEvent(tx, {
        eventKey: `discovery:job:${createdJob.id}:start`,
        eventType: "DISCOVERY_START",
        aggregateType: "DiscoveryJob",
        aggregateId: createdJob.id,
        payload: {
          jobId: createdJob.id,
          userId: user.userId,
        },
      });

      return createdJob;
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "START_DISCOVERY",
        entity: "DiscoveryJob",
        entityId: job.id,
        newData: { productKeyword, targetCountries, maxResults },
        userId: user.userId,
      },
    });

    return successResponse(job, "Discovery job enqueued successfully", 202);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/discovery/jobs
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const jobs = await prisma.discoveryJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return successResponse(jobs);
  } catch (error) {
    return handleApiError(error);
  }
}
