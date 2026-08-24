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
import { generatePersonalizedEmail } from "@/lib/ai/personalizeEmail";
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

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          template: { select: { id: true, name: true } },
          _count: { select: { recipients: true, emailLogs: true } },
        },
      }),
      prisma.campaign.count(),
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
    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { leadIds, attachmentIds, scheduledAt, ...rest } = parsed.data;

    // Fetch leads & product/template for initial personalization precomputations
    const [leads, rawProduct, template] = await Promise.all([
      prisma.buyerLead.findMany({ where: { id: { in: leadIds } } }),
      rest.productId ? prisma.product.findUnique({ where: { id: rest.productId } }) : null,
      rest.templateId ? prisma.emailTemplate.findUnique({ where: { id: rest.templateId } }) : null,
    ]);

    if (leads.length === 0) {
      return errorResponse("No valid recipient leads selected.", 400);
    }

    const product = rawProduct
      ? {
          name: rawProduct.name,
          material: rawProduct.material,
          frequency: rawProduct.frequency,
          moq: rawProduct.moq,
          priceMin: Number(rawProduct.priceMin),
        }
      : null;

    const campaignStatus = scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT;

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

      // Precompute PersonalizedEmail records for each lead
      for (const lead of leads) {
        const personalized = await generatePersonalizedEmail({
          lead: {
            companyName: lead.companyName,
            contactPerson: lead.contactPerson,
            country: lead.country,
            city: lead.city,
            industry: lead.industry,
            productInterest: lead.productInterest,
            website: lead.website,
          },
          product,
          template,
        });

        await tx.personalizedEmail.create({
          data: {
            campaignId: created.id,
            leadId: lead.id,
            subject: personalized.subject,
            bodyHtml: personalized.bodyHtml,
            bodyText: personalized.bodyText,
            aiGenerated: true,
            isApproved: true,
          },
        });
      }

      return created;
    });

    return successResponse(campaign, "Campaign created and emails personalized.", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
