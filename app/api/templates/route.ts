import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateTemplateSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/templates
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { campaigns: true } },
      },
    });

    return successResponse(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/templates
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const template = await prisma.emailTemplate.create({
      data: {
        ...parsed.data,
        createdById: user.userId,
      },
    });

    return successResponse(template, "Template created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
