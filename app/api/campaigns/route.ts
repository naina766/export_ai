import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateCampaignSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
  paginatedResponse,
} from "@/lib/api";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";
import { CampaignStatus, RecipientStatus } from "@prisma/client";

// GET /api/campaigns
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // RBAC: Non-privileged agents can only list campaigns they created
    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const where = isPrivileged ? {} : { createdById: user.userId };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          template: { select: { id: true, name: true } },
          _count: { select: { recipients: true, emailLogs: true, personalizedEmails: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return paginatedResponse(campaigns, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/campaigns
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    if (!body.leadIds && Array.isArray(body.recipientLeadIds)) {
      body.leadIds = body.recipientLeadIds;
    }
    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { leadIds, scheduledAt, attachmentIds, ...rest } = parsed.data;

    // Verify template exists if specified
    if (rest.templateId) {
      const templateExists = await prisma.emailTemplate.findUnique({
        where: { id: rest.templateId },
      });
      if (!templateExists) {
        return errorResponse("Template not found", 404);
      }
    }

    // Verify product exists if specified
    if (rest.productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: rest.productId },
      });
      if (!productExists) {
        return errorResponse("Product not found", 404);
      }
    }

    // Load target leads with verification
    const leads = await prisma.buyerLead.findMany({
      where: {
        id: { in: leadIds },
        emailStatus: { in: ["VALID", "RISKY"] },
        unsubscribeStatus: false,
      },
    });

    if (leads.length === 0) {
      return errorResponse("No deliverable leads selected for this campaign.", 400);
    }

    const campaignStatus = scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT;

    // Database transaction: creates campaign, recipients, and outbox job records.
    // Notice: Gemini AI API calls are completely removed from inside this transaction
    // to prevent holding open database connections or triggering transaction timeouts.
    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          name: rest.name,
          description: rest.description,
          subject: rest.subject,
          templateId: rest.templateId,
          productId: rest.productId,
          dailyLimit: rest.dailyLimit,
          emailsPerMinute: rest.emailsPerMinute,
          delayBetweenEmails: rest.delayBetweenEmails,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: campaignStatus,
          totalRecipients: leads.length,
          createdById: user.userId,
          recipients: {
            create: leads.map((l) => ({
              leadId: l.id,
              status: RecipientStatus.PENDING,
            })),
          },
          ...(attachmentIds && attachmentIds.length > 0 && {
            attachments: {
              create: attachmentIds.map((docId) => ({ documentId: docId })),
            },
          }),
        },
      });

      // Enqueue transactional outbox events for async AI email personalization
      for (const lead of leads) {
        await createOutboxEvent(tx, {
          eventKey: `ai_personalize_${created.id}_${lead.id}`,
          eventType: "AI_CLASSIFY",
          aggregateType: "Campaign",
          aggregateId: created.id,
          payload: {
            leadId: lead.id,
            campaignId: created.id,
          },
        });
      }

      return created;
    });

    return successResponse(campaign, "Campaign created and personalization jobs enqueued.", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
