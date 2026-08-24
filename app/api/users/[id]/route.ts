import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        isApproved: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedLeads: true, opportunities: true } },
      },
    });
    if (!user) return errorResponse("User not found", 404);
    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const requester = await getAuthUser(req);
    if (!requester) return errorResponse("Unauthorized", 401);

    // Users can update themselves; admins can update anyone
    if (requester.userId !== id && requester.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const allowedFields = ["name", "phone", "avatar", "avatarPublicId"];
    const adminOnlyFields = ["role", "isActive", "isApproved"];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    if (requester.role === "ADMIN") {
      for (const field of adminOnlyFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, isActive: true },
    });

    return successResponse(user, "User updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const requester = await getAuthUser(req);
    if (!requester || requester.role !== "ADMIN") return errorResponse("Forbidden", 403);
    if (requester.userId === id) return errorResponse("Cannot delete yourself", 400);

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return successResponse(null, "User deactivated");
  } catch (error) {
    return handleApiError(error);
  }
}
