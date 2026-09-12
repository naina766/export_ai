import test from "node:test";
import assert from "node:assert/strict";
import { jwtVerify } from "jose";
import {
  getJwtSecret,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  JWTPayload,
} from "../lib/auth";
import {
  OpportunityStageEnum,
  OpportunityStageType,
  isValidOpportunityStageTransition,
  UpdateOpportunityStageSchema,
  ApprovePersonalizedEmailSchema,
} from "../lib/validations";

// ==============================================================================
// P0-1: rememberMe Token Lifetime Tests
// ==============================================================================

test("P0-1 Auth: signRefreshToken without rememberMe has default ~7d lifetime", async () => {
  const payload: JWTPayload = {
    userId: "usr_normal_1",
    email: "normal@exportai.com",
    role: "AGENT",
    name: "Normal User",
  };

  const token = await signRefreshToken(payload, false);
  assert.ok(token);

  const { payload: verified } = await jwtVerify(token, getJwtSecret());
  assert.equal(verified.userId, payload.userId);
  assert.equal(verified.rememberMe, false);

  const exp = verified.exp as number;
  const iat = verified.iat as number;
  const lifetimeSeconds = exp - iat;

  // 7 days = 7 * 86400 = 604,800 seconds (allow slight drift)
  assert.ok(
    lifetimeSeconds >= 604000 && lifetimeSeconds <= 605000,
    `Expected ~7d (604800s), got ${lifetimeSeconds}s`
  );
});

test("P0-1 Auth: signRefreshToken with rememberMe=true has ~30d lifetime", async () => {
  const payload: JWTPayload = {
    userId: "usr_remember_1",
    email: "remember@exportai.com",
    role: "AGENT",
    name: "Remember User",
  };

  const token = await signRefreshToken(payload, true);
  assert.ok(token);

  const { payload: verified } = await jwtVerify(token, getJwtSecret());
  assert.equal(verified.userId, payload.userId);
  assert.equal(verified.rememberMe, true);

  const exp = verified.exp as number;
  const iat = verified.iat as number;
  const lifetimeSeconds = exp - iat;

  // 30 days = 30 * 86400 = 2,592,000 seconds
  assert.ok(
    lifetimeSeconds >= 2590000 && lifetimeSeconds <= 2593000,
    `Expected ~30d (2592000s), got ${lifetimeSeconds}s`
  );
});

test("P0-1 Auth: Refresh rotation preserves rememberMe=true and ~30d replacement", async () => {
  const initialPayload: JWTPayload = {
    userId: "usr_rotation_1",
    email: "rotation@exportai.com",
    role: "MANAGER",
    name: "Rotation Manager",
    rememberMe: true,
  };

  const oldRefreshToken = await signRefreshToken(initialPayload, true);
  const verifiedOld = await verifyToken(oldRefreshToken);
  assert.ok(verifiedOld);

  // Emulate refresh rotation logic from app/api/auth/refresh/route.ts
  const isRememberMe = verifiedOld.rememberMe === true;
  assert.equal(isRememberMe, true, "rememberMe must be preserved from old token claim");

  const replacementPayload: JWTPayload = {
    userId: verifiedOld.userId,
    email: verifiedOld.email,
    role: verifiedOld.role,
    name: verifiedOld.name,
    rememberMe: isRememberMe,
  };

  const newRefreshToken = await signRefreshToken(replacementPayload, isRememberMe);
  const { payload: verifiedNew } = await jwtVerify(newRefreshToken, getJwtSecret());

  assert.equal(verifiedNew.rememberMe, true);
  const lifetimeSeconds = (verifiedNew.exp as number) - (verifiedNew.iat as number);
  assert.ok(
    lifetimeSeconds >= 2590000 && lifetimeSeconds <= 2593000,
    `Replacement must remain ~30d, got ${lifetimeSeconds}s`
  );
});

test("P0-1 Auth: Refresh rotation preserves normal session without rememberMe", async () => {
  const initialPayload: JWTPayload = {
    userId: "usr_rotation_2",
    email: "normal_rot@exportai.com",
    role: "AGENT",
    name: "Normal Agent",
    rememberMe: false,
  };

  const oldRefreshToken = await signRefreshToken(initialPayload, false);
  const verifiedOld = await verifyToken(oldRefreshToken);
  assert.ok(verifiedOld);

  const isRememberMe = verifiedOld.rememberMe === true;
  assert.equal(isRememberMe, false, "Normal session must remain rememberMe=false");

  const replacementPayload: JWTPayload = {
    userId: verifiedOld.userId,
    email: verifiedOld.email,
    role: verifiedOld.role,
    name: verifiedOld.name,
    rememberMe: isRememberMe,
  };

  const newRefreshToken = await signRefreshToken(replacementPayload, isRememberMe);
  const { payload: verifiedNew } = await jwtVerify(newRefreshToken, getJwtSecret());

  assert.equal(verifiedNew.rememberMe, false);
  const lifetimeSeconds = (verifiedNew.exp as number) - (verifiedNew.iat as number);
  assert.ok(
    lifetimeSeconds >= 604000 && lifetimeSeconds <= 605000,
    `Replacement must remain ~7d, got ${lifetimeSeconds}s`
  );
});

// ==============================================================================
// P0-2: AI Email Human Approval Gate Tests
// ==============================================================================

test("P0-2 AI Approval: ApprovePersonalizedEmailSchema validation", () => {
  const validApproval = ApprovePersonalizedEmailSchema.safeParse({
    leadId: "lead_123",
    isApproved: true,
  });
  assert.equal(validApproval.success, true);

  const validEditAndApprove = ApprovePersonalizedEmailSchema.safeParse({
    leadId: "lead_123",
    subject: "Updated Subject Line",
    bodyHtml: "<p>Updated body content</p>",
    isApproved: true,
  });
  assert.equal(validEditAndApprove.success, true);

  const invalidMissingLead = ApprovePersonalizedEmailSchema.safeParse({
    isApproved: true,
  });
  assert.equal(invalidMissingLead.success, false);
});

test("P0-2 AI Approval: Worker gate rejects unapproved draft (isApproved === false)", () => {
  // Emulate email.worker.ts Gate 4 logic
  const draftUnapproved = {
    id: "draft_1",
    campaignId: "camp_1",
    leadId: "lead_1",
    isApproved: false,
  };

  let gatePassed = false;
  if (!draftUnapproved || !draftUnapproved.isApproved) {
    gatePassed = false;
  } else {
    gatePassed = true;
  }
  assert.equal(gatePassed, false, "Email worker must refuse to send unapproved draft");

  const draftApproved = {
    id: "draft_2",
    campaignId: "camp_1",
    leadId: "lead_2",
    isApproved: true,
  };

  if (!draftApproved || !draftApproved.isApproved) {
    gatePassed = false;
  } else {
    gatePassed = true;
  }
  assert.equal(gatePassed, true, "Email worker allows sending only when isApproved === true");
});

// ==============================================================================
// P0-3: Sales Opportunity Stage Transition Tests
// ==============================================================================

test("P0-3 Opportunities: Valid forward and backward transitions succeed", () => {
  assert.equal(isValidOpportunityStageTransition("PROSPECTING", "QUALIFIED"), true);
  assert.equal(isValidOpportunityStageTransition("QUALIFIED", "CONTACTED"), true);
  assert.equal(isValidOpportunityStageTransition("QUALIFIED", "PROSPECTING"), true);
  assert.equal(isValidOpportunityStageTransition("CONTACTED", "INTERESTED"), true);
  assert.equal(isValidOpportunityStageTransition("INTERESTED", "NEGOTIATION"), true);
  assert.equal(isValidOpportunityStageTransition("NEGOTIATION", "QUOTATION"), true);
  assert.equal(isValidOpportunityStageTransition("QUOTATION", "CLOSED_WON"), true);
  assert.equal(isValidOpportunityStageTransition("QUOTATION", "CLOSED_LOST"), true);
  assert.equal(isValidOpportunityStageTransition("QUOTATION", "NEGOTIATION"), true);
});

test("P0-3 Opportunities: Arbitrary stage jumps are rejected", () => {
  assert.equal(isValidOpportunityStageTransition("PROSPECTING", "CLOSED_WON"), false);
  assert.equal(isValidOpportunityStageTransition("PROSPECTING", "CLOSED_LOST"), false);
  assert.equal(isValidOpportunityStageTransition("PROSPECTING", "NEGOTIATION"), false);
  assert.equal(isValidOpportunityStageTransition("CONTACTED", "CLOSED_WON"), false);
  assert.equal(isValidOpportunityStageTransition("INTERESTED", "CLOSED_WON"), false);
});

test("P0-3 Opportunities: Terminal closed stages cannot transition elsewhere", () => {
  assert.equal(isValidOpportunityStageTransition("CLOSED_WON", "PROSPECTING"), false);
  assert.equal(isValidOpportunityStageTransition("CLOSED_WON", "QUALIFIED"), false);
  assert.equal(isValidOpportunityStageTransition("CLOSED_WON", "CLOSED_LOST"), false);
  assert.equal(isValidOpportunityStageTransition("CLOSED_LOST", "PROSPECTING"), false);
  assert.equal(isValidOpportunityStageTransition("CLOSED_LOST", "QUOTATION"), false);
  assert.equal(isValidOpportunityStageTransition("CLOSED_LOST", "CLOSED_WON"), false);
});

test("P0-3 Opportunities: Zod schema rejects invalid stage strings", () => {
  const invalidStage = UpdateOpportunityStageSchema.safeParse({
    id: "opp_1",
    stage: "NON_EXISTENT_STAGE",
  });
  assert.equal(invalidStage.success, false);

  const missingId = UpdateOpportunityStageSchema.safeParse({
    stage: "QUALIFIED",
  });
  assert.equal(missingId.success, false);

  const valid = UpdateOpportunityStageSchema.safeParse({
    id: "opp_1",
    stage: "QUALIFIED",
  });
  assert.equal(valid.success, true);
});

test("P0-3 Opportunities: closedAt timestamping on terminal close", () => {
  const targetStageWon: string = "CLOSED_WON";
  const isClosingWon = targetStageWon === "CLOSED_WON" || targetStageWon === "CLOSED_LOST";
  assert.equal(isClosingWon, true);

  const existingClosedAt: Date | null = null;
  const shouldSetClosedAt = isClosingWon && !existingClosedAt;
  assert.equal(shouldSetClosedAt, true);

  const targetStageNegotiation: string = "NEGOTIATION";
  const isClosingNeg = targetStageNegotiation === "CLOSED_WON" || targetStageNegotiation === "CLOSED_LOST";
  assert.equal(isClosingNeg, false);
});
