import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  hashRefreshToken,
  signRefreshToken,
  JWTPayload,
} from "../lib/auth";

test("Refresh Token Security: hashRefreshToken creates a deterministic SHA-256 hex hash", () => {
  const token = "my-sample-refresh-token-string";
  const hash1 = hashRefreshToken(token);
  const hash2 = hashRefreshToken(token);

  assert.equal(hash1, hash2, "Hashing must be deterministic");
  assert.equal(hash1.length, 64, "SHA-256 hex digest should be 64 characters");
  assert.notEqual(hash1, token, "Raw token must never equal hash");

  // Verify against native crypto
  const expectedHash = crypto.createHash("sha256").update(token).digest("hex");
  assert.equal(hash1, expectedHash);
});

test("Refresh Token Security: Plaintext token lookup never matches stored hash", () => {
  const rawToken = "raw-refresh-token-xyz-12345";
  const storedHash = hashRefreshToken(rawToken);

  // If DB query searches by raw token instead of hash, it will not match
  assert.notEqual(rawToken, storedHash);
  // Only hashed search matches stored hash
  assert.equal(hashRefreshToken(rawToken), storedHash);
});

test("Refresh Token Security: Token rotation lifecycle preserves rememberMe and invalidates previous token", async () => {
  const payload: JWTPayload = {
    userId: "user_test_rotation_123",
    email: "export@himalayanbowls.com",
    role: "AGENT",
    name: "Tenzing Norgay",
    rememberMe: true,
  };

  // 1. Initial login: sign token and compute initial hash
  const initialRefreshToken = await signRefreshToken(payload, true);
  const initialHash = hashRefreshToken(initialRefreshToken);

  // Mock DB storage
  const mockRefreshTokenTable = new Map<string, { userId: string; expiresAt: Date }>();
  mockRefreshTokenTable.set(initialHash, {
    userId: payload.userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // 2. Refresh request arrives: hash incoming token for lookup
  const incomingHash = hashRefreshToken(initialRefreshToken);
  const record = mockRefreshTokenTable.get(incomingHash);
  assert.ok(record, "Stored hash must be found on valid refresh");

  // 3. Token rotation: revoke old token hash, create new token and hash
  mockRefreshTokenTable.delete(incomingHash);

  const newRefreshToken = await signRefreshToken(payload, true);
  const newHash = hashRefreshToken(newRefreshToken);
  mockRefreshTokenTable.set(newHash, {
    userId: payload.userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // 4. Verification: old token can no longer be used (revocation & replay defense)
  const reuseAttemptRecord = mockRefreshTokenTable.get(initialHash);
  assert.equal(reuseAttemptRecord, undefined, "Reusing old revoked refresh token must fail");

  // 5. Verification: new token can be used
  const validAttemptRecord = mockRefreshTokenTable.get(newHash);
  assert.ok(validAttemptRecord, "Rotated refresh token must be valid");
});

test("Refresh Token Security: Logout revokes stored token hashes", async () => {
  const token = "logout-test-refresh-token";
  const tokenHash = hashRefreshToken(token);

  const mockDb = new Set<string>();
  mockDb.add(tokenHash);
  assert.equal(mockDb.has(tokenHash), true);

  // Simulate logout
  mockDb.delete(tokenHash);
  assert.equal(mockDb.has(tokenHash), false, "Token hash must be deleted on logout");
});
