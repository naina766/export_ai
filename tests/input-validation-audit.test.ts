import test from "node:test";
import assert from "node:assert/strict";
import {
  RegisterSchema,
  CreateBuyerLeadSchema,
  CreateProductSchema,
  CreateQuotationSchema,
  PaginationSchema,
} from "../lib/validations";

test("Input Validation: RegisterSchema rejects abusive/oversized inputs", () => {
  // Name too long (> 100)
  const longName = "A".repeat(101);
  const res1 = RegisterSchema.safeParse({
    name: longName,
    email: "valid@example.com",
    password: "Password123!",
  });
  assert.equal(res1.success, false);

  // Email too long (> 254)
  const longEmail = "a".repeat(250) + "@test.com";
  const res2 = RegisterSchema.safeParse({
    name: "Valid Name",
    email: longEmail,
    password: "Password123!",
  });
  assert.equal(res2.success, false);

  // Password too long (> 128)
  const longPass = "A1" + "a".repeat(130);
  const res3 = RegisterSchema.safeParse({
    name: "Valid Name",
    email: "valid@example.com",
    password: longPass,
  });
  assert.equal(res3.success, false);
});

test("Input Validation: CreateBuyerLeadSchema validates URLs, email format, and lengths", () => {
  // Invalid URL
  const res1 = CreateBuyerLeadSchema.safeParse({
    companyName: "Valid Corp",
    email: "lead@example.com",
    country: "Germany",
    website: "not-a-valid-url",
  });
  assert.equal(res1.success, false, "Must reject malformed URL");

  // Oversized company name
  const res2 = CreateBuyerLeadSchema.safeParse({
    companyName: "X".repeat(201),
    email: "lead@example.com",
    country: "Germany",
  });
  assert.equal(res2.success, false, "Must reject companyName > 200 chars");

  // Invalid buyerType enum
  const res3 = CreateBuyerLeadSchema.safeParse({
    companyName: "Valid Corp",
    email: "lead@example.com",
    country: "Germany",
    buyerType: "INVALID_BUYER_TYPE",
  });
  assert.equal(res3.success, false, "Must reject invalid enum value");

  // Valid lead succeeds
  const res4 = CreateBuyerLeadSchema.safeParse({
    companyName: "Munich Sound Sanctuary",
    email: "info@soundmunich.de",
    country: "Germany",
    website: "https://soundmunich.de",
    buyerType: "STUDIO",
  });
  assert.equal(res4.success, true);
});

test("Input Validation: PaginationSchema coerces and enforces maximum page size", () => {
  // Coerce string numbers
  const res1 = PaginationSchema.safeParse({ page: "2", limit: "50" });
  assert.equal(res1.success, true);
  if (res1.success) {
    assert.equal(res1.data.page, 2);
    assert.equal(res1.data.limit, 50);
  }

  // Reject limit exceeding 100
  const res2 = PaginationSchema.safeParse({ page: 1, limit: 1000 });
  assert.equal(res2.success, false, "Limit > 100 must be rejected");

  // Reject negative page numbers
  const res3 = PaginationSchema.safeParse({ page: -1, limit: 20 });
  assert.equal(res3.success, false, "Negative page must be rejected");
});

test("Input Validation: CreateProductSchema validates pricing bounds and text limits", () => {
  // Negative priceMin
  const res1 = CreateProductSchema.safeParse({
    name: "Valid Bowl",
    sku: "BOWL-001",
    priceMin: -15.0,
  });
  assert.equal(res1.success, false, "Negative price must be rejected");

  // Oversized SKU
  const res2 = CreateProductSchema.safeParse({
    name: "Valid Bowl",
    sku: "SKU-".repeat(20),
    priceMin: 50.0,
  });
  assert.equal(res2.success, false, "SKU > 50 must be rejected");

  // Valid product
  const res3 = CreateProductSchema.safeParse({
    name: "7-Metal Hand Hammered Tibetan Singing Bowl (8-inch)",
    sku: "THH-08-432HZ",
    priceMin: 65.0,
    priceMax: 85.0,
    moq: 10,
  });
  assert.equal(res3.success, true);
});

test("Input Validation: CreateQuotationSchema enforces line item constraints", () => {
  // Empty line items array
  const res1 = CreateQuotationSchema.safeParse({
    leadId: "lead_123",
    validUntil: "2026-12-31",
    items: [],
  });
  assert.equal(res1.success, false, "Empty items array must be rejected");

  // Valid quotation
  const res2 = CreateQuotationSchema.safeParse({
    leadId: "lead_123",
    validUntil: "2026-12-31",
    tradeTerm: "FOB",
    items: [
      {
        productName: "Tibetan Master Singing Bowl 10-inch",
        quantity: 50,
        unitPrice: 75.0,
      },
    ],
  });
  assert.equal(res2.success, true);
});
