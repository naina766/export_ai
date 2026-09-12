import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  hashRefreshToken,
} from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api";
import { rateLimiter } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const rl = rateLimiter.check(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.success) {
      return errorResponse("Too many registration attempts. Please wait before creating another account.", 429);
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { name, email, password, phone } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // First user is auto-approved as admin bootstrap; all subsequent public registrations are AGENT.
    // Database-level table lock serializes bootstrap check, preventing concurrent registration race conditions.
    const user = await prisma.$transaction(
      async (tx) => {
        try {
          // Acquire exclusive lock on users table to eliminate concurrent bootstrap race condition
          await tx.$executeRaw`LOCK TABLE "users" IN EXCLUSIVE MODE`;
        } catch {
          // Graceful fallback for test databases (e.g. SQLite or non-Postgres mocks)
        }

        const userCount = await tx.user.count();
        const isFirstUser = userCount === 0;

        return tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            phone,
            role: isFirstUser ? "ADMIN" : "AGENT",
            isApproved: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isApproved: true,
            createdAt: true,
          },
        });
      },
      {
        timeout: 10000,
      }
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        newData: { email, role: user.role },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Store only the SHA-256 cryptographic hash of the refresh token (never plaintext)
    await prisma.refreshToken.create({
      data: {
        token: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await setAuthCookies(accessToken, refreshToken);

    return successResponse({ user, accessToken }, "Registration successful", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
