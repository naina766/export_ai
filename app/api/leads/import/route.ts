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
    // 1. Normalize all valid rows
    const normalizedRows = [];
    for (let i = 0; i < rawProspects.length; i++) {
      const norm = normalizeProspect(rawProspects[i], i + 1);
      if (norm) normalizedRows.push(norm);
    }

    // 2. Query existing emails in a single IN query
    const candidateEmails = normalizedRows.map((r) => r.normalizedEmail);
    const existingRecords = await prisma.buyerLead.findMany({
      where: { normalizedEmail: { in: candidateEmails } },
      select: { normalizedEmail: true },
    });
    const seenEmails = new Set(existingRecords.map((e) => e.normalizedEmail));

    const toInsert = [];
    let duplicates = 0;
    for (const row of normalizedRows) {
      if (seenEmails.has(row.normalizedEmail)) {
        duplicates++;
      } else {
        seenEmails.add(row.normalizedEmail); // Prevent duplicates within the same CSV
        toInsert.push(row);
      }
    }

    // 3. Insert in chunked transactions (25 per chunk)
    const insertedIds: string[] = [];
    const BATCH_SIZE = 25;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(async (tx) => {
        for (const item of chunk) {
          const created = await tx.buyerLead.create({
            data: {
              ...item,
              createdById: user.userId,
            },
          });
          insertedIds.push(created.id);

          await createOutboxEvent(tx, {
            eventKey: `lead:${created.id}:classify`,
            eventType: "AI_CLASSIFY",
            aggregateType: "BuyerLead",
            aggregateId: created.id,
            payload: { leadId: created.id },
          });
        }
      });
    }

    inserted = insertedIds.length;

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
