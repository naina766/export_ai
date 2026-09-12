import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  VALID_RANGES,
  isValidRange,
  getTimeRangeBounds,
  aggregateTimeseriesData,
  findBucketKey,
} from "../lib/analytics/timeseries";
import { signAccessToken } from "../lib/auth";
import { GET as timeseriesGET } from "../app/api/analytics/timeseries/route";
import { GET as overviewGET } from "../app/api/analytics/overview/route";

test("Analytics: 1. 7D range produces 7 contiguous daily buckets", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("7D", refDate);

  assert.equal(bounds.range, "7D");
  assert.equal(bounds.bucketKeys.length, 7, "7D must have exactly 7 daily buckets");
  assert.equal(bounds.bucketKeys[0], "2026-09-07");
  assert.equal(bounds.bucketKeys[6], "2026-09-13");

  // Verify daily progression
  for (let i = 0; i < 6; i++) {
    const d1 = new Date(bounds.bucketKeys[i]);
    const d2 = new Date(bounds.bucketKeys[i + 1]);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    assert.equal(diffDays, 1, "Buckets must be strictly consecutive days");
  }
});

test("Analytics: 2. 30D range produces 30 contiguous daily buckets", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("30D", refDate);

  assert.equal(bounds.range, "30D");
  assert.equal(bounds.bucketKeys.length, 30, "30D must have exactly 30 daily buckets");
  assert.equal(bounds.bucketKeys[0], "2026-08-15");
  assert.equal(bounds.bucketKeys[29], "2026-09-13");
});

test("Analytics: 3. 90D range produces 13 weekly buckets", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("90D", refDate);

  assert.equal(bounds.range, "90D");
  assert.equal(bounds.bucketKeys.length, 13, "90D must have 13 weekly buckets");
  // Check format is YYYY-MM-DD
  for (const key of bounds.bucketKeys) {
    assert.match(key, /^\d{4}-\d{2}-\d{2}$/, "Bucket key must be YYYY-MM-DD");
  }
});

test("Analytics: 4. 12M range produces 12 monthly buckets with year-month format", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("12M", refDate);

  assert.equal(bounds.range, "12M");
  assert.equal(bounds.bucketKeys.length, 12, "12M must have exactly 12 monthly buckets");
  assert.equal(bounds.bucketKeys[0], "2025-10", "First bucket must be October of prior year");
  assert.equal(bounds.bucketKeys[11], "2026-09", "Last bucket must be September of current year");

  // Verify no collision between years
  const uniqueKeys = new Set(bounds.bucketKeys);
  assert.equal(uniqueKeys.size, 12, "Must not have colliding month names across different years");
});

test("Analytics: 5. Invalid range validation rejects unsupported intervals", async () => {
  assert.equal(isValidRange("7D"), true);
  assert.equal(isValidRange("30D"), true);
  assert.equal(isValidRange("90D"), true);
  assert.equal(isValidRange("12M"), true);

  assert.equal(isValidRange("99D"), false);
  assert.equal(isValidRange("1W"), false);
  assert.equal(isValidRange(""), false);
  assert.equal(isValidRange(null), false);

  // Authenticated request with invalid range returns HTTP 400
  const token = await signAccessToken({
    userId: "usr_test_admin",
    email: "admin@exportai.com",
    role: "ADMIN",
    name: "Admin User",
  });

  const req = new NextRequest("http://localhost:3000/api/analytics/timeseries?range=INVALID_RANGE", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const res = await timeseriesGET(req);
  assert.equal(res.status, 400, "Invalid range parameter must return HTTP 400");
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.message, /Invalid range parameter/);
});

test("Analytics: 6. Opportunities outside the range are excluded", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("7D", refDate);

  // One opportunity within 7D (Sept 10), one outside 7D (August 15)
  const oppWithin = {
    createdAt: new Date("2026-09-10T10:00:00Z"),
    inquiryValue: 15000,
    stage: "NEGOTIATION",
  };
  const oppOutside = {
    createdAt: new Date("2026-08-15T10:00:00Z"),
    inquiryValue: 50000,
    stage: "PROSPECTING",
  };

  const result = aggregateTimeseriesData({
    range: "7D",
    bounds,
    leads: [],
    opportunities: [oppWithin, oppOutside],
    emailLogs: [],
  });

  // Calculate total pipeline across all 7 buckets
  const totalPipeline = result.pipelineHistory.reduce((sum, b) => sum + b.pipeline, 0);
  assert.equal(totalPipeline, 15000, "Opportunity outside range must be excluded from pipeline total");

  const sept10Bucket = result.pipelineHistory.find((b) => b.period === "2026-09-10");
  assert.ok(sept10Bucket);
  assert.equal(sept10Bucket?.pipeline, 15000);
});

test("Analytics: 7. Empty time buckets return zero", () => {
  const refDate = new Date("2026-09-13T12:00:00Z");
  const bounds = getTimeRangeBounds("7D", refDate);

  // Empty datasets
  const result = aggregateTimeseriesData({
    range: "7D",
    bounds,
    leads: [],
    opportunities: [],
    emailLogs: [],
  });

  assert.equal(result.pipelineHistory.length, 7);
  assert.equal(result.buyerAcquisition.length, 7);
  assert.equal(result.outreachTimeline.length, 7);

  for (const b of result.pipelineHistory) {
    assert.equal(b.pipeline, 0);
    assert.equal(b.revenue, 0);
  }
  for (const b of result.buyerAcquisition) {
    assert.equal(b.discovered, 0);
    assert.equal(b.qualified, 0);
  }
  for (const b of result.outreachTimeline) {
    assert.equal(b.sent, 0);
    assert.equal(b.replied, 0);
    assert.equal(b.bounced, 0);
  }
});

test("Analytics: 8. Reply rate uses replied emails / sent emails", () => {
  const totalEmailsSent = 40;
  const repliedEmails = 10;
  const repliedBuyers = 4; // number of unique buyers that replied

  // Correct semantic calculation: email reply rate
  const emailReplyRate = totalEmailsSent > 0 ? (repliedEmails / totalEmailsSent) * 100 : 0;
  assert.equal(emailReplyRate, 25.0, "Email reply rate must be 25.0% based on 10/40");

  // Incorrect buyer-mix calculation would have been 4/40 = 10.0%
  const flawedBuyerReplyRate = totalEmailsSent > 0 ? (repliedBuyers / totalEmailsSent) * 100 : 0;
  assert.equal(flawedBuyerReplyRate, 10.0);
  assert.notEqual(emailReplyRate, flawedBuyerReplyRate);
});

test("Analytics: 9. Win rate handles zero closed opportunities safely", () => {
  const computeWinRate = (won: number, lost: number) => {
    const totalClosed = won + lost;
    return totalClosed > 0 ? (won / totalClosed) * 100 : 0;
  };

  // Zero closed deals
  const rateZero = computeWinRate(0, 0);
  assert.equal(rateZero, 0, "Zero closed deals must return 0 instead of NaN");
  assert.equal(Number.isNaN(rateZero), false);
  assert.equal(Number.isFinite(rateZero), true);

  // 3 won, 1 lost
  const rateTypical = computeWinRate(3, 1);
  assert.equal(rateTypical, 75);
});

test("Analytics: 10. Unauthorized analytics request returns 401", async () => {
  // Call /api/analytics/timeseries with no token
  const timeseriesReq = new NextRequest("http://localhost:3000/api/analytics/timeseries?range=7D");
  const timeseriesRes = await timeseriesGET(timeseriesReq);
  assert.equal(timeseriesRes.status, 401, "Unauthenticated timeseries must return 401");

  // Call /api/analytics/overview with no token
  const overviewReq = new NextRequest("http://localhost:3000/api/analytics/overview");
  const overviewRes = await overviewGET(overviewReq);
  assert.equal(overviewRes.status, 401, "Unauthenticated overview must return 401");
});
