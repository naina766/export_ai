import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/campaigns/:id/preview
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const emails = await prisma.personalizedEmail.findMany({
      where: { campaignId: params.id },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            country: true,
            leadScore: true,
          },
        },
      },
    });

    return successResponse(emails);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/campaigns/:id/preview
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { leadId, subject, bodyHtml, bodyText, isApproved } = body;

    if (!leadId) return errorResponse("leadId is required", 400);

    const updated = await prisma.personalizedEmail.update({
      where: {
        campaignId_leadId: {
          campaignId: params.id,
          leadId,
        },
      },
      data: {
        ...(subject && { subject }),
        ...(bodyHtml && { bodyHtml }),
        ...(bodyText && { bodyText }),
        ...(isApproved !== undefined && { isApproved }),
      },
    });

    return successResponse(updated, "Personalized email updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
