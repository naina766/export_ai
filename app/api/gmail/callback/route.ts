import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/gmail/oauth";

// GET /api/gmail/callback
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (error || !code || !userId) {
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=${encodeURIComponent(error || "Authorization cancelled")}`);
  }

  try {
    await handleOAuthCallback(code, userId);
    return NextResponse.redirect(`${appUrl}/settings?gmail_connected=true`);
  } catch (err) {
    console.error("[Gmail Callback] Error:", (err as Error).message);
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=Failed%20to%20connect%20account`);
  }
}
