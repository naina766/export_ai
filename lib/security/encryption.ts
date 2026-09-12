import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: TOKEN_ENCRYPTION_KEY is required in production.");
    }
    // Isolated local development fallback only
    const devFallback = "dev-token-encryption-key-32-chars-ok!";
    return crypto.createHash("sha256").update(devFallback).digest();
  }

  // If hex string of 64 chars -> 32 bytes
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("FATAL: TOKEN_ENCRYPTION_KEY must be at least 32 characters in production.");
  }

  // Otherwise derive 32-byte key via SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive text (OAuth tokens, API keys) using AES-256-GCM.
 * Output format: Base64(iv + authTag + ciphertext)
 */
export function encryptToken(text: string): string {
  if (!text) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts AES-256-GCM encrypted tokens.
 */
export function decryptToken(encryptedBase64: string): string {
  if (!encryptedBase64) return "";
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedBase64, "base64");

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Invalid encrypted payload length.");
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Encryption] Failed to decrypt token:", (error as Error).message);
    return "";
  }
}
