import test from "node:test";
import assert from "node:assert/strict";
import { encryptToken, decryptToken } from "../lib/security/encryption";

test("AES-256-GCM Encryption & Decryption", () => {
  const originalToken = "ya29.a0AfH6SMD_SampleGoogleOAuthAccessToken1234567890";

  const encrypted = encryptToken(originalToken);
  assert.notEqual(encrypted, originalToken, "Encrypted token should differ from plaintext");
  assert.ok(encrypted.length > 20, "Encrypted token should have valid length");

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, originalToken, "Decrypted token must match original exactly");
});

test("Handles empty or invalid token decryption gracefully", () => {
  assert.equal(encryptToken(""), "");
  assert.equal(decryptToken(""), "");
  assert.equal(decryptToken("invalid-base64-string"), "");
});
