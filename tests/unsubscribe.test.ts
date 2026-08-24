import test from "node:test";
import assert from "node:assert/strict";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "../lib/security/tokens";

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
