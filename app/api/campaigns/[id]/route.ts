import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/campaigns/:id
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        template: true,
        attachments: { include: { document: true } },
        recipients: {
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
        },
        personalizedEmails: true,
      },
    });

    if (!campaign) return errorResponse("Campaign not found", 404);

    return successResponse(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/campaigns/:id
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });

    if (!campaign) return errorResponse("Campaign not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const isOwner = campaign.createdById === user.userId;

    if (!isPrivileged && !isOwner) {
      return errorResponse("Forbidden: You do not have permission to delete this campaign", 403);
    }

    await prisma.campaign.delete({ where: { id: params.id } });
    return successResponse({ id: params.id }, "Campaign deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
