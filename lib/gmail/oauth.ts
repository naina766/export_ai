import { google } from "googleapis";
import { encryptToken, decryptToken } from "@/lib/security/encryption";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

import crypto from "crypto";

export interface OAuthStatePayload {
  userId: string;
  nonce: string;
  issuedAt: number;
}

const OAUTH_STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

export function generateOAuthState(userId: string): string {
  const payload: OAuthStatePayload = {
    userId,
    nonce: crypto.randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };

  const secret = process.env.JWT_SECRET || "dev-oauth-state-secret-32-chars-long";
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verifyOAuthState(state: string | null | undefined): { userId: string } | null {
  if (!state || !state.includes(".")) return null;

  try {
    const [data, hmac] = state.split(".");
    if (!data || !hmac) return null;

    const secret = process.env.JWT_SECRET || "dev-oauth-state-secret-32-chars-long";
    const expectedHmac = crypto.createHmac("sha256", secret).update(data).digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!payload.userId || !payload.issuedAt) return null;

    if (Date.now() - payload.issuedAt > OAUTH_STATE_MAX_AGE_MS) {
      return null; // Expired
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function generateAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  const secureState = generateOAuthState(userId);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: secureState,
  });
}

export async function handleOAuthCallback(code: string, userId: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile email
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || "unknown@gmail.com";

  if (!tokens.access_token) {
    throw new Error("Failed to obtain access token from Google.");
  }

  const accessTokenEncrypted = encryptToken(tokens.access_token);
  const refreshTokenEncrypted = tokens.refresh_token
    ? encryptToken(tokens.refresh_token)
    : "";

  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  // Persist encrypted token in database
  const emailAccount = await prisma.emailAccount.upsert({
    where: {
      userId_provider: {
        userId,
        provider: "GOOGLE",
      },
    },
    update: {
      email,
      accessTokenEncrypted,
      ...(refreshTokenEncrypted && { refreshTokenEncrypted }),
      tokenExpiry,
      isConnected: true,
      lastSyncAt: new Date(),
    },
    create: {
      userId,
      provider: "GOOGLE",
      providerAccountId: userInfo.data.id || undefined,
      email,
      accessTokenEncrypted,
      refreshTokenEncrypted: refreshTokenEncrypted || accessTokenEncrypted,
      tokenExpiry,
      isConnected: true,
      lastSyncAt: new Date(),
    },
  });

  return emailAccount;
}

export async function getAuthenticatedOAuth2Client(userId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "GOOGLE",
      },
    },
  });

  if (!account || !account.isConnected) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  const accessToken = decryptToken(account.accessTokenEncrypted);
  const refreshToken = decryptToken(account.refreshTokenEncrypted);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.tokenExpiry?.getTime(),
  });

  // Handle automatic token refresh if expired
  if (account.tokenExpiry && account.tokenExpiry.getTime() <= Date.now() + 60000 && refreshToken) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const newTokens = refreshed.credentials;

      if (newTokens.access_token) {
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEncrypted: encryptToken(newTokens.access_token),
            tokenExpiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
          },
        });
      }
    } catch (err) {
      console.error("[Gmail OAuth] Token refresh failed:", (err as Error).message);
    }
  }

  return { oauth2Client, email: account.email };
}
