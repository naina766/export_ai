import crypto from "crypto";

function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: UNSUBSCRIBE_SECRET environment variable is required in production."
    );
  }
  // Development fallback only — never used in production
  return "dev-only-unsubscribe-secret-not-for-production";
}

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

  const secret = getUnsubscribeSecret();
  const json = JSON.stringify(payload);
  const base64Data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

// Unsubscribe tokens are valid for 90 days to respect CAN-SPAM/GDPR while preventing indefinite replay
export const UNSUBSCRIBE_TOKEN_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

// Maximum allowed clock skew: 5 minutes (prevents tokens "issued in the future")
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verifies a signed unsubscribe token and extracts the payload.
 * Checks HMAC signature, enforces token expiry, and rejects future-issued tokens.
 */
export function verifyUnsubscribeToken(
  token: string,
  maxAgeMs: number = UNSUBSCRIBE_TOKEN_MAX_AGE_MS
): UnsubscribeTokenPayload | null {
  if (!token || !token.includes(".")) return null;

  try {
    const secret = getUnsubscribeSecret();
    const [base64Data, providedSignature] = token.split(".");
    if (!base64Data || !providedSignature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(base64Data)
      .digest("base64url");

    // Constant-time comparison — pad to same length first
    const sigBuf = Buffer.from(providedSignature.padEnd(expectedSignature.length, "\0"));
    const expBuf = Buffer.from(expectedSignature.padEnd(providedSignature.length, "\0"));
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as UnsubscribeTokenPayload;

    if (!payload.leadId || !payload.email || !payload.issuedAt) {
      return null;
    }

    const now = Date.now();

    // Reject tokens issued in the future beyond clock-skew tolerance
    if (payload.issuedAt > now + CLOCK_SKEW_TOLERANCE_MS) {
      return null;
    }

    // Enforce expiry
    if (now - payload.issuedAt > maxAgeMs) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}
