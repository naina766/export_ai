import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { UpdateProductSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/products/:id
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        campaigns: { select: { id: true, name: true, status: true } },
      },
    });

    if (!product) return errorResponse("Product not found", 404);

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/products/:id
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!["ADMIN", "MANAGER"].includes(user.role)) {
      return errorResponse("Forbidden: Only Admins and Managers can modify export products", 403);
    }

    const body = await req.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const { specifications, ...rest } = parsed.data;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(specifications && { specifications: JSON.parse(JSON.stringify(specifications)) }),
      },
    });

    return successResponse(product, "Product updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/products/:id
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!["ADMIN", "MANAGER"].includes(user.role)) {
      return errorResponse("Forbidden: Only Admins and Managers can delete export products", 403);
    }

    await prisma.product.delete({ where: { id: params.id } });
    return successResponse({ id: params.id }, "Product deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
