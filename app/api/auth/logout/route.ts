import { NextRequest } from "next/server";
import { clearAuthCookies, getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (user) {
      // Remove refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId: user.userId },
      });
    }

    await clearAuthCookies();
    return successResponse(null, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
