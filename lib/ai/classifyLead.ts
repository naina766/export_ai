import { z } from "zod";
import { getGeminiModel, isGeminiConfigured } from "./gemini";
import { BuyerType, BuyerIntent } from "@prisma/client";

export const LeadClassificationSchema = z.object({
  buyerType: z.enum([
    "BUSINESS",
    "DISTRIBUTOR",
    "STUDIO",
    "RETAILER",
    "INDIVIDUAL",
    "UNKNOWN",
  ]),
  buyerIntent: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
  industry: z.string().default("Holistic Wellness & Sound Instruments"),
  productInterest: z.string().default("Handmade Tibetan Singing Bowls"),
  leadScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type LeadClassificationResult = z.infer<typeof LeadClassificationSchema>;

export interface LeadInputData {
  companyName: string;
  contactPerson?: string | null;
  email: string;
  website?: string | null;
  country: string;
  city?: string | null;
  source?: string | null;
  productInterest?: string | null;
  notes?: string | null;
}

/**
 * Deterministic rule-based scoring baseline for international export buyers.
 */
export function calculateRuleBasedScore(lead: LeadInputData): LeadClassificationResult {
  let score = 30; // base score
  const confidence = 0.75;
  const reasons: string[] = [];

  const text = `${lead.companyName} ${lead.website || ""} ${lead.productInterest || ""} ${lead.notes || ""}`.toLowerCase();

  // Target Country Multiplier (High-demand singing bowl import markets)
  const tier1Countries = ["usa", "united states", "uk", "united kingdom", "germany", "canada", "australia", "japan", "switzerland", "france"];
  if (tier1Countries.some((c) => lead.country.toLowerCase().includes(c))) {
    score += 20;
    reasons.push(`Target high-tier import market: ${lead.country}`);
  }

  // Keywords for Buyer Type & Industry
  let buyerType: BuyerType = BuyerType.BUSINESS;
  let buyerIntent: BuyerIntent = BuyerIntent.MEDIUM;

  if (text.includes("distributor") || text.includes("wholesale") || text.includes("import") || text.includes("supply")) {
    score += 25;
    buyerType = BuyerType.DISTRIBUTOR;
    buyerIntent = BuyerIntent.HIGH;
    reasons.push("Identified as wholesale importer/distributor");
  } else if (text.includes("studio") || text.includes("yoga") || text.includes("academy") || text.includes("sound bath") || text.includes("healing")) {
    score += 20;
    buyerType = BuyerType.STUDIO;
    buyerIntent = BuyerIntent.HIGH;
    reasons.push("Identified as Sound Therapy / Yoga Studio chain");
  } else if (text.includes("shop") || text.includes("store") || text.includes("boutique") || text.includes("retail")) {
    score += 15;
    buyerType = BuyerType.RETAILER;
    reasons.push("Identified as spiritual/wellness retailer");
  }

  // Active website bonus
  if (lead.website && (lead.website.startsWith("http") || lead.website.includes("."))) {
    score += 15;
    reasons.push("Verified commercial website presence");
  }

  // Contact Person bonus
  if (lead.contactPerson && lead.contactPerson.trim().length > 2) {
    score += 10;
    reasons.push("Direct contact person identified");
  }

  score = Math.min(Math.max(score, 10), 100);

  return {
    buyerType,
    buyerIntent,
    industry: buyerType === BuyerType.STUDIO ? "Sound Healing & Yoga Academy" : "Wholesale Wellness Distribution",
    productInterest: lead.productInterest || "Tibetan Hand-Hammered Singing Bowls & Chakra Sets",
    leadScore: score,
    confidence,
    reasoning: reasons.join("; ") || "General international B2B buyer fit.",
  };
}

/**
 * Qualifies and scores a buyer lead using Gemini AI with strict Zod validation and fallback.
 */
export async function qualifyBuyerLead(lead: LeadInputData): Promise<LeadClassificationResult> {
  if (!isGeminiConfigured()) {
    console.log("[AI] Gemini API not configured. Utilizing deterministic rule-based qualification.");
    return calculateRuleBasedScore(lead);
  }

  try {
    const model = getGeminiModel();
    if (!model) return calculateRuleBasedScore(lead);

    const prompt = `You are an expert international export sales intelligence engine evaluating wholesale buyer prospects for a Himalayan Singing Bowl manufacturer/exporter.
Target Products: Authentic Hand-Hammered 7-Metal Tibetan Singing Bowls, 432Hz Chakra Sets, Full Moon Bowls, and Bronze Temple Gongs.

Analyze this prospect data carefully and return a JSON response matching the exact schema:
Prospect Details:
- Company Name: ${lead.companyName}
- Contact Person: ${lead.contactPerson || "N/A"}
- Email: ${lead.email}
- Website: ${lead.website || "N/A"}
- Country: ${lead.country}
- City: ${lead.city || "N/A"}
- Product Interest: ${lead.productInterest || "N/A"}
- Notes/Context: ${lead.notes || "N/A"}

Scoring Guidelines:
- 85-100: High-volume wholesale distributors, sound healing academies, multi-location yoga chains in USA/Europe/UK with clear import intent.
- 65-84: Independent sound therapists, boutique spiritual stores, online wellness retailers.
- 40-64: General businesses or unverified niche relevance.
- 0-39: Irrelevant companies, consumers, or low purchase intent.

Return ONLY a valid JSON object (no markdown, no backticks, no preamble):
{
  "buyerType": "BUSINESS" | "DISTRIBUTOR" | "STUDIO" | "RETAILER" | "INDIVIDUAL" | "UNKNOWN",
  "buyerIntent": "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
  "industry": "short industry description",
  "productInterest": "most relevant singing bowl category",
  "leadScore": integer between 0 and 100,
  "confidence": float between 0.0 and 1.0,
  "reasoning": "1-2 sentences concise explanation based ONLY on provided facts"
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    // Clean JSON response
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsedJson = JSON.parse(cleanedText);
    const validated = LeadClassificationSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn("[AI] Gemini output failed Zod schema validation. Falling back to rule-based scoring:", validated.error.message);
      return calculateRuleBasedScore(lead);
    }
  } catch (error) {
    console.error("[AI] Gemini qualification failed, falling back to rule scoring:", (error as Error).message);
    return calculateRuleBasedScore(lead);
  }
}
