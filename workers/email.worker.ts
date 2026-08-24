import { createConsumer, ConsumerPayload } from "@/lib/rabbitmq/consumer";
import { QUEUES } from "@/lib/rabbitmq/topology";
import { sendEmailViaGmail } from "@/lib/gmail/send";
import { prisma } from "@/lib/prisma";
import { OutreachStatus, RecipientStatus } from "@prisma/client";

interface EmailJobPayload {
  campaignId: string;
  leadId: string;
  userId?: string;
}

export async function startEmailWorker() {
  await createConsumer<EmailJobPayload>(
    { queueName: QUEUES.EMAIL, prefetch: 2, maxRetries: 3 },
    async (data: ConsumerPayload<EmailJobPayload>) => {
      const { campaignId, leadId, userId = "system" } = data.payload;
      console.log(`[Email Worker] Processing send job for Campaign ${campaignId}, Lead ${leadId}...`);

      const idempotencyKey = `campaign:${campaignId}:lead:${leadId}`;

      // ── Gate 1: Check Idempotency ───────────────────────────────────────────
      const existingLog = await prisma.emailLog.findUnique({
        where: { idempotencyKey },
      });

      if (existingLog && existingLog.status === "SENT") {
        console.log(`[Email Worker: Idempotent Gate] Already sent to lead ${leadId} for campaign ${campaignId}. Skipping.`);
        return { status: "ALREADY_SENT", idempotencyKey };
      }

      // ── Gate 2: Verify Campaign Active Status ──────────────────────────────
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          attachments: {
            include: { document: true },
          },
        },
      });

      if (!campaign || campaign.status !== "RUNNING") {
        console.warn(`[Email Worker: Campaign Gate] Campaign ${campaignId} is ${campaign?.status || "NOT_FOUND"}. Skipping send.`);
        return { status: "CAMPAIGN_NOT_RUNNING" };
      }

      // ── Gate 3: Check Lead Validity & Consent ───────────────────────────────
      const lead = await prisma.buyerLead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error(`BuyerLead ${leadId} not found.`);

      if (lead.unsubscribeStatus || lead.consentStatus === "UNSUBSCRIBED") {
        console.log(`[Email Worker: Consent Gate] Lead ${lead.email} is unsubscribed. Skipping.`);
        await prisma.campaignRecipient.update({
          where: { campaignId_leadId: { campaignId, leadId } },
          data: { status: RecipientStatus.SKIPPED, errorMessage: "Recipient is unsubscribed." },
        });
        return { status: "UNSUBSCRIBED" };
      }

      if (lead.emailStatus === "INVALID") {
        console.log(`[Email Worker: Validity Gate] Lead ${lead.email} has INVALID email. Skipping.`);
        await prisma.campaignRecipient.update({
          where: { campaignId_leadId: { campaignId, leadId } },
          data: { status: RecipientStatus.SKIPPED, errorMessage: "Email marked invalid." },
        });
        return { status: "INVALID_EMAIL" };
      }

      // ── Gate 4: Check Precomputed & Approved Personalized Email ────────────
      const personalized = await prisma.personalizedEmail.findUnique({
        where: { campaignId_leadId: { campaignId, leadId } },
      });

      if (!personalized || !personalized.isApproved) {
        console.warn(`[Email Worker: Approval Gate] Personalized email for lead ${leadId} is not approved yet.`);
        return { status: "NOT_APPROVED" };
      }

      // ── Gate 5: Throttling Delay ────────────────────────────────────────────
      if (campaign.delayBetweenEmails && campaign.delayBetweenEmails > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(campaign.delayBetweenEmails, 10000)));
      }

      // ── Dispatch: Send Email ────────────────────────────────────────────────
      const attachments = campaign.attachments.map((att) => ({
        name: att.document.name,
        url: att.document.url,
        mimeType: att.document.mimeType,
      }));

      const sendResult = await sendEmailViaGmail({
        userId: campaign.createdById || userId,
        leadId: lead.id,
        campaignId: campaign.id,
        toEmail: lead.email,
        toName: lead.contactPerson || lead.companyName,
        subject: personalized.subject,
        bodyHtml: personalized.bodyHtml,
        bodyText: personalized.bodyText,
        attachments,
      });

      if (sendResult.success) {
        // Record EmailLog
        await prisma.emailLog.upsert({
          where: { idempotencyKey },
          update: {
            status: "SENT",
            providerMessageId: sendResult.providerMessageId,
            senderEmail: sendResult.senderEmail,
            sentAt: new Date(),
          },
          create: {
            idempotencyKey,
            campaignId,
            leadId,
            recipientEmail: lead.email,
            senderEmail: sendResult.senderEmail,
            subject: personalized.subject,
            status: "SENT",
            providerMessageId: sendResult.providerMessageId,
            sentAt: new Date(),
          },
        });

        // Update CampaignRecipient
        await prisma.campaignRecipient.update({
          where: { campaignId_leadId: { campaignId, leadId } },
          data: {
            status: RecipientStatus.SENT,
            sentAt: new Date(),
            providerMessageId: sendResult.providerMessageId,
            errorMessage: null,
          },
        });

        // Update Campaign sent counter
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });

        // Update BuyerLead outreach status
        await prisma.buyerLead.update({
          where: { id: leadId },
          data: {
            outreachStatus: OutreachStatus.SENT,
            lastContactedAt: new Date(),
          },
        });

        // Log Outreach Activity
        await prisma.activity.create({
          data: {
            type: "EMAIL",
            title: `Campaign Email Sent: ${campaign.name}`,
            description: `Sent "${personalized.subject}" to ${lead.email}`,
            userId: campaign.createdById,
            leadId: lead.id,
          },
        });

        return {
          status: "SENT",
          leadId,
          email: lead.email,
          providerMessageId: sendResult.providerMessageId,
        };
      } else {
        // Record Failure
        await prisma.campaignRecipient.update({
          where: { campaignId_leadId: { campaignId, leadId } },
          data: {
            status: RecipientStatus.FAILED,
            failedAt: new Date(),
            errorMessage: sendResult.error || "Unknown send error",
          },
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });

        throw new Error(`Gmail API sending failed: ${sendResult.error}`);
      }
    }
  );
}
