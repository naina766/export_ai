import { createConsumer, ConsumerPayload } from "@/lib/rabbitmq/consumer";
import { QUEUES } from "@/lib/rabbitmq/topology";
import { prisma } from "@/lib/prisma";
import { qualifyBuyerLead } from "@/lib/ai/classifyLead";
import { generatePersonalizedEmail } from "@/lib/ai/personalizeEmail";

export interface AIJobPayload {
  leadId: string;
  campaignId?: string;
}

export async function startAIWorker() {
  await createConsumer<AIJobPayload>(
    { queueName: QUEUES.AI, prefetch: 5, maxRetries: 3 },
    async (data: ConsumerPayload<AIJobPayload>) => {
      const { leadId, campaignId } = data.payload;
      console.log(`[AI Worker] Qualifying BuyerLead ${leadId}...`);

      const lead = await prisma.buyerLead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        console.warn(`[AI Worker] BuyerLead ${leadId} not found.`);
        return { skipped: true };
      }

      // 1. Run Gemini AI qualification & classification
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

      // Update BuyerLead record
      await prisma.buyerLead.update({
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

      // 2. If a campaignId is specified or if lead is part of active campaign recipients, precompute PersonalizedEmail
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { template: true, product: true },
        });

        if (campaign) {
          const product = campaign.product
            ? {
              name: campaign.product.name,
              material: campaign.product.material,
              frequency: campaign.product.frequency,
              moq: campaign.product.moq,
              priceMin: Number(campaign.product.priceMin),
            }
            : null;

          const personalized = await generatePersonalizedEmail({
            lead: {
              companyName: lead.companyName,
              contactPerson: lead.contactPerson,
              country: lead.country,
              city: lead.city,
              industry: qualification.industry,
              productInterest: qualification.productInterest,
              website: lead.website,
            },
            product,
            template: campaign.template,
          });

          await prisma.personalizedEmail.upsert({
            where: {
              campaignId_leadId: {
                campaignId,
                leadId,
              },
            },
            update: {
              subject: personalized.subject,
              bodyHtml: personalized.bodyHtml,
              bodyText: personalized.bodyText,
              aiGenerated: true,
              isApproved: false,
            },
            create: {
              campaignId,
              leadId,
              subject: personalized.subject,
              bodyHtml: personalized.bodyHtml,
              bodyText: personalized.bodyText,
              aiGenerated: true,
              isApproved: false,
            },
          });
        }
      }

      return {
        leadId,
        score: qualification.leadScore,
        buyerType: qualification.buyerType,
      };
    }
  );
}
