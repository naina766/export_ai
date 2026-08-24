import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { qualifyBuyerLead } from "@/lib/ai/classifyLead";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { leadId } = await req.json();
    if (!leadId) return errorResponse("leadId is required", 400);

    const lead = await prisma.buyerLead.findUnique({
      where: { id: leadId },
    });

    if (!lead) return errorResponse("Buyer Lead not found", 404);

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
      where: { id: leadId },
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

    return successResponse(updated, "Lead qualified successfully with Gemini AI");
  } catch (error) {
    return handleApiError(error);
  }
}
