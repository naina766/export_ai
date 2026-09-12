import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/documents
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const productId = req.nextUrl.searchParams.get("productId");

    const documents = await prisma.document.findMany({
      where: {
        ...(productId && { productId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    return successResponse(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/documents
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    if (!["ADMIN", "MANAGER"].includes(user.role)) {
      return errorResponse("Forbidden: Only Admins and Managers can delete export documents", 403);
    }

    const { id } = await req.json();
    if (!id) return errorResponse("Document ID is required", 400);

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return errorResponse("Document not found", 404);

    await prisma.document.delete({ where: { id } });

    return successResponse({ id }, "Document deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
