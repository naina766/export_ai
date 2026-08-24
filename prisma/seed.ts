import { PrismaClient, Role, BuyerType, BuyerIntent, EmailStatus, OutreachStatus, ConsentStatus, ProductCategory, OpportunityStage, TradeTerm, QuotationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting EXPORT AI database seed...");

  // 1. Create Users
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const agentPasswordHash = await bcrypt.hash("Agent@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@exportai.com" },
    update: {
      password: adminPasswordHash,
      isActive: true,
      isApproved: true,
    },
    create: {
      name: "Naina Admin",
      email: "admin@exportai.com",
      password: adminPasswordHash,
      role: Role.ADMIN,
      phone: "+91 98765 43210",
      isActive: true,
      isApproved: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@exportai.com" },
    update: {
      password: agentPasswordHash,
      isActive: true,
      isApproved: true,
    },
    create: {
      name: "Rajesh Export Specialist",
      email: "agent@exportai.com",
      password: agentPasswordHash,
      role: Role.AGENT,
      phone: "+91 98765 12345",
      isActive: true,
      isApproved: true,
    },
  });

  console.log("👤 Created users:", admin.email, agent.email);

  // 2. Create Products (Singing Bowls Export Catalog)
  const productsData = [
    {
      name: "Tibetan Master Hand-Hammered Singing Bowl (Grade AAA)",
      slug: "tibetan-hand-hammered-singing-bowl-grade-aaa",
      sku: "SB-THH-001",
      category: ProductCategory.TIBETAN_HAND_HAMMERED,
      description: "Authentic 7-metal alloy hand-beaten meditation bowl made by master artisans in the Himalayan valley. Rich overtones with long sustain for sound bath and chakra alignment.",
      shortDescription: "Master hand-hammered 7-metal meditation bowl with deep resonance.",
      material: "7-Metal Bronze Alloy (Copper, Tin, Zinc, Iron, Silver, Gold, Lead)",
      frequency: "432 Hz / F Note (Heart Chakra)",
      diameter: "10-12 inches (25-30 cm)",
      weight: "1.8 - 2.2 kg",
      priceMin: 65.00,
      priceMax: 95.00,
      currency: "USD",
      moq: 10,
      stockQuantity: 250,
      availableForExport: true,
      exportMarkets: ["USA", "UK", "Germany", "Canada", "Australia", "Japan"],
      featured: true,
      thumbnailUrl: "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "7-Chakra Healing Singing Bowl Set (Complete with Accessories)",
      slug: "7-chakra-healing-singing-bowl-set",
      sku: "SB-7CK-SET",
      category: ProductCategory.CHAKRA_SET_7,
      description: "Tuned set of 7 singing bowls representing each chakra (Root to Crown). Includes 7 brocade silk ring cushions, 2 suede-wrapped wooden mallets, and 1 felt gong striker.",
      shortDescription: "Complete 7-bowl harmonic chakra set tuned to C, D, E, F, G, A, B notes.",
      material: "High-grade Bell Metal Bronze",
      frequency: "432 Hz tuned harmonic scale",
      diameter: "5 to 11 inches (12 to 28 cm)",
      weight: "6.5 kg (Complete Set)",
      priceMin: 220.00,
      priceMax: 310.00,
      currency: "USD",
      moq: 5,
      stockQuantity: 120,
      availableForExport: true,
      exportMarkets: ["USA", "UK", "Germany", "Canada", "France", "Netherlands"],
      featured: true,
      thumbnailUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Full Moon Energized Singing Bowl",
      slug: "full-moon-energized-singing-bowl",
      sku: "SB-FM-003",
      category: ProductCategory.FULL_MOON_BOWL,
      description: "Handcrafted exclusively during full moon nights under moonlight chanting. Highly revered by sound therapists and holistic practitioners for high vibration frequency.",
      shortDescription: "Rare ceremonial full-moon crafted singing bowl with exceptional sustain.",
      material: "Pure Virgin 7-Metal Alloy",
      frequency: "528 Hz (Miracle Tone / DNA Repair)",
      diameter: "9-10 inches (22-25 cm)",
      weight: "1.4 - 1.7 kg",
      priceMin: 85.00,
      priceMax: 130.00,
      currency: "USD",
      moq: 10,
      stockQuantity: 80,
      availableForExport: true,
      exportMarkets: ["USA", "UK", "Germany", "Switzerland", "Japan"],
      featured: true,
      thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Frosted Crystal Quartz Singing Bowl (432Hz Chakra Tuned)",
      slug: "frosted-crystal-quartz-singing-bowl-432hz",
      sku: "SB-CQB-004",
      category: ProductCategory.CRYSTAL_QUARTZ,
      description: "99.99% pure optical quartz crystal bowl with heavy frosting. Produces clear, potent acoustic energy fields for meditation rooms and yoga studios.",
      shortDescription: "99.99% pure quartz crystal singing bowl with heavy frosted finish.",
      material: "Optical Grade Pure Quartz Crystal",
      frequency: "432 Hz / D Note (Sacral Chakra)",
      diameter: "8 inches (20 cm)",
      weight: "1.2 kg",
      priceMin: 45.00,
      priceMax: 70.00,
      currency: "USD",
      moq: 15,
      stockQuantity: 300,
      availableForExport: true,
      exportMarkets: ["USA", "Canada", "Australia", "UK", "Germany"],
      featured: false,
      thumbnailUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Hand-Hammered Himalayan Temple Gong with Stand",
      slug: "hand-hammered-himalayan-temple-gong",
      sku: "TG-HIM-005",
      category: ProductCategory.TEMPLE_GONG,
      description: "Traditional heavy bell bronze gong with turned rim and engraved sacred geometry mandala. Deep, thunderous bass wash with immense vibrational depth.",
      shortDescription: "Traditional hand-hammered temple wind gong for sound healing sanctuaries.",
      material: "B20 Bronze Alloy",
      frequency: "Sub-bass multi-tonal wash",
      diameter: "22-24 inches (55-60 cm)",
      weight: "4.8 kg",
      priceMin: 180.00,
      priceMax: 260.00,
      currency: "USD",
      moq: 3,
      stockQuantity: 40,
      availableForExport: true,
      exportMarkets: ["USA", "Germany", "UK", "Japan", "Norway"],
      featured: false,
      thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const item of productsData) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }

  console.log(`📦 Seeded ${productsData.length} export products.`);

  // 3. Create Sample Buyer Leads
  const buyerLeadsData = [
    {
      companyName: "Zenith Sound & Wellness Imports LLC",
      contactPerson: "Jonathan Miller",
      email: "jmiller@zenithsoundwellness.com",
      normalizedEmail: "jmiller@zenithsoundwellness.com",
      phone: "+1 (415) 890-4321",
      website: "https://zenithsoundwellness.com",
      country: "USA",
      city: "San Francisco, CA",
      source: "Google B2B Search",
      sourcePlatform: "GOOGLE",
      sourceExternalId: "goog_b2b_zenith_001",
      buyerType: BuyerType.DISTRIBUTOR,
      buyerIntent: BuyerIntent.HIGH,
      industry: "Sound Healing & Holistic Distribution",
      productInterest: "7-Chakra Sets & Tibetan Master Bowls",
      leadScore: 94,
      aiConfidence: 0.96,
      aiReasoning: "Large wholesale distributor supplying 140+ yoga studios and meditation centers across California and Oregon. Explicitly imports handcrafted Himalayan instruments.",
      aiModel: "gemini-1.5-flash",
      aiProcessedAt: new Date(),
      emailStatus: EmailStatus.VALID,
      verificationStatus: "RFC 5322 Syntax Valid, MX Record Active (Google Workspace)",
      outreachStatus: OutreachStatus.NOT_CONTACTED,
      unsubscribeStatus: false,
      consentStatus: ConsentStatus.UNKNOWN,
      assignedToId: agent.id,
      createdById: admin.id,
    },
    {
      companyName: "Bodhi Tree Holistic Living Ltd",
      contactPerson: "Eleanor Vance",
      email: "eleanor@bodhitreeholistic.co.uk",
      normalizedEmail: "eleanor@bodhitreeholistic.co.uk",
      phone: "+44 20 7946 0912",
      website: "https://bodhitreeholistic.co.uk",
      country: "UK",
      city: "London",
      source: "Holistic Retail Directory",
      sourcePlatform: "DIRECTORY",
      sourceExternalId: "dir_uk_bodhi_002",
      buyerType: BuyerType.RETAILER,
      buyerIntent: BuyerIntent.HIGH,
      industry: "Spiritual Lifestyle & Sound Bath Studio Chain",
      productInterest: "Tibetan Hand-Hammered Bowls & Full Moon Bowls",
      leadScore: 89,
      aiConfidence: 0.92,
      aiReasoning: "Owns 4 premium lifestyle wellness stores in London & Edinburgh with weekly sound bath workshops. Active buyer of certified fair-trade singing bowls.",
      aiModel: "gemini-1.5-flash",
      aiProcessedAt: new Date(),
      emailStatus: EmailStatus.VALID,
      verificationStatus: "RFC 5322 Syntax Valid, MX Record Active",
      outreachStatus: OutreachStatus.SENT,
      lastContactedAt: new Date(Date.now() - 86400000 * 2),
      unsubscribeStatus: false,
      consentStatus: ConsentStatus.SUBSCRIBED,
      assignedToId: agent.id,
      createdById: admin.id,
    },
    {
      companyName: "Klangtherapie Zentrum München GmbH",
      contactPerson: "Dr. Markus Weber",
      email: "einkauf@klangtherapie-muenchen.de",
      normalizedEmail: "einkauf@klangtherapie-muenchen.de",
      phone: "+49 89 2345 6789",
      website: "https://klangtherapie-muenchen.de",
      country: "Germany",
      city: "Munich",
      source: "German Sound Therapy Academy Registry",
      sourcePlatform: "DIRECTORY",
      sourceExternalId: "dir_de_klang_003",
      buyerType: BuyerType.STUDIO,
      buyerIntent: BuyerIntent.HIGH,
      industry: "Professional Sound Therapy Academy & Clinic",
      productInterest: "432Hz Tuned Chakra Sets & Temple Gongs",
      leadScore: 91,
      aiConfidence: 0.94,
      aiReasoning: "German certified sound healing training institute. Regularly purchases 20-30 sets per quarter for graduating sound healers.",
      aiModel: "gemini-1.5-flash",
      aiProcessedAt: new Date(),
      emailStatus: EmailStatus.VALID,
      verificationStatus: "RFC 5322 Syntax Valid, MX Record Active",
      outreachStatus: OutreachStatus.REPLIED,
      lastContactedAt: new Date(Date.now() - 86400000 * 5),
      unsubscribeStatus: false,
      consentStatus: ConsentStatus.SUBSCRIBED,
      assignedToId: agent.id,
      createdById: admin.id,
    },
    {
      companyName: "Prana Meditation Supplies Canada",
      contactPerson: "David Tremblay",
      email: "david@pranameditation.ca",
      normalizedEmail: "david@pranameditation.ca",
      phone: "+1 (514) 789-0123",
      website: "https://pranameditation.ca",
      country: "Canada",
      city: "Montreal, QC",
      source: "CSV Import Batch #1",
      sourcePlatform: "CSV",
      sourceExternalId: "csv_import_row_004",
      buyerType: BuyerType.BUSINESS,
      buyerIntent: BuyerIntent.MEDIUM,
      industry: "E-Commerce Yoga & Meditation Equipment",
      productInterest: "Frosted Crystal Quartz Bowls & Tibetan Bowls",
      leadScore: 82,
      aiConfidence: 0.88,
      aiReasoning: "Canadian e-commerce brand with strong Amazon & Shopify presence selling meditation cushions and accessories. Looking for direct manufacturer pricing.",
      aiModel: "gemini-1.5-flash",
      aiProcessedAt: new Date(),
      emailStatus: EmailStatus.VALID,
      verificationStatus: "RFC 5322 Syntax Valid, MX Record Active",
      outreachStatus: OutreachStatus.QUEUED,
      unsubscribeStatus: false,
      consentStatus: ConsentStatus.UNKNOWN,
      assignedToId: agent.id,
      createdById: admin.id,
    },
  ];

  for (const lead of buyerLeadsData) {
    await prisma.buyerLead.upsert({
      where: { normalizedEmail: lead.normalizedEmail },
      update: {},
      create: lead,
    });
  }

  console.log(`🎯 Seeded ${buyerLeadsData.length} qualified buyer leads.`);

  // 4. Create Reusable Email Templates
  const templatesData = [
    {
      name: "Wholesale Singing Bowls — Manufacturer Direct Introduction",
      subject: "Direct Manufacturer Supply: Certified Handcrafted Singing Bowls for {{companyName}}",
      body: `Hello {{firstName}},

I noticed that {{companyName}} is recognized for delivering premium sound therapy and meditation experiences in {{country}}.

We are direct artisanal manufacturers and exporters of authentic hand-hammered 7-metal Tibetan Singing Bowls, tuned 432Hz Chakra sets, and Himalayan Temple Gongs.

{{aiPersonalizedIntro}}

Why international distributors partner with us:
• Direct Himalayan artisan workshop FOB/CIF pricing (up to 40% margin improvement over trading intermediaries)
• Guaranteed acoustic frequency tuning (432Hz / 528Hz verified)
• Complete export documentation, lab metal purity certificates, and custom laser branding
• Low MOQ with rapid sample courier dispatch

Would you be open to reviewing our wholesale export catalog and FOB price sheet for {{country}}?

Warm regards,

Export Sales Director
Export AI — Himalayan Singing Bowls
{{website}}`,
      variables: ["firstName", "companyName", "country", "productName", "website", "aiPersonalizedIntro"],
      category: "Wholesale Outreach",
      isDefault: true,
      createdById: admin.id,
    },
    {
      name: "7-Chakra Harmonic Set — Sound Therapy Studio Special",
      subject: "Wholesale 7-Chakra Tuned Bowl Sets for {{companyName}} Sound Practitioners",
      body: `Dear {{firstName}},

Following {{companyName}}'s ongoing work in sound meditation and holistic healing in {{country}}, I wanted to share our newly released 432Hz harmonic 7-Chakra singing bowl series.

{{aiPersonalizedIntro}}

Each set is handcrafted from virgin bell metal bronze, acoustically tested for pitch accuracy across C-D-E-F-G-A-B chakra frequencies, and comes complete with brocade silk cushions and dual suede mallets.

We currently offer trial sample shipments with DHL Express door-to-door delivery.

May I send you our technical specification sheet and wholesale quotation?

Best regards,

Export Team
Himalayan Sound Instruments`,
      variables: ["firstName", "companyName", "country", "productName", "website", "aiPersonalizedIntro"],
      category: "Studio & Academy Outreach",
      isDefault: false,
      createdById: admin.id,
    },
  ];

  for (const tpl of templatesData) {
    const existing = await prisma.emailTemplate.findFirst({ where: { name: tpl.name } });
    if (!existing) {
      await prisma.emailTemplate.create({ data: tpl });
    }
  }

  console.log("✉️ Seeded default email outreach templates.");

  // 5. Create Sample Opportunity & Quotation
  const leadGerman = await prisma.buyerLead.findUnique({
    where: { normalizedEmail: "einkauf@klangtherapie-muenchen.de" },
  });

  const productChakra = await prisma.product.findUnique({
    where: { sku: "SB-7CK-SET" },
  });

  if (leadGerman && productChakra) {
    const opp = await prisma.salesOpportunity.create({
      data: {
        title: "Klangtherapie München — Q3 20x 7-Chakra Sets Wholesale Order",
        stage: OpportunityStage.QUOTATION,
        inquiryValue: 4800.00,
        currency: "USD",
        quantity: 20,
        terms: TradeTerm.CIF,
        expectedCloseDate: new Date(Date.now() + 86400000 * 14),
        leadId: leadGerman.id,
        productId: productChakra.id,
        assignedToId: agent.id,
        notes: "Buyer requested CIF Munich Airport pricing with 20 sets of 7-Chakra bowls + 10 full moon bowls.",
      },
    });

    const existingQuotation = await prisma.quotation.findUnique({
      where: { quotationNumber: "EXP-2026-000001" },
    });

    if (!existingQuotation) {
      await prisma.quotation.create({
        data: {
          quotationNumber: "EXP-2026-000001",
          opportunityId: opp.id,
          leadId: leadGerman.id,
          status: QuotationStatus.SENT,
          currency: "USD",
          subtotal: 4400.00,
          shippingCost: 400.00,
          total: 4800.00,
          tradeTerm: TradeTerm.CIF,
          validUntil: new Date(Date.now() + 86400000 * 30),
          notes: "Includes air freight insurance and custom packaging with German language certificates.",
          createdById: admin.id,
          items: {
            create: [
            {
              productId: productChakra.id,
              productName: productChakra.name,
              quantity: 20,
              unitPrice: 220.00,
              total: 4400.00,
            },
          ],
        },
      },
    });
  }

    console.log("📋 Seeded sample Sales Opportunity & Quotation EXP-2026-000001.");
  }

  console.log("✅ EXPORT AI Database seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
