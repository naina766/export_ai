import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateBuyerLeadSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
  getPaginationParams,
  paginatedResponse,
} from "@/lib/api";
import { validateEmailAddress } from "@/lib/email/validator";
import { createOutboxEvent } from "@/lib/rabbitmq/outbox";
import type { BuyerType, EmailStatus, OutreachStatus } from "@prisma/client";

// ======================
// GET /api/leads
// ======================
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { page, limit, skip, search, sortBy, sortOrder } =
      getPaginationParams(req.nextUrl.searchParams);

    const country = req.nextUrl.searchParams.get("country");
    const buyerType = req.nextUrl.searchParams.get("buyerType") as BuyerType | null;
    const emailStatus = req.nextUrl.searchParams.get("emailStatus") as EmailStatus | null;
    const outreachStatus = req.nextUrl.searchParams.get("outreachStatus") as OutreachStatus | null;
    const minScore = req.nextUrl.searchParams.get("minScore");

    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { country: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(country && { country: { equals: country, mode: "insensitive" } }),
      ...(buyerType && { buyerType }),
      ...(emailStatus && { emailStatus }),
      ...(outreachStatus && { outreachStatus }),
      ...(minScore && { leadScore: { gte: parseInt(minScore) } }),
    };

    const ALLOWED_SORT_FIELDS = ["createdAt", "leadScore", "companyName", "updatedAt", "country"];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";

    // RBAC: AGENT can only see leads they created or are assigned to
    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const ownershipFilter = !isPrivileged
      ? {
          OR: [
            { assignedToId: user.userId },
            { createdById: user.userId },
          ],
        }
      : {};

    const effectiveWhere = isPrivileged
      ? where
      : { AND: [where, ownershipFilter] };

    const [leads, total] = await Promise.all([
      prisma.buyerLead.findMany({
        where: effectiveWhere,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: { activities: true, followUps: true, opportunities: true },
          },
        },
      }),
      prisma.buyerLead.count({ where: effectiveWhere }),
    ]);

    return paginatedResponse(leads, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// ======================
// POST /api/leads
// ======================
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateBuyerLeadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { email, ...rest } = parsed.data;
    const emailValidation = validateEmailAddress(email);

    // Check duplicate normalized email
    const existing = await prisma.buyerLead.findUnique({
      where: { normalizedEmail: emailValidation.normalizedEmail },
    });

    if (existing) {
      return errorResponse(`A buyer lead with email ${email} already exists.`, 409);
    }

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.buyerLead.create({
        data: {
          ...rest,
          email: emailValidation.email,
          normalizedEmail: emailValidation.normalizedEmail,
          emailStatus: emailValidation.status,
          verificationStatus: emailValidation.reason,
          createdById: user.userId,
          assignedToId: rest.assignedToId || user.userId,
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      // Create AI qualification outbox event
      await createOutboxEvent(tx, {
        eventKey: `lead:${created.id}:classify`,
        eventType: "AI_CLASSIFY",
        aggregateType: "BuyerLead",
        aggregateId: created.id,
        payload: { leadId: created.id },
      });

      return created;
    });

    // Create Activity Log
    await prisma.activity.create({
      data: {
        type: "NOTE",
        title: "Buyer lead added",
        description: `New export prospect ${lead.companyName} (${lead.country}) created.`,
        userId: user.userId,
        leadId: lead.id,
      },
    });

    return successResponse(lead, "Buyer lead created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}