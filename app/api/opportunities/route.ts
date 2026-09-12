import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import {
  CreateOpportunitySchema,
  UpdateOpportunityStageSchema,
  isValidOpportunityStageTransition,
  OpportunityStageType,
} from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { OpportunityStage } from "@prisma/client";

// GET /api/opportunities
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const stageParam = req.nextUrl.searchParams.get("stage");
    let stage: OpportunityStage | undefined = undefined;
    if (stageParam) {
      if (!Object.values(OpportunityStage).includes(stageParam as OpportunityStage)) {
        return errorResponse(`Invalid stage parameter: ${stageParam}`, 400);
      }
      stage = stageParam as OpportunityStage;
    }

    const opportunities = await prisma.salesOpportunity.findMany({
      where: { ...(stage && { stage }) },
      orderBy: { updatedAt: "desc" },
      include: {
        lead: {
          select: { id: true, companyName: true, contactPerson: true, country: true, email: true },
        },
        product: { select: { id: true, name: true, sku: true } },
        quotations: { select: { id: true, quotationNumber: true, total: true, status: true } },
      },
    });

    return successResponse(opportunities);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/opportunities
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { expectedCloseDate, ...rest } = parsed.data;

    const opportunity = await prisma.salesOpportunity.create({
      data: {
        ...rest,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        assignedToId: user.userId,
      },
      include: {
        lead: { select: { id: true, companyName: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: "OPPORTUNITY_STAGE_CHANGE",
        title: `Sales Opportunity Created: ${opportunity.title}`,
        description: `Opportunity created in stage ${opportunity.stage}`,
        userId: user.userId,
        leadId: opportunity.leadId,
        opportunityId: opportunity.id,
      },
    });

    return successResponse(opportunity, "Opportunity created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/opportunities
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = UpdateOpportunityStageSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { id, stage: targetStage } = parsed.data;

    const existing = await prisma.salesOpportunity.findUnique({
      where: { id },
      select: { id: true, title: true, stage: true, leadId: true, closedAt: true },
    });

    if (!existing) {
      return errorResponse("Opportunity not found", 404);
    }

    const currentStage = existing.stage as OpportunityStageType;

    // Reject transitions from terminal closed stages
    if ((currentStage === "CLOSED_WON" || currentStage === "CLOSED_LOST") && currentStage !== targetStage) {
      return errorResponse(
        `Invalid opportunity stage transition: ${currentStage} is terminal and cannot transition to ${targetStage}`,
        400
      );
    }

    // Verify stage transition rules
    if (!isValidOpportunityStageTransition(currentStage, targetStage)) {
      return errorResponse(
        `Invalid opportunity stage transition: ${currentStage} → ${targetStage}`,
        400
      );
    }

    const isClosing = (targetStage === "CLOSED_WON" || targetStage === "CLOSED_LOST");

    const updated = await prisma.salesOpportunity.update({
      where: { id },
      data: {
        stage: targetStage as OpportunityStage,
        ...(isClosing && !existing.closedAt && { closedAt: new Date() }),
      },
      include: {
        lead: { select: { id: true, companyName: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: "OPPORTUNITY_STAGE_CHANGE",
        title: `Opportunity Stage Updated: ${updated.title}`,
        description: `Stage changed from ${currentStage} to ${updated.stage}`,
        userId: user.userId,
        leadId: updated.leadId,
        opportunityId: updated.id,
      },
    });

    return successResponse(updated, "Opportunity stage updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
