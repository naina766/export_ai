import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { CsvImportDiscoveryProvider } from "@/lib/discovery/csvImportProvider";
import { normalizeProspect } from "@/lib/discovery/normalizer";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";

// POST /api/leads/import
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return errorResponse("CSV content string is required in 'csvContent'", 400);
    }

    const csvProvider = new CsvImportDiscoveryProvider();
    const rawProspects = csvProvider.parseCsvRows(csvContent);

    if (rawProspects.length === 0) {
      return errorResponse("No valid lead rows detected in CSV.", 400);
    }

    let inserted = 0;
    let duplicates = 0;
    const insertedIds: string[] = [];

    for (let i = 0; i < rawProspects.length; i++) {
      const normalized = normalizeProspect(rawProspects[i], i + 1);
      if (!normalized) continue;

      const existing = await prisma.buyerLead.findUnique({
        where: { normalizedEmail: normalized.normalizedEmail },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      try {
        const lead = await prisma.$transaction(async (tx) => {
          const created = await tx.buyerLead.create({
            data: {
              ...normalized,
              createdById: user.userId,
            },
          });

          // Enqueue AI qualification
          await createOutboxEvent(tx, {
            eventKey: `lead:${created.id}:classify`,
            eventType: "AI_CLASSIFY",
            aggregateType: "BuyerLead",
            aggregateId: created.id,
            payload: { leadId: created.id },
          });

          return created;
        });

        insertedIds.push(lead.id);
        inserted++;
      } catch (err) {
        console.warn("[CSV Import] Failed to insert row:", (err as Error).message);
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: "CSV_IMPORT",
        entity: "BuyerLead",
        newData: { totalRows: rawProspects.length, inserted, duplicates },
        userId: user.userId,
      },
    });

    return successResponse(
      {
        totalParsed: rawProspects.length,
        inserted,
        duplicates,
        leadIds: insertedIds,
      },
      `Successfully imported ${inserted} buyer leads (${duplicates} duplicate emails skipped).`,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
