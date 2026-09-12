import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { validateEmailAddress } from "@/lib/email/validator";

// POST /api/leads/:id/validate
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const lead = await prisma.buyerLead.findUnique({ where: { id: params.id } });
    if (!lead) return errorResponse("Buyer lead not found", 404);

    const isPrivileged = ["ADMIN", "MANAGER"].includes(user.role);
    const isOwner =
      lead.assignedToId === user.userId ||
      lead.createdById === user.userId ||
      (!lead.assignedToId && !lead.createdById);

    if (!isPrivileged && !isOwner) {
      return errorResponse("Forbidden: You do not have permission to validate this buyer lead", 403);
    }

    const result = validateEmailAddress(lead.email);

    const updated = await prisma.buyerLead.update({
      where: { id: params.id },
      data: {
        emailStatus: result.status,
        verificationStatus: result.reason,
      },
    });

    return successResponse(updated, `Email verification complete: ${result.reason}`);
  } catch (error) {
    return handleApiError(error);
  }
}
