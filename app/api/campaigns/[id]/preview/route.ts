import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { ApprovePersonalizedEmailSchema } from "@/lib/validations";

// GET /api/campaigns/:id/preview
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    // Lightweight ownership check before loading any sensitive email content
    const campaignMeta = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });
    if (!campaignMeta) return errorResponse("Campaign not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const isOwner = campaignMeta.createdById === user.userId;
    if (!isPrivileged && !isOwner) {
      return errorResponse("Forbidden: You do not have permission to preview this campaign", 403);
    }

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

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });
    if (!campaign) {
      return errorResponse("Campaign not found", 404);
    }

    // RBAC: Admins and Managers can approve any campaign; Agents can approve their assigned/created campaigns
    if (user.role === "AGENT" && campaign.createdById && campaign.createdById !== user.userId) {
      return errorResponse("Forbidden: You do not have permission to review or approve this campaign", 403);
    }

    const body = await req.json();
    const parsed = ApprovePersonalizedEmailSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { leadId, subject, bodyHtml, bodyText, isApproved } = parsed.data;

    // Verify draft exists
    const existing = await prisma.personalizedEmail.findUnique({
      where: {
        campaignId_leadId: {
          campaignId: params.id,
          leadId,
        },
      },
    });
    if (!existing) {
      return errorResponse("Personalized email draft not found for this campaign and recipient", 404);
    }

    const updated = await prisma.personalizedEmail.update({
      where: {
        campaignId_leadId: {
          campaignId: params.id,
          leadId,
        },
      },
      data: {
        ...(subject !== undefined && { subject }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(isApproved !== undefined && { isApproved }),
      },
    });

    return successResponse(updated, "Personalized email updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
