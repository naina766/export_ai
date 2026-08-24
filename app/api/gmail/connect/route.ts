import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { generateAuthUrl } from "@/lib/gmail/oauth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// POST /api/gmail/connect
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const authUrl = generateAuthUrl(user.userId);
    return successResponse({ url: authUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
