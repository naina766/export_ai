import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { CreateProductSchema, PaginationSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
  paginatedResponse,
} from "@/lib/api";
import { ProductCategory } from "@prisma/client";

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") as ProductCategory | null;

    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { material: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && { category }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          images: true,
          _count: { select: { quotationItems: true, campaigns: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResponse(products, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { specifications, ...rest } = parsed.data;
    const slug = rest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existingSku = await prisma.product.findUnique({ where: { sku: rest.sku } });
    if (existingSku) return errorResponse(`Product with SKU "${rest.sku}" already exists.`, 409);

    const product = await prisma.product.create({
      data: {
        ...rest,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        ...(specifications && { specifications: JSON.parse(JSON.stringify(specifications)) }),
      },
    });

    return successResponse(product, "Product created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
