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

    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return errorResponse("Campaign not found", 404);

    const newStatus = campaign.status === CampaignStatus.RUNNING
      ? CampaignStatus.PAUSED
      : CampaignStatus.RUNNING;

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    return successResponse(
      updated,
      `Campaign status updated to ${newStatus}.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
