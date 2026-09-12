import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

/** Escape a field for RFC 4180 CSV: wrap in quotes and double any internal quotes. */
function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/leads/export
// Returns authenticated user's accessible leads as a CSV file.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);

  // RBAC: AGENT only sees their own leads
  const where = isPrivileged
    ? {}
    : {
        OR: [
          { assignedToId: user.userId },
          { createdById: user.userId },
        ],
      };

  const leads = await prisma.buyerLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 2000, // safety cap
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      industry: true,
      buyerType: true,
      buyerIntent: true,
      leadScore: true,
      emailStatus: true,
      outreachStatus: true,
      source: true,
      productInterest: true,
      createdAt: true,
      assignedTo: { select: { name: true, email: true } },
    },
  });

  const HEADERS = [
    "ID",
    "Company Name",
    "Contact Person",
    "Email",
    "Phone",
    "Country",
    "City",
    "Industry",
    "Buyer Type",
    "Buyer Intent",
    "Lead Score",
    "Email Status",
    "Outreach Status",
    "Source",
    "Product Interest",
    "Assigned To",
    "Assigned To Email",
    "Created At",
  ];

  const rows = leads.map((l) => [
    csvEscape(l.id),
    csvEscape(l.companyName),
    csvEscape(l.contactPerson),
    csvEscape(l.email),
    csvEscape(l.phone),
    csvEscape(l.country),
    csvEscape(l.city),
    csvEscape(l.industry),
    csvEscape(l.buyerType),
    csvEscape(l.buyerIntent),
    csvEscape(l.leadScore?.toString()),
    csvEscape(l.emailStatus),
    csvEscape(l.outreachStatus),
    csvEscape(l.source),
    csvEscape(l.productInterest),
    csvEscape(l.assignedTo?.name),
    csvEscape(l.assignedTo?.email),
    csvEscape(l.createdAt.toISOString()),
  ].join(","));

  const csvContent = [HEADERS.join(","), ...rows].join("\r\n");
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `export-ai-buyer-leads-${timestamp}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
