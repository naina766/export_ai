import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { qualifyBuyerLead } from "@/lib/ai/classifyLead";

// POST /api/leads/:id/classify
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const lead = await prisma.buyerLead.findUnique({ where: { id: params.id } });
    if (!lead) return errorResponse("Buyer lead not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const isOwner =
      lead.assignedToId === user.userId ||
      lead.createdById === user.userId ||
      (!lead.assignedToId && !lead.createdById);

    if (!isPrivileged && !isOwner) {
      return errorResponse("Forbidden: You do not have permission to qualify this buyer lead", 403);
    }

    const qualification = await qualifyBuyerLead({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      website: lead.website,
      country: lead.country,
      city: lead.city,
      source: lead.source,
      productInterest: lead.productInterest,
      notes: lead.notes,
    });

    const updated = await prisma.buyerLead.update({
      where: { id: params.id },
      data: {
        buyerType: qualification.buyerType,
        buyerIntent: qualification.buyerIntent,
        industry: qualification.industry,
        productInterest: qualification.productInterest,
        leadScore: qualification.leadScore,
        aiConfidence: qualification.confidence,
        aiReasoning: qualification.reasoning,
        aiModel: "gemini-1.5-flash",
        aiProcessedAt: new Date(),
      },
    });

    return successResponse(updated, "Lead qualified with Gemini AI successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
