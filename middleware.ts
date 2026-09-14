import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/campaigns",
  "/opportunities",
  "/quotations",
  "/discovery",
  "/ai-insights",
  "/analytics",
  "/reports",
  "/products",
  "/documents",
  "/settings",
  "/jobs",
  "/templates",
  "/follow-ups",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return new TextEncoder().encode("dev-secret-key-at-least-32-chars-long-for-hmac-sha256");
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  const hasValidAccess = await verifyToken(accessToken);
  const hasValidRefresh = !hasValidAccess && refreshToken ? await verifyToken(refreshToken) : false;
  const isAuthenticated = hasValidAccess || hasValidRefresh;

  const isProtectedPath = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If user visits root path '/'
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    const loginUrl = new URL("/login", req.url);
    const res = NextResponse.redirect(loginUrl);
    if (accessToken || refreshToken) {
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
    }
    return res;
  }

  // If user tries to access protected route while unauthenticated, redirect to login and wipe invalid cookies
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
    if (accessToken || refreshToken) {
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
    }
    return res;
  }

  // If visiting login or register
  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // If unauthenticated but stale/expired cookies exist, delete them
    if (accessToken || refreshToken) {
      const res = NextResponse.next();
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     * - api routes (API routes enforce auth independently)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
