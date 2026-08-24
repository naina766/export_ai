import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";
import { CampaignStatus, RecipientStatus } from "@prisma/client";

// POST /api/campaigns/:id/start
export async function POST(
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
        recipients: {
          where: { status: RecipientStatus.PENDING },
        },
      },
    });

    if (!campaign) return errorResponse("Campaign not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const camp = await tx.campaign.update({
        where: { id: params.id },
        data: {
          status: CampaignStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // Enqueue Outbox events for all pending recipients
      for (const recipient of campaign.recipients) {
        await createOutboxEvent(tx, {
          eventKey: `campaign:${campaign.id}:lead:${recipient.leadId}:send`,
          eventType: "CAMPAIGN_SEND",
          aggregateType: "Campaign",
          aggregateId: campaign.id,
          payload: {
            campaignId: campaign.id,
            leadId: recipient.leadId,
            userId: user.userId,
          },
        });
      }

      return camp;
    });

    return successResponse(
      updated,
      `Campaign launched with ${campaign.recipients.length} queued recipient jobs.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
