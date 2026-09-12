import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address").max(254, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z.string().max(30, "Phone number too long").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").max(254, "Email too long"),
  password: z.string().min(1, "Password is required").max(128, "Password too long"),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Buyer Lead ──────────────────────────────────────────────────────────────

export const CreateBuyerLeadSchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(200, "Company name too long"),
  contactPerson: z.string().max(150, "Contact name too long").optional(),
  email: z.string().email("Valid email address is required").max(254, "Email too long"),
  phone: z.string().max(30, "Phone number too long").optional(),
  website: z.string().url("Must be a valid URL").max(500, "URL too long").optional().or(z.literal("")),
  country: z.string().min(2, "Country is required").max(100, "Country name too long"),
  city: z.string().max(100, "City name too long").optional(),
  source: z.string().max(100, "Source too long").optional().default("MANUAL"),
  buyerType: z
    .enum(["BUSINESS", "DISTRIBUTOR", "STUDIO", "RETAILER", "INDIVIDUAL", "UNKNOWN"])
    .optional()
    .default("BUSINESS"),
  buyerIntent: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional().default("MEDIUM"),
  industry: z.string().max(150, "Industry too long").optional(),
  productInterest: z.string().max(500, "Product interest too long").optional().default("Handmade Tibetan Singing Bowls"),
  notes: z.string().max(5000, "Notes too long").optional(),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").optional(),
  assignedToId: z.string().optional(),
});

export const UpdateBuyerLeadSchema = CreateBuyerLeadSchema.partial().extend({
  emailStatus: z.enum(["PENDING", "VALID", "INVALID", "RISKY", "UNKNOWN"]).optional(),
  outreachStatus: z
    .enum(["NOT_CONTACTED", "QUEUED", "SENT", "FAILED", "REPLIED", "UNSUBSCRIBED"])
    .optional(),
  leadScore: z.number().min(0).max(100).optional(),
  unsubscribeStatus: z.boolean().optional(),
});

// ─── Product (Singing Bowls Catalog) ─────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: z.string().min(2, "Product name is required").max(200, "Product name too long"),
  sku: z.string().min(2, "SKU is required").max(50, "SKU too long"),
  category: z
    .enum([
      "TIBETAN_HAND_HAMMERED",
      "CHAKRA_SET_7",
      "FULL_MOON_BOWL",
      "CRYSTAL_QUARTZ",
      "TEMPLE_GONG",
      "ACCESSORIES",
    ])
    .default("TIBETAN_HAND_HAMMERED"),
  description: z.string().max(5000, "Description too long").optional(),
  shortDescription: z.string().max(500, "Short description too long").optional(),
  material: z.string().max(100, "Material too long").default("7-Metal Bronze Alloy"),
  frequency: z.string().max(100, "Frequency too long").optional(),
  diameter: z.string().max(50, "Diameter too long").optional(),
  weight: z.string().max(50, "Weight too long").optional(),
  priceMin: z.number().positive("Minimum price must be positive").max(10_000_000, "Price too large"),
  priceMax: z.number().positive().max(10_000_000, "Price too large").optional(),
  currency: z.string().max(10).default("USD"),
  moq: z.number().int().positive().max(1_000_000).default(10),
  stockQuantity: z.number().int().nonnegative().max(10_000_000).default(100),
  availableForExport: z.boolean().default(true),
  exportMarkets: z.array(z.string().max(50)).max(50).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  featured: z.boolean().default(false),
  thumbnailUrl: z.string().max(500).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ─── Campaign ────────────────────────────────────────────────────────────────

export const CreateCampaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required").max(200, "Campaign name too long"),
  description: z.string().max(2000, "Description too long").optional(),
  subject: z.string().min(5, "Subject line is required").max(500, "Subject line too long"),
  templateId: z.string().optional(),
  productId: z.string().optional(),
  dailyLimit: z.number().int().positive().max(10000).default(200),
  emailsPerMinute: z.number().int().positive().max(60).default(10),
  delayBetweenEmails: z.number().int().nonnegative().max(300000).default(3000),
  scheduledAt: z.string().optional(),
  leadIds: z.array(z.string()).min(1, "Select at least one recipient lead").max(10000, "Too many recipients"),
  attachmentIds: z.array(z.string()).max(10, "Too many attachments").optional(),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  status: z
    .enum(["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
});

export const ApprovePersonalizedEmailSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyText: z.string().min(1).optional(),
  isApproved: z.boolean().optional(),
});

// ─── Email Template ──────────────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required").max(200, "Template name too long"),
  subject: z.string().min(5, "Subject line is required").max(500, "Subject too long"),
  body: z.string().min(10, "Body content is required").max(50000, "Body too long"),
  variables: z.array(z.string().max(100)).max(50, "Too many variables").optional(),
  category: z.string().max(100, "Category too long").optional().default("Wholesale Outreach"),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// ─── Sales Opportunity ───────────────────────────────────────────────────────

export const OpportunityStageEnum = z.enum([
  "PROSPECTING",
  "QUALIFIED",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATION",
  "QUOTATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export type OpportunityStageType = z.infer<typeof OpportunityStageEnum>;

export const ALLOWED_STAGE_TRANSITIONS: Record<OpportunityStageType, OpportunityStageType[]> = {
  PROSPECTING: ["QUALIFIED"],
  QUALIFIED: ["CONTACTED", "PROSPECTING"],
  CONTACTED: ["INTERESTED", "QUALIFIED"],
  INTERESTED: ["NEGOTIATION", "CONTACTED"],
  NEGOTIATION: ["QUOTATION", "INTERESTED"],
  QUOTATION: ["CLOSED_WON", "CLOSED_LOST", "NEGOTIATION"],
  CLOSED_WON: [],
  CLOSED_LOST: [],
};

export function isValidOpportunityStageTransition(
  currentStage: OpportunityStageType,
  targetStage: OpportunityStageType
): boolean {
  if (currentStage === targetStage) return true;
  const allowed = ALLOWED_STAGE_TRANSITIONS[currentStage];
  return Boolean(allowed && allowed.includes(targetStage));
}

export const CreateOpportunitySchema = z.object({
  title: z.string().min(2, "Title is required").max(300, "Title too long"),
  leadId: z.string().min(1, "Buyer lead ID is required"),
  productId: z.string().optional(),
  inquiryValue: z.number().positive().max(100_000_000, "Value too large").optional(),
  currency: z.string().max(10, "Currency code too long").default("USD"),
  quantity: z.number().int().positive().max(1_000_000).optional(),
  terms: z.enum(["FOB", "CIF", "EXW", "CFR", "DDP"]).default("FOB"),
  expectedCloseDate: z.string().optional(),
  notes: z.string().max(5000, "Notes too long").optional(),
  stage: OpportunityStageEnum.default("PROSPECTING"),
});

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

export const UpdateOpportunityStageSchema = z.object({
  id: z.string().min(1, "Opportunity ID is required"),
  stage: OpportunityStageEnum,
});

// ─── Quotation ───────────────────────────────────────────────────────────────

export const QuotationItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  quantity: z.number().int().positive("Quantity must be >= 1").max(1_000_000, "Quantity too large"),
  unitPrice: z.number().positive("Unit price must be positive").max(10_000_000, "Price too large"),
});

export const CreateQuotationSchema = z.object({
  leadId: z.string().min(1, "Buyer lead is required"),
  opportunityId: z.string().optional(),
  currency: z.string().max(10, "Currency code too long").default("USD"),
  shippingCost: z.number().nonnegative().max(10_000_000).default(0),
  tradeTerm: z.enum(["FOB", "CIF", "EXW", "CFR", "DDP"]).default("FOB"),
  validUntil: z.string().min(1, "Validity date is required"),
  notes: z.string().max(5000, "Notes too long").optional(),
  items: z.array(QuotationItemSchema).min(1, "At least one quotation line item is required").max(100, "Too many line items"),
});

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
});

// ─── Buyer Discovery ─────────────────────────────────────────────────────────

export const StartDiscoverySchema = z.object({
  productKeyword: z.string().min(1, "Keyword is required").max(200, "Keyword too long").default("Singing Bowls"),
  targetCountries: z.array(z.string().max(100)).min(1, "Select at least one target country").max(50, "Too many target countries"),
  buyerType: z.string().max(50).default("BUSINESS"),
  sources: z.array(z.string().max(100)).max(20).optional(),
  maxResults: z.number().int().min(5).max(200).default(50),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Analytics ────────────────────────────────────────────────────────────────

export const AnalyticsRangeSchema = z.enum(["7D", "30D", "90D", "12M"]);
export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>;

