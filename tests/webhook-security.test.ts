import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

function computeSignature(body: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function verifyWebhook(rawBody: string, signature: string | null, secret?: string): boolean {
  if (!secret) return false;
  if (!signature) return false;

  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature.padEnd(expected.length, "\0"));
  const expBuf = Buffer.from(expected.padEnd(signature.length, "\0"));

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

test("Webhook Security: Valid HMAC-SHA256 signature succeeds", () => {
  const secret = "test-webhook-secret-32-chars-long";
  const body = JSON.stringify({
    companyName: "Berlin Sound Center",
    email: "buyer@berlinsound.de",
    country: "Germany",
  });

  const signature = computeSignature(body, secret);
  const isValid = verifyWebhook(body, signature, secret);

  assert.equal(isValid, true, "Authentic HMAC signature must verify");
});

test("Webhook Security: Tampered body or forged signature fails", () => {
  const secret = "test-webhook-secret-32-chars-long";
  const body = JSON.stringify({ companyName: "Real Buyer", email: "real@test.com" });
  const signature = computeSignature(body, secret);

  // Tamper body
  const tamperedBody = JSON.stringify({ companyName: "Injected Buyer", email: "hacker@test.com" });
  assert.equal(verifyWebhook(tamperedBody, signature, secret), false, "Tampered payload must be rejected");

  // Forged signature
  const forgedSig = computeSignature(body, "attacker-secret");
  assert.equal(verifyWebhook(body, forgedSig, secret), false, "Signature signed with wrong secret must be rejected");
});

test("Webhook Security: Missing signature or missing secret fails closed", () => {
  const secret = "test-webhook-secret-32-chars-long";
  const body = "{}";

  assert.equal(verifyWebhook(body, null, secret), false, "Missing signature must fail");
  assert.equal(verifyWebhook(body, "", secret), false, "Empty signature must fail");
  assert.equal(verifyWebhook(body, "sha256=abcdef", undefined), false, "Missing secret must fail closed");
});
