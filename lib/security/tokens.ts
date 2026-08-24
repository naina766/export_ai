import crypto from "crypto";

const SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || "fallback-unsubscribe-secret";

export interface UnsubscribeTokenPayload {
  leadId: string;
  email: string;
  campaignId?: string;
  issuedAt: number;
}

/**
 * Generates a signed tamper-proof unsubscribe token.
 */
export function generateUnsubscribeToken(leadId: string, email: string, campaignId?: string): string {
  const payload: UnsubscribeTokenPayload = {
    leadId,
    email: email.toLowerCase().trim(),
    campaignId,
    issuedAt: Date.now(),
  };

  const json = JSON.stringify(payload);
  const base64Data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

/**
 * Verifies a signed unsubscribe token and extracts the payload.
 */
export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  if (!token || !token.includes(".")) return null;

  try {
    const [base64Data, providedSignature] = token.split(".");
    if (!base64Data || !providedSignature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(base64Data)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    return JSON.parse(json) as UnsubscribeTokenPayload;
  } catch {
    return null;
  }
}
