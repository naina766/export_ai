import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { UpdateBuyerLeadSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/leads/:id
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const lead = await prisma.buyerLead.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
        followUps: { orderBy: { scheduledAt: "asc" } },
        opportunities: {
          include: {
            quotations: { select: { id: true, quotationNumber: true, total: true, status: true } },
          },
        },
        campaignRecipients: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
        personalizedEmails: true,
      },
    });

    if (!lead) return errorResponse("Buyer lead not found", 404);

    return successResponse(lead);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/leads/:id
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = UpdateBuyerLeadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const lead = await prisma.buyerLead.update({
      where: { id: params.id },
      data: parsed.data,
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    return successResponse(lead, "Buyer lead updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/leads/:id
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await prisma.buyerLead.delete({ where: { id: params.id } });
    return successResponse({ id: params.id }, "Buyer lead deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
