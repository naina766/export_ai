import test from "node:test";
import assert from "node:assert/strict";
import { validateEmailAddress } from "../lib/email/validator";

test("Email Validator: Valid email", () => {
  const res = validateEmailAddress("inquiries@zenithsoundwellness.com");
  assert.equal(res.status, "VALID");
  assert.equal(res.isValid, true);
  assert.equal(res.normalizedEmail, "inquiries@zenithsoundwellness.com");
});

test("Email Validator: Disposable domains blocked", () => {
  const res = validateEmailAddress("test@mailinator.com");
  assert.equal(res.status, "INVALID");
  assert.equal(res.isValid, false);
  assert.equal(res.isDisposable, true);
});

test("Email Validator: Malformed email syntax", () => {
  const res = validateEmailAddress("invalid-email-no-at-sign.com");
  assert.equal(res.status, "INVALID");
  assert.equal(res.isValid, false);
});

test("Email Validator: Role-based account flagged as RISKY", () => {
  const res = validateEmailAddress("abuse@company.org");
  assert.equal(res.status, "RISKY");
  assert.equal(res.isRoleAccount, true);
});
