import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { z } from "zod";

const CreateFollowUpSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  notes: z.string().max(1000, "Notes too long").optional(),
  scheduledAt: z.string().datetime("Invalid ISO date string"),
  leadId: z.string().cuid("Invalid lead ID").optional(),
});

const UpdateFollowUpSchema = z.object({
  id: z.string().cuid("Invalid follow-up ID"),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
  isCompleted: z.boolean().optional(),
});

// GET /api/follow-ups
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const leadId = searchParams.get("leadId");
    const isCompletedParam = searchParams.get("isCompleted");

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);

    // If querying for a specific lead, verify ownership
    if (leadId) {
      const lead = await prisma.buyerLead.findUnique({
        where: { id: leadId },
        select: { id: true, assignedToId: true, createdById: true },
      });
      if (!lead) return errorResponse("Buyer lead not found", 404);

      if (!isPrivileged && lead.assignedToId !== user.userId && lead.createdById !== user.userId) {
        return errorResponse("Forbidden: You do not have permission to view follow-ups for this lead", 403);
      }
    }

    const where = {
      ...(leadId ? { leadId } : !isPrivileged ? { userId: user.userId } : {}),
      ...(isCompletedParam !== null ? { isCompleted: isCompletedParam === "true" } : {}),
    };

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        lead: {
          select: { id: true, companyName: true, contactPerson: true, email: true, country: true },
        },
      },
    });

    return successResponse(followUps);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/follow-ups
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { title, notes, scheduledAt, leadId } = parsed.data;

    // Verify caller is authorized to add a follow-up for this lead
    if (leadId) {
      const lead = await prisma.buyerLead.findUnique({
        where: { id: leadId },
        select: { id: true, assignedToId: true, createdById: true },
      });
      if (!lead) return errorResponse("Buyer lead not found", 404);

      const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
      const isOwner = lead.assignedToId === user.userId || lead.createdById === user.userId;
      if (!isPrivileged && !isOwner) {
        return errorResponse("Forbidden: You do not have permission to create a follow-up for this lead", 403);
      }
    }

    const followUp = await prisma.followUp.create({
      data: {
        title,
        notes,
        scheduledAt: new Date(scheduledAt),
        userId: user.userId,
        leadId,
      },
      include: {
        lead: {
          select: { id: true, companyName: true },
        },
      },
    });

    return successResponse(followUp, "Follow-up scheduled successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/follow-ups
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = UpdateFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { id, title, notes, scheduledAt, isCompleted } = parsed.data;

    const existing = await prisma.followUp.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!existing) return errorResponse("Follow-up not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    if (!isPrivileged && existing.userId !== user.userId) {
      return errorResponse("Forbidden: You do not have permission to modify this follow-up", 403);
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(isCompleted !== undefined && {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
      },
    });

    return successResponse(updated, "Follow-up updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
