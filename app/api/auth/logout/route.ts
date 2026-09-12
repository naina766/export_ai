import { NextRequest } from "next/server";
import { clearAuthCookies, getAuthUser, hashRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (user) {
      // Remove all refresh tokens for this user (hash-based storage)
      await prisma.refreshToken.deleteMany({
        where: { userId: user.userId },
      });
    } else {
      // Fallback: if access token is gone, try to revoke by cookie hash
      const rawToken = req.cookies.get("refresh_token")?.value;
      if (rawToken) {
        await prisma.refreshToken
          .delete({ where: { token: hashRefreshToken(rawToken) } })
          .catch(() => {});
      }
    }

    await clearAuthCookies();
    return successResponse(null, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
