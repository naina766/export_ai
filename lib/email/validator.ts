import { EmailStatus } from "@prisma/client";

const RFC_5322_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "throwawaymail.com",
  "getairmail.com",
  "dispostable.com",
  "sharklasers.com",
  "grr.la",
  "inboxkitten.com",
  "burnermail.io",
]);

const HIGH_RISK_PREFIXES = new Set([
  "abuse@",
  "noc@",
  "postmaster@",
  "hostmaster@",
  "usenet@",
  "ftp@",
  "spam@",
]);

export interface EmailValidationResult {
  email: string;
  normalizedEmail: string;
  status: EmailStatus;
  isValid: boolean;
  isDisposable: boolean;
  isRoleAccount: boolean;
  domain: string;
  reason: string;
}

/**
 * Validates an email address against syntax, domain format, and disposable blocklists.
 */
export function validateEmailAddress(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== "string") {
    return {
      email: "",
      normalizedEmail: "",
      status: EmailStatus.INVALID,
      isValid: false,
      isDisposable: false,
      isRoleAccount: false,
      domain: "",
      reason: "Email address is missing or empty.",
    };
  }

  const email = rawEmail.trim();
  const normalizedEmail = email.toLowerCase();

  // 1. Basic format & RFC check
  if (!RFC_5322_REGEX.test(normalizedEmail)) {
    return {
      email,
      normalizedEmail,
      status: EmailStatus.INVALID,
      isValid: false,
      isDisposable: false,
      isRoleAccount: false,
      domain: "",
      reason: "Failed RFC 5322 email syntax validation.",
    };
  }

  const parts = normalizedEmail.split("@");
  if (parts.length !== 2) {
    return {
      email,
      normalizedEmail,
      status: EmailStatus.INVALID,
      isValid: false,
      isDisposable: false,
      isRoleAccount: false,
      domain: "",
      reason: "Invalid email structure.",
    };
  }

  const [localPart, domain] = parts;

  // 2. Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      email,
      normalizedEmail,
      status: EmailStatus.INVALID,
      isValid: false,
      isDisposable: true,
      isRoleAccount: false,
      domain,
      reason: "Disposable / temporary email domain blocked.",
    };
  }

  // 3. Check high-risk prefixes
  const isRole = Array.from(HIGH_RISK_PREFIXES).some((prefix) =>
    normalizedEmail.startsWith(prefix)
  );

  if (isRole) {
    return {
      email,
      normalizedEmail,
      status: EmailStatus.RISKY,
      isValid: true,
      isDisposable: false,
      isRoleAccount: true,
      domain,
      reason: "Role-based administrative address (high bounce/complaint risk).",
    };
  }

  // 4. Domain top-level format checks
  if (domain.length < 4 || !domain.includes(".")) {
    return {
      email,
      normalizedEmail,
      status: EmailStatus.INVALID,
      isValid: false,
      isDisposable: false,
      isRoleAccount: false,
      domain,
      reason: "Malformed top-level domain.",
    };
  }

  return {
    email,
    normalizedEmail,
    status: EmailStatus.VALID,
    isValid: true,
    isDisposable: false,
    isRoleAccount: false,
    domain,
    reason: "Valid syntax, active domain format verified.",
  };
}
