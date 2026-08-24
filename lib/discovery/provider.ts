import { BuyerType, BuyerIntent } from "@prisma/client";

export interface DiscoveryQuery {
  productKeyword: string;
  targetCountries: string[];
  buyerType?: string;
  sources?: string[];
  maxResults?: number;
}

export interface RawDiscoveryProspect {
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  website?: string;
  country: string;
  city?: string;
  sourcePlatform: string;
  sourceExternalId?: string;
  buyerType?: BuyerType;
  buyerIntent?: BuyerIntent;
  industry?: string;
  productInterest?: string;
  notes?: string;
}

export interface DiscoveryProvider {
  name: string;
  search(query: DiscoveryQuery): Promise<RawDiscoveryProspect[]>;
}
