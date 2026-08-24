import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { validateEmailAddress } from "@/lib/email/validator";
import { ActivityType } from "@prisma/client";

// POST /api/webhooks/lead - Ingest leads from external forms / catalogs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, contactPerson, email, phone, country, notes, source, productInterest } = body;

    if (!companyName || !email) {
      return errorResponse("companyName and email are required", 400);
    }

    const val = validateEmailAddress(email);
    const normalized = val.normalizedEmail;

    const existing = await prisma.buyerLead.findUnique({
      where: { normalizedEmail: normalized },
    });

    if (existing) {
      return successResponse({ id: existing.id, isDuplicate: true }, "Lead already exists");
    }

    const lead = await prisma.buyerLead.create({
      data: {
        companyName,
        contactPerson,
        email,
        normalizedEmail: normalized,
        emailStatus: val.status,
        phone,
        country: country || "Unknown",
        productInterest,
        notes,
        source: source || "INBOUND_WEBHOOK",
      },
    });

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "Inbound Buyer Webhook Lead",
        description: `Lead ingested from webhook source: ${source || "External Form"}`,
        leadId: lead.id,
      },
    });

    return successResponse(lead, "Buyer lead ingested successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
