import { DiscoveryProvider, DiscoveryQuery, RawDiscoveryProspect } from "./provider";
import { WebSearchDiscoveryProvider, DirectoryDiscoveryProvider, WebsiteDiscoveryProvider } from "./webSearchProvider";
import { CsvImportDiscoveryProvider } from "./csvImportProvider";
import { normalizeProspect, NormalizedBuyerLead } from "./normalizer";

export class DiscoveryService {
  private providers: Map<string, DiscoveryProvider> = new Map();

  constructor() {
    this.registerProvider(new WebSearchDiscoveryProvider());
    this.registerProvider(new DirectoryDiscoveryProvider());
    this.registerProvider(new WebsiteDiscoveryProvider());
    this.registerProvider(new CsvImportDiscoveryProvider());
  }

  public registerProvider(provider: DiscoveryProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public async executeDiscovery(query: DiscoveryQuery): Promise<NormalizedBuyerLead[]> {
    const rawProspects: RawDiscoveryProspect[] = [];

    const activeProviders = Array.from(this.providers.values()).filter(
      (p) => !(p instanceof CsvImportDiscoveryProvider)
    );

    for (const provider of activeProviders) {
      try {
        const results = await provider.search(query);
        rawProspects.push(...results);
      } catch (err) {
        console.error(`[DiscoveryService] Provider ${provider.name} failed:`, (err as Error).message);
      }
    }

    // Normalize, sanitize and deduplicate locally by email
    const normalizedList: NormalizedBuyerLead[] = [];
    const seenEmails = new Set<string>();

    let index = 1;
    for (const raw of rawProspects) {
      const normalized = normalizeProspect(raw, index++);
      if (normalized && !seenEmails.has(normalized.normalizedEmail)) {
        seenEmails.add(normalized.normalizedEmail);
        normalizedList.push(normalized);
      }
      if (normalizedList.length >= (query.maxResults || 50)) break;
    }

    return normalizedList;
  }
}

export const discoveryService = new DiscoveryService();
