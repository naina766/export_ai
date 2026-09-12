import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { CampaignStatus } from "@prisma/client";

// POST /api/campaigns/:id/pause
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    // Lightweight ownership check before any state changes
    const campaignMeta = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true, status: true },
    });
    if (!campaignMeta) return errorResponse("Campaign not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const isOwner = campaignMeta.createdById === user.userId;
    if (!isPrivileged && !isOwner) {
      return errorResponse("Forbidden: You do not have permission to pause this campaign", 403);
    }

    const newStatus =
      campaignMeta.status === CampaignStatus.RUNNING
        ? CampaignStatus.PAUSED
        : CampaignStatus.RUNNING;

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    return successResponse(updated, `Campaign status updated to ${newStatus}.`);
  } catch (error) {
    return handleApiError(error);
  }
}

