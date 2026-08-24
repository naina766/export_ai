import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError, getPaginationParams } from "@/lib/api";

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { page, limit, skip } = getPaginationParams(req.nextUrl.searchParams);
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

    const where = {
      userId: user.userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { id: true, companyName: true } } },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
    ]);

    return successResponse({
      items: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/notifications - mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });
    return successResponse(null, "All notifications marked as read");
  } catch (error) {
    return handleApiError(error);
  }
}
