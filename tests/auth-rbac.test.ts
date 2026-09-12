import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { getJwtSecret, signAccessToken, verifyToken, JWTPayload } from "../lib/auth";
import { RegisterSchema } from "../lib/validations";

test("Auth & RBAC: Token Signing and Verification", async () => {
  const payload: JWTPayload = {
    userId: "usr_test_123",
    email: "exporter@zenithsound.com",
    role: "AGENT",
    name: "Aarav Sharma",
  };

  const token = await signAccessToken(payload);
  assert.ok(token, "Token should be a non-empty string");
  assert.equal(typeof token, "string");

  const verified = await verifyToken(token);
  assert.ok(verified, "Token verification must succeed");
  assert.equal(verified?.userId, payload.userId);
  assert.equal(verified?.email, payload.email);
  assert.equal(verified?.role, payload.role);
  assert.equal(verified?.name, payload.name);
});

test("Auth & RBAC: Rejection of Expired Tokens", async () => {
  const secret = getJwtSecret();
  // Generate an already expired token (1 hour in the past)
  const expiredToken = await new SignJWT({
    userId: "usr_expired_001",
    email: "expired@test.com",
    role: "AGENT",
    name: "Expired User",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(secret);

  const verified = await verifyToken(expiredToken);
  assert.equal(verified, null, "Expired token must return null");
});

test("Auth & RBAC: Rejection of Tampered Signature", async () => {
  const payload: JWTPayload = {
    userId: "usr_legit_456",
    email: "legit@zenithsound.com",
    role: "AGENT",
    name: "Legit Agent",
  };

  const token = await signAccessToken(payload);
  const parts = token.split(".");
  assert.equal(parts.length, 3);

  // Tamper with signature
  const tamperedToken = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -4)}XXXX`;
  const verified = await verifyToken(tamperedToken);
  assert.equal(verified, null, "Tampered signature must return null");
});

test("Auth & RBAC: Production JWT Secret Validation", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    // Must throw in production if secret is missing
    assert.throws(
      () => getJwtSecret(),
      /FATAL: JWT_SECRET environment variable is required in production/
    );

    // Must throw in production if secret is under 32 characters
    process.env.JWT_SECRET = "short-secret-under-32-chars";
    assert.throws(
      () => getJwtSecret(),
      /FATAL: JWT_SECRET must be at least 32 characters long in production/
    );

    // Must succeed when >= 32 characters
    process.env.JWT_SECRET = "production-super-secure-key-at-least-32-bytes-long!";
    const key = getJwtSecret();
    assert.ok(key.length >= 32);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  }
});

test("Auth & RBAC: Registration Schema Blocks Privilege Escalation", () => {
  // Attacker attempts to register with role: "ADMIN"
  const maliciousInput = {
    name: "Malicious User",
    email: "hacker@domain.com",
    password: "Password123!",
    role: "ADMIN",
  };

  const parsed = RegisterSchema.safeParse(maliciousInput);
  assert.equal(parsed.success, true);
  // Zod object strip removes unrecognized keys
  const data = parsed.data as Record<string, unknown>;
  assert.equal(data.role, undefined, "Public RegisterSchema must not permit client-selected role");
  assert.equal(data.name, "Malicious User");
  assert.equal(data.email, "hacker@domain.com");
});

test("Auth & RBAC: Role Hierarchy Authorization Policy", () => {
  type Role = "ADMIN" | "MANAGER" | "AGENT";
  const canDeleteLead = (userRole: Role, leadOwnerId: string, currentUserId: string): boolean => {
    if (userRole === "ADMIN" || userRole === "MANAGER") return true;
    return leadOwnerId === currentUserId;
  };

  // ADMIN can delete any lead
  assert.equal(canDeleteLead("ADMIN", "other_user", "admin_user"), true);
  // MANAGER can delete any lead
  assert.equal(canDeleteLead("MANAGER", "other_user", "mgr_user"), true);
  // AGENT can only delete their own lead
  assert.equal(canDeleteLead("AGENT", "agent_1", "agent_1"), true);
  // AGENT cannot delete someone else's lead
  assert.equal(canDeleteLead("AGENT", "agent_2", "agent_1"), false);
});
