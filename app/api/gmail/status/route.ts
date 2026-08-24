import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/gmail/status
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const account = await prisma.emailAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.userId,
          provider: "GOOGLE",
        },
      },
      select: {
        id: true,
        email: true,
        provider: true,
        isConnected: true,
        scopes: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    return successResponse({
      isConnected: Boolean(account?.isConnected),
      account: account || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/gmail/disconnect
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await prisma.emailAccount.deleteMany({
      where: {
        userId: user.userId,
        provider: "GOOGLE",
      },
    });

    return successResponse({ isConnected: false }, "Gmail account disconnected.");
  } catch (error) {
    return handleApiError(error);
  }
}
