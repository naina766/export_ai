import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  UnsubscribeTokenPayload,
} from "../lib/security/tokens";

test("Unsubscribe Token: Generate & Verify valid token", () => {
  const leadId = "lead_123456";
  const email = "buyer@soundtherapy.co.uk";
  const campaignId = "camp_789";

  const token = generateUnsubscribeToken(leadId, email, campaignId);
  assert.ok(token.includes("."), "Signed token should contain base64 and signature parts");

  const verified = verifyUnsubscribeToken(token);
  assert.notEqual(verified, null);
  assert.equal(verified?.leadId, leadId);
  assert.equal(verified?.email, email);
  assert.equal(verified?.campaignId, campaignId);
});

test("Unsubscribe Token: Rejects tampered token", () => {
  const token = generateUnsubscribeToken("lead_123", "test@example.com");
  const [data] = token.split(".");
  const tamperedToken = `${data}.tamperedSignature12345`;

  const verified = verifyUnsubscribeToken(tamperedToken);
  assert.equal(verified, null, "Tampered signature must be rejected");
});

test("Unsubscribe Token: Rejects expired token", () => {
  const leadId = "lead_expired_test";
  const email = "expired@example.com";
  const token = generateUnsubscribeToken(leadId, email);

  // Verify with a 0ms max age window to simulate expiration
  const verified = verifyUnsubscribeToken(token, -1000);
  assert.equal(verified, null, "Expired unsubscribe token must be rejected");
});

test("Unsubscribe Token: Rejects tokens with future timestamps beyond clock skew", () => {
  const futurePayload: UnsubscribeTokenPayload = {
    leadId: "lead_future",
    email: "future@example.com",
    issuedAt: Date.now() + 10 * 60 * 1000, // 10 minutes in the future
  };

  const secret = process.env.UNSUBSCRIBE_SECRET || "dev-only-unsubscribe-secret-not-for-production";
  const data = Buffer.from(JSON.stringify(futurePayload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const futureToken = `${data}.${sig}`;

  const verified = verifyUnsubscribeToken(futureToken);
  assert.equal(verified, null, "Future-dated unsubscribe token must be rejected");
});

test("Unsubscribe Token: Fails closed in production if secret is missing", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.UNSUBSCRIBE_SECRET;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.UNSUBSCRIBE_SECRET;

    assert.throws(
      () => {
        generateUnsubscribeToken("lead_prod", "prod@example.com");
      },
      /FATAL: UNSUBSCRIBE_SECRET environment variable is required in production/,
      "Must fail closed in production without secret"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    if (originalSecret) process.env.UNSUBSCRIBE_SECRET = originalSecret;
  }
});
