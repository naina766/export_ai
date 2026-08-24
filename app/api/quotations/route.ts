import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateQuotationSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// Helper to generate sequential quotation number EXP-YYYY-XXXXXX
async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count();
  const seq = String(count + 1).padStart(6, "0");
  return `EXP-${year}-${seq}`;
}

// GET /api/quotations
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const quotations = await prisma.quotation.findMany({
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

    const { items, validUntil, shippingCost, ...rest } = parsed.data;

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal + (shippingCost || 0);
    const quotationNumber = await generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        ...rest,
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
