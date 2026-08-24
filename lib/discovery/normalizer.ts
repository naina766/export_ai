import { RawDiscoveryProspect } from "./provider";
import { BuyerType, BuyerIntent, EmailStatus } from "@prisma/client";
import { validateEmailAddress } from "@/lib/email/validator";

export interface NormalizedBuyerLead {
  companyName: string;
  contactPerson: string | null;
  email: string;
  normalizedEmail: string;
  phone: string | null;
  website: string | null;
  country: string;
  city: string | null;
  source: string;
  sourcePlatform: string;
  sourceExternalId: string;
  buyerType: BuyerType;
  buyerIntent: BuyerIntent;
  industry: string;
  productInterest: string;
  emailStatus: EmailStatus;
  verificationStatus: string;
  notes: string | null;
}

export function normalizeProspect(
  prospect: RawDiscoveryProspect,
  index = 1
): NormalizedBuyerLead | null {
  if (!prospect.companyName || !prospect.email) return null;

  const emailValidation = validateEmailAddress(prospect.email);
  const companyClean = prospect.companyName.trim();
  const countryClean = prospect.country.trim() || "USA";

  // Deterministic source external ID if missing
  const platform = (prospect.sourcePlatform || "WEB").toUpperCase();
  const externalId =
    prospect.sourceExternalId ||
    `${platform.toLowerCase()}_${countryClean.toLowerCase()}_${companyClean.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${index}`;

  return {
    companyName: companyClean,
    contactPerson: prospect.contactPerson?.trim() || null,
    email: emailValidation.email,
    normalizedEmail: emailValidation.normalizedEmail,
    phone: prospect.phone?.trim() || null,
    website: prospect.website?.trim() || null,
    country: countryClean,
    city: prospect.city?.trim() || null,
    source: `${platform} Discovery`,
    sourcePlatform: platform,
    sourceExternalId: externalId,
    buyerType: prospect.buyerType || BuyerType.BUSINESS,
    buyerIntent: prospect.buyerIntent || BuyerIntent.HIGH,
    industry: prospect.industry || "Holistic Wellness & Sound Healing",
    productInterest: prospect.productInterest || "Handmade Tibetan Singing Bowls",
    emailStatus: emailValidation.status,
    verificationStatus: emailValidation.reason,
    notes: prospect.notes || null,
  };
}
