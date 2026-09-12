import { google } from "googleapis";
import { getAuthenticatedOAuth2Client } from "./oauth";
import { generateUnsubscribeToken } from "@/lib/security/tokens";

export interface EmailAttachment {
  name: string;
  url: string;
  mimeType?: string | null;
}

export interface SendEmailParams {
  userId: string;
  leadId: string;
  campaignId?: string;
  toEmail: string;
  toName?: string | null;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  senderEmail: string;
  error?: string;
}

/**
 * Constructs a base64url encoded MIME email string.
 */
function createMimeMessage(
  fromEmail: string,
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  unsubscribeUrl: string
): string {
  const boundary = "==_ExportAI_MIME_Boundary_" + Date.now().toString(16);

  const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${htmlContent}
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
  <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
    You received this commercial B2B inquiry because your company is listed in international trade or wellness registries.<br/>
    If you do not wish to receive wholesale singing bowl export offers, you can <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">unsubscribe instantly</a>.
  </div>
</body>
</html>
  `.trim();

  const lines = [
    `From: Export AI Sales <${fromEmail}>`,
    `To: ${toName ? `"${toName}" <${toEmail}>` : toEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `List-Unsubscribe: <${unsubscribeUrl}>`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    textContent,
    "",
    `To unsubscribe, visit: ${unsubscribeUrl}`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    fullHtml,
    "",
    `--${boundary}--`,
  ];

  const rawMessage = lines.join("\r\n");
  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Sends an email via connected Gmail API account or simulation mode.
 */
export async function sendEmailViaGmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { userId, leadId, campaignId, toEmail, toName, subject, bodyHtml, bodyText } = params;

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubscribeToken = generateUnsubscribeToken(leadId, toEmail, campaignId);
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;

  const authData = await getAuthenticatedOAuth2Client(userId);

  // If no Gmail account connected — fail closed in production, simulate in dev/test
  if (!authData) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[Gmail Service] NOT_CONFIGURED: No Gmail account connected for user ${userId}. Email to ${toEmail} was NOT sent.`
      );
      return {
        success: false,
        senderEmail: "",
        error: "NOT_CONFIGURED: Gmail account not connected. No email was sent.",
      };
    }
    // Development / test: simulate sending so local dev works without real credentials
    console.log(
      `[Gmail Service: DEV_SIMULATION] Would send email to ${toEmail} for lead ${leadId}. Subject: "${subject}"`
    );
    return {
      success: false, // still false to prevent confusion in dev logs
      providerMessageId: `dev_sim_${Date.now()}`,
      senderEmail: "dev-simulation@localhost",
      error: "DEV_SIMULATION: Gmail not connected in development environment.",
    };
  }

  const { oauth2Client, email: senderEmail } = authData;

  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const rawEncoded = createMimeMessage(
      senderEmail,
      toEmail,
      toName || "",
      subject,
      bodyHtml,
      bodyText || bodyHtml.replace(/<[^>]*>?/gm, ""),
      unsubscribeUrl
    );

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawEncoded,
      },
    });

    return {
      success: true,
      providerMessageId: res.data.id || `gmail_msg_${Date.now()}`,
      senderEmail,
    };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`[Gmail Service] Send failed for ${toEmail}:`, errorMsg);
    return {
      success: false,
      senderEmail,
      error: errorMsg,
    };
  }
}
