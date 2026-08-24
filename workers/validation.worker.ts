import { createConsumer, ConsumerPayload } from "@/lib/rabbitmq/consumer";
import { QUEUES } from "@/lib/rabbitmq/topology";
import { validateEmailAddress } from "@/lib/email/validator";
import { prisma } from "@/lib/prisma";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";

interface ValidationJobPayload {
  leadId: string;
}

export async function startValidationWorker() {
  await createConsumer<ValidationJobPayload>(
    { queueName: QUEUES.VALIDATION, prefetch: 10, maxRetries: 3 },
    async (data: ConsumerPayload<ValidationJobPayload>) => {
      const { leadId } = data.payload;
      console.log(`[Validation Worker] Validating BuyerLead ${leadId}...`);

      const lead = await prisma.buyerLead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error(`BuyerLead ${leadId} not found.`);

      const result = validateEmailAddress(lead.email);

      await prisma.buyerLead.update({
        where: { id: leadId },
        data: {
          emailStatus: result.status,
          verificationStatus: result.reason,
        },
      });

      // If valid, create AI classification outbox event
      if (result.isValid) {
        await createOutboxEvent(prisma, {
          eventKey: `lead:${lead.id}:classify`,
          eventType: "AI_CLASSIFY",
          aggregateType: "BuyerLead",
          aggregateId: lead.id,
          payload: { leadId: lead.id },
        });
      }

      return {
        leadId,
        email: lead.email,
        status: result.status,
        reason: result.reason,
      };
    }
  );
}
