import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Buyer Lead ──────────────────────────────────────────────────────────────

export const CreateBuyerLeadSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  website: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  city: z.string().optional(),
  source: z.string().optional().default("MANUAL"),
  buyerType: z
    .enum(["BUSINESS", "DISTRIBUTOR", "STUDIO", "RETAILER", "INDIVIDUAL", "UNKNOWN"])
    .optional()
    .default("BUSINESS"),
  buyerIntent: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional().default("MEDIUM"),
  industry: z.string().optional(),
  productInterest: z.string().optional().default("Handmade Tibetan Singing Bowls"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(2, "SKU is required"),
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
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  material: z.string().default("7-Metal Bronze Alloy"),
  frequency: z.string().optional(),
  diameter: z.string().optional(),
  weight: z.string().optional(),
  priceMin: z.number().positive("Minimum price must be positive"),
  priceMax: z.number().positive().optional(),
  currency: z.string().default("USD"),
  moq: z.number().int().positive().default(10),
  stockQuantity: z.number().int().nonnegative().default(100),
  availableForExport: z.boolean().default(true),
  exportMarkets: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  featured: z.boolean().default(false),
  thumbnailUrl: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ─── Campaign ────────────────────────────────────────────────────────────────

export const CreateCampaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required"),
  description: z.string().optional(),
  subject: z.string().min(5, "Subject line is required"),
  templateId: z.string().optional(),
  productId: z.string().optional(),
  dailyLimit: z.number().int().positive().default(200),
  emailsPerMinute: z.number().int().positive().default(10),
  delayBetweenEmails: z.number().int().nonnegative().default(3000),
  scheduledAt: z.string().optional(),
  leadIds: z.array(z.string()).min(1, "Select at least one recipient lead"),
  attachmentIds: z.array(z.string()).optional(),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  status: z
    .enum(["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
});

// ─── Email Template ──────────────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required"),
  subject: z.string().min(5, "Subject line is required"),
  body: z.string().min(10, "Body content is required"),
  variables: z.array(z.string()).optional(),
  category: z.string().optional().default("Wholesale Outreach"),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// ─── Sales Opportunity ───────────────────────────────────────────────────────

export const CreateOpportunitySchema = z.object({
  title: z.string().min(2, "Title is required"),
  leadId: z.string().min(1, "Buyer lead ID is required"),
  productId: z.string().optional(),
  inquiryValue: z.number().positive().optional(),
  currency: z.string().default("USD"),
  quantity: z.number().int().positive().optional(),
  terms: z.enum(["FOB", "CIF", "EXW", "CFR", "DDP"]).default("FOB"),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  stage: z
    .enum([
      "PROSPECTING",
      "QUALIFIED",
      "CONTACTED",
      "INTERESTED",
      "NEGOTIATION",
      "QUOTATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ])
    .default("PROSPECTING"),
});

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

// ─── Quotation ───────────────────────────────────────────────────────────────

export const QuotationItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be >= 1"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const CreateQuotationSchema = z.object({
  leadId: z.string().min(1, "Buyer lead is required"),
  opportunityId: z.string().optional(),
  currency: z.string().default("USD"),
  shippingCost: z.number().nonnegative().default(0),
  tradeTerm: z.enum(["FOB", "CIF", "EXW", "CFR", "DDP"]).default("FOB"),
  validUntil: z.string().min(1, "Validity date is required"),
  notes: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1, "At least one quotation line item is required"),
});

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
});

// ─── Buyer Discovery ─────────────────────────────────────────────────────────

export const StartDiscoverySchema = z.object({
  productKeyword: z.string().default("Singing Bowls"),
  targetCountries: z.array(z.string()).min(1, "Select at least one target country"),
  buyerType: z.string().default("BUSINESS"),
  sources: z.array(z.string()).optional(),
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

