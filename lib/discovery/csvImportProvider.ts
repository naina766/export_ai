import { DiscoveryProvider, DiscoveryQuery, RawDiscoveryProspect } from "./provider";
import { BuyerType, BuyerIntent } from "@prisma/client";

export class CsvImportDiscoveryProvider implements DiscoveryProvider {
  public name = "CsvImportProvider";

  async search(_query: DiscoveryQuery): Promise<RawDiscoveryProspect[]> {
    return [];
  }

  /**
   * Parses raw CSV text or array of record objects into RawDiscoveryProspect[].
   */
  public parseCsvRows(csvText: string): RawDiscoveryProspect[] {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const prospects: RawDiscoveryProspect[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((cell) => cell.trim().replace(/^["']|["']$/g, ""));
      if (row.length < 2) continue;

      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || "";
      });

      const email = record.email || record["e-mail"] || record.contact_email || "";
      const companyName = record.companyname || record.company || record.business_name || record.name || "";
      const country = record.country || record.nation || "USA";
      const contactPerson = record.contactperson || record.contact_name || record.person || record.contact || undefined;
      const website = record.website || record.url || record.domain || undefined;
      const phone = record.phone || record.telephone || record.mobile || undefined;

      if (!email || !companyName) continue;

      prospects.push({
        companyName,
        contactPerson,
        email,
        phone,
        website,
        country,
        city: record.city || undefined,
        sourcePlatform: "CSV",
        sourceExternalId: `csv_import_row_${i}_${Date.now()}`,
        buyerType: (record.buyertype as BuyerType) || BuyerType.BUSINESS,
        buyerIntent: BuyerIntent.HIGH,
        industry: record.industry || "Imported B2B Directory",
        productInterest: record.productinterest || "Himalayan Singing Bowls",
        notes: "Imported via CSV/Excel batch upload.",
      });
    }

    return prospects;
  }
}
