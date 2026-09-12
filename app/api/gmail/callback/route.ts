import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback, verifyOAuthState } from "@/lib/gmail/oauth";

// GET /api/gmail/callback
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=${encodeURIComponent(error || "Authorization cancelled")}`);
  }

  // Validate CSRF state
  const verifiedState = verifyOAuthState(state);
  if (!verifiedState) {
    console.warn("[Gmail Callback] Invalid, expired, or tampered OAuth state parameter.");
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=Invalid%20or%20expired%20OAuth%20state`);
  }

  try {
    await handleOAuthCallback(code, verifiedState.userId);
    return NextResponse.redirect(`${appUrl}/settings?gmail_connected=true`);
  } catch (err) {
    console.error("[Gmail Callback] Error:", (err as Error).message);
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=Failed%20to%20connect%20account`);
  }
}
