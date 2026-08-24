import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError, getPaginationParams, paginatedResponse } from "@/lib/api";
import bcrypt from "bcryptjs";

// GET /api/users
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) return errorResponse("Forbidden", 403);

    const { page, limit, skip, search } = getPaginationParams(req.nextUrl.searchParams);
    const role = req.nextUrl.searchParams.get("role");
    const isActive = req.nextUrl.searchParams.get("isActive");

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as any }),
      ...(isActive !== null && { isActive: isActive === "true" }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/users
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) return errorResponse("name, email, password required", 400);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return errorResponse("Email already registered", 409);

    const hashed = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "AGENT", phone, isApproved: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return successResponse(newUser, "User created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
