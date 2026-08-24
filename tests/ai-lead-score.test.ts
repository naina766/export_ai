import test from "node:test";
import assert from "node:assert/strict";
import { calculateRuleBasedScore, LeadClassificationSchema } from "../lib/ai/classifyLead";

test("Lead Scoring: High-intent wholesale distributor in USA", () => {
  const lead = {
    companyName: "Zenith Sound & Wellness Imports LLC",
    contactPerson: "Jonathan Miller",
    email: "jmiller@zenithsoundwellness.com",
    country: "USA",
    website: "https://zenithsoundwellness.com",
    productInterest: "7-Chakra Sets & Tibetan Master Bowls",
    notes: "Wholesale importer supplying 140+ yoga studios",
  };

  const result = calculateRuleBasedScore(lead);
  assert.ok(result.leadScore >= 80, `Expected score >= 80, received ${result.leadScore}`);
  assert.equal(result.buyerType, "DISTRIBUTOR");
  assert.equal(result.buyerIntent, "HIGH");

  // Validate output against Zod schema
  const validation = LeadClassificationSchema.safeParse(result);
  assert.equal(validation.success, true, "Output must strictly conform to Zod schema");
});

test("Lead Scoring: Low-intent unverified inquiry", () => {
  const lead = {
    companyName: "Unknown Party",
    email: "user@randomdomain.xyz",
    country: "Nowhere",
  };

  const result = calculateRuleBasedScore(lead);
  assert.ok(result.leadScore < 60, `Expected score < 60, received ${result.leadScore}`);
});
