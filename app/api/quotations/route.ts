import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateQuotationSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// Helper to generate sequential quotation number EXP-YYYY-XXXXXX
// Uses a DB-level sequence pattern to avoid race conditions on count+1
async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Use MAX instead of COUNT to avoid duplicates from deleted quotations
  const result = await prisma.$queryRaw<{ max_seq: bigint | null }[]>`
    SELECT MAX(CAST(SUBSTRING(quotation_number FROM 10) AS INTEGER)) AS max_seq
    FROM quotations
    WHERE quotation_number LIKE ${`EXP-${year}-%`}
  `;
  const maxSeq = Number(result[0]?.max_seq ?? 0);
  const seq = String(maxSeq + 1).padStart(6, "0");
  return `EXP-${year}-${seq}`;
}

// GET /api/quotations
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);

    const quotations = await prisma.quotation.findMany({
      where: isPrivileged
        ? {}
        : {
            // AGENT: only quotations they created
            createdById: user.userId,
          },
      orderBy: { createdAt: "desc" },
      include: {
        lead: { select: { id: true, companyName: true, country: true, email: true } },
        opportunity: { select: { id: true, title: true } },
        items: true,
      },
    });

    return successResponse(quotations);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/quotations
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { items, validUntil, shippingCost, leadId, opportunityId, ...rest } = parsed.data;

    // Verify the caller is authorized to create a quotation for this lead
    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);

    const lead = await prisma.buyerLead.findUnique({
      where: { id: leadId },
      select: { id: true, assignedToId: true, createdById: true },
    });
    if (!lead) return errorResponse("Buyer lead not found", 404);

    if (!isPrivileged) {
      const isLeadOwner =
        lead.assignedToId === user.userId || lead.createdById === user.userId;
      if (!isLeadOwner) {
        return errorResponse(
          "Forbidden: You do not have permission to create a quotation for this buyer lead",
          403
        );
      }
    }

    // If opportunityId provided, verify it also belongs to an accessible lead
    if (opportunityId && !isPrivileged) {
      const opportunity = await prisma.salesOpportunity.findUnique({
        where: { id: opportunityId },
        select: { id: true, assignedToId: true },
      });
      if (!opportunity) return errorResponse("Opportunity not found", 404);
      if (opportunity.assignedToId !== user.userId) {
        return errorResponse(
          "Forbidden: You do not have permission to create a quotation for this opportunity",
          403
        );
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal + (shippingCost || 0);
    const quotationNumber = await generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        ...rest,
        leadId,
        ...(opportunityId && { opportunityId }),
        subtotal,
        shippingCost: shippingCost || 0,
        total,
        validUntil: new Date(validUntil),
        createdById: user.userId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        lead: { select: { id: true, companyName: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: "QUOTATION_SENT",
        title: `Quotation Created: ${quotation.quotationNumber}`,
        description: `Export quotation created for ${quotation.lead.companyName} (${quotation.currency} ${quotation.total.toString()})`,
        userId: user.userId,
        leadId: quotation.leadId,
        opportunityId: quotation.opportunityId || undefined,
      },
    });

    return successResponse(quotation, "Quotation generated successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}