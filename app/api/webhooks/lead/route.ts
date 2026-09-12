import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { validateEmailAddress } from "@/lib/email/validator";
import { ActivityType } from "@prisma/client";
import { rateLimiter } from "@/lib/security/rate-limit";
import crypto from "crypto";

/**
 * Verifies HMAC-SHA256 signature over the raw body.
 * The caller must provide:
 *   x-webhook-signature: sha256=<hex_digest>
 */
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed in production; log a clear startup error
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: LEAD_WEBHOOK_SECRET is not set. Webhook endpoint is disabled.");
    }
    return false; // dev: reject unsigned requests
  }
  if (!signature) return false;

  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Pad to equal length to prevent timing differences from revealing prefix
  const sigBuf = Buffer.from(signature.padEnd(expected.length, "\0"));
  const expBuf = Buffer.from(expected.padEnd(signature.length, "\0"));

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// POST /api/webhooks/lead - Ingest leads from external forms / catalogs
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = rateLimiter.check(`webhook:lead:${ip}`, 30, 60_000);
    if (!rl.success) {
      return errorResponse("Too many requests", 429);
    }

    // Read raw body FIRST — must happen before any req.json() call
    const rawBody = await req.text();

    // Verify HMAC signature
    const signature = req.headers.get("x-webhook-signature");
    let signatureValid: boolean;
    try {
      signatureValid = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      // LEAD_WEBHOOK_SECRET missing in production
      console.error("[Webhook] Configuration error:", (err as Error).message);
      return errorResponse("Webhook service unavailable", 503);
    }

    if (!signatureValid) {
      return errorResponse("Unauthorized: Invalid or missing webhook signature", 401);
    }

    // Parse body after signature verification
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { companyName, contactPerson, email, phone, country, notes, source, productInterest } =
      body as Record<string, string | undefined>;

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