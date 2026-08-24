import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateOpportunitySchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { OpportunityStage } from "@prisma/client";

// GET /api/opportunities
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const stage = req.nextUrl.searchParams.get("stage") as OpportunityStage | null;

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
