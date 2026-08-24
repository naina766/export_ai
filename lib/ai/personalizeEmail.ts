import { z } from "zod";
import { getGeminiModel, isGeminiConfigured } from "./gemini";

export const PersonalizedEmailOutputSchema = z.object({
  subject: z.string().min(5),
  bodyHtml: z.string().min(20),
  bodyText: z.string().min(20),
  aiPersonalizedIntro: z.string(),
});

export type PersonalizedEmailOutput = z.infer<typeof PersonalizedEmailOutputSchema>;

export interface PersonalizeEmailParams {
  lead: {
    companyName: string;
    contactPerson?: string | null;
    country: string;
    city?: string | null;
    industry?: string | null;
    productInterest?: string | null;
    website?: string | null;
  };
  product?: {
    name: string;
    material?: string;
    frequency?: string | null;
    moq?: number;
    priceMin?: number | string;
  } | null;
  template?: {
    subject: string;
    body: string;
  } | null;
}

/**
 * Generates personalized email copy using Gemini or deterministic template substitution.
 */
export async function generatePersonalizedEmail(
  params: PersonalizeEmailParams
): Promise<PersonalizedEmailOutput> {
  const { lead, product, template } = params;
  const firstName = lead.contactPerson ? lead.contactPerson.split(" ")[0] : "Friend";
  const productName = product?.name || "Tibetan Hand-Hammered Singing Bowls";

  // Fallback / deterministic substitution
  const fallbackIntro = `Given ${lead.companyName}'s focus on ${lead.industry || "wellness and sound therapy"} in ${lead.country}, we wanted to reach out regarding our artisanal export collection of ${productName}.`;

  const defaultTemplateSubject = template?.subject || `Direct Wholesale Export: Handcrafted Singing Bowls for ${lead.companyName}`;
  const defaultTemplateBody = template?.body || `Hello {{firstName}},\n\n{{aiPersonalizedIntro}}\n\nWe are direct Himalayan artisan manufacturers specializing in 7-metal acoustic singing bowls and tuned 432Hz Chakra sets.\n\nWe offer door-to-door CIF/FOB shipments to ${lead.country} with sample trial packages.\n\nWould you like our latest wholesale catalog and price list?\n\nBest regards,\nExport Sales Team`;

  const substituteVars = (text: string, intro: string): string => {
    return text
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{companyName\}\}/g, lead.companyName)
      .replace(/\{\{country\}\}/g, lead.country)
      .replace(/\{\{productName\}\}/g, productName)
      .replace(/\{\{website\}\}/g, lead.website || "")
      .replace(/\{\{aiPersonalizedIntro\}\}/g, intro);
  };

  if (!isGeminiConfigured()) {
    const rawSubject = substituteVars(defaultTemplateSubject, fallbackIntro);
    const rawBody = substituteVars(defaultTemplateBody, fallbackIntro);

    return {
      subject: rawSubject,
      bodyText: rawBody,
      bodyHtml: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">${rawBody.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>")}</div>`,
      aiPersonalizedIntro: fallbackIntro,
    };
  }

  try {
    const model = getGeminiModel();
    if (!model) throw new Error("Gemini model not initialized.");

    const prompt = `You are a professional B2B export sales director crafting a personalized introduction paragraph for an outreach email to an international buyer of Himalayan Singing Bowls.

Verified Lead Information (DO NOT INVENT ANY OTHER FACTS):
- Company: ${lead.companyName}
- Contact Person: ${lead.contactPerson || "N/A"}
- Country: ${lead.country}
- Industry: ${lead.industry || "Wellness & Sound Therapy"}
- Product Interest: ${lead.productInterest || productName}
- Website: ${lead.website || "N/A"}

Write a polite, 2-3 sentence personalized introduction demonstrating knowledge of their market (${lead.country}) and relevance to handcrafted Singing Bowls/Sound Therapy instruments.

Return ONLY a valid JSON object matching:
{
  "aiPersonalizedIntro": "2-3 sentences personalized hook based ONLY on provided facts"
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    const cleanedText = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanedText);

    const intro = parsed.aiPersonalizedIntro || fallbackIntro;
    const finalSubject = substituteVars(defaultTemplateSubject, intro);
    const finalBodyText = substituteVars(defaultTemplateBody, intro);
    const finalBodyHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b;">${finalBodyText.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>")}</div>`;

    return {
      subject: finalSubject,
      bodyText: finalBodyText,
      bodyHtml: finalBodyHtml,
      aiPersonalizedIntro: intro,
    };
  } catch (err) {
    console.warn("[AI] Email personalization error, using fallback template:", (err as Error).message);
    const rawSubject = substituteVars(defaultTemplateSubject, fallbackIntro);
    const rawBody = substituteVars(defaultTemplateBody, fallbackIntro);

    return {
      subject: rawSubject,
      bodyText: rawBody,
      bodyHtml: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">${rawBody.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>")}</div>`,
      aiPersonalizedIntro: fallbackIntro,
    };
  }
}
