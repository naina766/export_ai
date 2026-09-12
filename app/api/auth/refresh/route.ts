import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// POST /api/auth/refresh
export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return errorResponse("No refresh token", 401);
    }

    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return errorResponse("Invalid or expired refresh token", 401);
    }

    // Check if token is in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return errorResponse("Refresh token expired or revoked", 401);
    }

    // Check user still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return errorResponse("Account not found or deactivated", 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Rotate tokens
    const newAccessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);

    // Replace old refresh token atomically
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { token: refreshToken } });
      await tx.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return successResponse({ accessToken: newAccessToken }, "Token refreshed");
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/auth/refresh - Logout
export async function DELETE(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    if (refreshToken) {
      await prisma.refreshToken
        .delete({ where: { token: refreshToken } })
        .catch(() => {}); // Ignore if not found
    }

    await clearAuthCookies();
    return successResponse(null, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
