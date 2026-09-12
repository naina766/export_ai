import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  generateOAuthState,
  verifyOAuthState,
  _clearOAuthNoncesForTesting,
  OAUTH_STATE_MAX_AGE_MS,
  OAuthStatePayload,
} from "../lib/gmail/oauth";

test("OAuth State Hardening: Valid state verifies correctly", () => {
  _clearOAuthNoncesForTesting();
  const userId = "user_cuid_test_123";
  const state = generateOAuthState(userId);

  assert.ok(state.includes("."), "State should contain data and signature");

  const verified = verifyOAuthState(state);
  assert.notEqual(verified, null);
  assert.equal(verified?.userId, userId);
});

test("OAuth State Hardening: Replayed state is rejected (single-use enforcement)", () => {
  _clearOAuthNoncesForTesting();
  const userId = "user_cuid_test_replay";
  const state = generateOAuthState(userId);

  // First verification succeeds
  const firstVerified = verifyOAuthState(state);
  assert.notEqual(firstVerified, null);
  assert.equal(firstVerified?.userId, userId);

  // Immediate second verification with the same state MUST fail (anti-replay)
  const secondVerified = verifyOAuthState(state);
  assert.equal(secondVerified, null, "Replayed OAuth state must be rejected");
});

test("OAuth State Hardening: Invalid signature is rejected", () => {
  _clearOAuthNoncesForTesting();
  const state = generateOAuthState("user_cuid_test_tamper");
  const [data] = state.split(".");
  const forgedHmac = crypto.createHmac("sha256", "wrong-secret").update(data).digest("base64url");
  const forgedState = `${data}.${forgedHmac}`;

  const verified = verifyOAuthState(forgedState);
  assert.equal(verified, null, "Forged signature must be rejected");
});

test("OAuth State Hardening: Expired state is rejected", () => {
  _clearOAuthNoncesForTesting();
  const expiredPayload: OAuthStatePayload = {
    userId: "user_expired_test",
    nonce: crypto.randomBytes(16).toString("hex"),
    issuedAt: Date.now() - (OAUTH_STATE_MAX_AGE_MS + 5000), // 5 seconds past expiry
  };

  const secret = process.env.JWT_SECRET || "dev-oauth-state-secret-32-chars-long";
  const data = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const expiredState = `${data}.${hmac}`;

  const verified = verifyOAuthState(expiredState);
  assert.equal(verified, null, "Expired OAuth state must be rejected");
});

test("OAuth State Hardening: Future-dated state beyond clock skew is rejected", () => {
  _clearOAuthNoncesForTesting();
  const futurePayload: OAuthStatePayload = {
    userId: "user_future_test",
    nonce: crypto.randomBytes(16).toString("hex"),
    issuedAt: Date.now() + 5 * 60 * 1000, // 5 minutes in future
  };

  const secret = process.env.JWT_SECRET || "dev-oauth-state-secret-32-chars-long";
  const data = Buffer.from(JSON.stringify(futurePayload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const futureState = `${data}.${hmac}`;

  const verified = verifyOAuthState(futureState);
  assert.equal(verified, null, "Future-dated OAuth state must be rejected");
});

test("OAuth State Hardening: Malformed state strings are rejected", () => {
  _clearOAuthNoncesForTesting();
  assert.equal(verifyOAuthState(""), null);
  assert.equal(verifyOAuthState(null), null);
  assert.equal(verifyOAuthState(undefined), null);
  assert.equal(verifyOAuthState("not-a-valid-state-without-dot"), null);
  assert.equal(verifyOAuthState("part1.part2.part3"), null);
  assert.equal(verifyOAuthState("badBase64!.signature"), null);
});
