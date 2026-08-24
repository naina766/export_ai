import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { DocumentType } from "@prisma/client";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file) return errorResponse("No file provided", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "export-ai/products",
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    if (entityType === "PRODUCT" && entityId) {
      const product = await prisma.product.findUnique({ where: { id: entityId } });
      if (product) {
        await prisma.document.create({
          data: {
            name: file.name,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            size: uploadResult.bytes,
            type: DocumentType.BROCHURE,
            productId: entityId,
          },
        });
        await prisma.product.update({
          where: { id: entityId },
          data: { thumbnailUrl: uploadResult.secure_url },
        });
      }
    }

    return successResponse(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        size: uploadResult.bytes,
      },
      "File uploaded successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
