import test from "node:test";
import assert from "node:assert/strict";
import { CreateBuyerLeadSchema } from "../lib/validations";
import { rateLimiter } from "../lib/security/rate-limit";

test("CRM Workflow: Lead Validation requires mandatory fields", () => {
  const validLead = {
    companyName: "Nordic Wellness Importers",
    contactPerson: "Astrid Lindgren",
    email: "astrid@nordicwellness.se",
    phone: "+46 8 123 4567",
    country: "Sweden",
    source: "EXHIBITION",
  };

  const parsed = CreateBuyerLeadSchema.safeParse(validLead);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.companyName, "Nordic Wellness Importers");
    assert.equal(parsed.data.country, "Sweden");
  }
});

test("CRM Workflow: Lead Validation rejects invalid emails and missing required fields", () => {
  // Missing required companyName and invalid email
  const invalidLead = {
    contactPerson: "John Doe",
    email: "not-an-email",
    country: "USA",
  };

  const parsed = CreateBuyerLeadSchema.safeParse(invalidLead);
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const errorPaths = parsed.error.issues.map((e) => e.path.join("."));
    assert.ok(errorPaths.includes("companyName"), "Should flag missing companyName");
    assert.ok(errorPaths.includes("email"), "Should flag invalid email syntax");
  }
});

test("CRM Workflow: Email normalization and duplicate detection logic", () => {
  const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase();
  };

  const raw1 = "  Buyer@ZenithDistributors.COM ";
  const raw2 = "buyer@zenithdistributors.com";
  const raw3 = "BUYER@ZENITHDISTRIBUTORS.COM";

  assert.equal(normalizeEmail(raw1), "buyer@zenithdistributors.com");
  assert.equal(normalizeEmail(raw2), "buyer@zenithdistributors.com");
  assert.equal(normalizeEmail(raw3), "buyer@zenithdistributors.com");

  // Duplicate detection index simulation
  const existingEmails = new Set(["buyer@zenithdistributors.com", "importer@berlinwellness.de"]);
  assert.equal(existingEmails.has(normalizeEmail(raw1)), true, "Normalized duplicate must be detected");
  assert.equal(existingEmails.has(normalizeEmail("new@tokyoimport.jp")), false, "Unique email must be accepted");
});

test("CRM Workflow: In-Memory Sliding Window Rate Limiter blocks excessive requests", () => {
  const testIp = `test-ip-${Date.now()}`;
  const limit = 5;
  const windowMs = 1000; // 1 second window

  // First 5 requests must succeed
  for (let i = 1; i <= limit; i++) {
    const result = rateLimiter.check(testIp, limit, windowMs);
    assert.equal(result.success, true, `Request #${i} should be permitted`);
    assert.equal(result.remaining, limit - i);
  }

  // 6th request must be blocked
  const blockedResult = rateLimiter.check(testIp, limit, windowMs);
  assert.equal(blockedResult.success, false, "Request exceeding limit must be blocked");
  assert.equal(blockedResult.remaining, 0);
  assert.ok(blockedResult.resetTime > Date.now(), "Reset time must be in the future");
});
