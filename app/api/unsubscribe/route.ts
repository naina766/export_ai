import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/security/tokens";
import { prisma } from "@/lib/prisma";
import { ConsentStatus, OutreachStatus } from "@prisma/client";

// GET /api/unsubscribe?token=...
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(renderHtml("Invalid Request", "No unsubscribe token provided.", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return new NextResponse(renderHtml("Invalid Token", "This unsubscribe link is invalid or has expired.", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const lead = await prisma.buyerLead.findUnique({
      where: { id: payload.leadId },
    });

    if (!lead) {
      return new NextResponse(renderHtml("Lead Not Found", "The requested email record was not found.", false), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    await prisma.buyerLead.update({
      where: { id: lead.id },
      data: {
        unsubscribeStatus: true,
        consentStatus: ConsentStatus.UNSUBSCRIBED,
        outreachStatus: OutreachStatus.UNSUBSCRIBED,
      },
    });

    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Buyer Unsubscribed",
        description: `${lead.email} opted out of future export outreach campaigns.`,
        leadId: lead.id,
      },
    });

    return new NextResponse(
      renderHtml(
        "Successfully Unsubscribed",
        `Your email (${lead.email}) has been removed from our Himalayan Singing Bowls export catalog mailing list. You will not receive any further automated outreach emails.`,
        true
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("[Unsubscribe Route] Error:", (error as Error).message);
    return new NextResponse(
      renderHtml("Error", "An error occurred while processing your unsubscribe request.", false),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHtml(title: string, message: string, isSuccess: boolean): string {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${safeTitle} — Export AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      background-color: #0a0d14;
      color: #e8eeff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: #161c2d;
      border: 1px solid #1e2a44;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${isSuccess ? "rgba(16, 217, 160, 0.15)" : "rgba(240, 77, 94, 0.15)"};
      color: ${isSuccess ? "#10d9a0" : "#f04d5e"};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 20px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 12px;
      font-weight: 700;
      color: #f1f5ff;
    }
    p {
      font-size: 14px;
      color: #8892b0;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? "✓" : "✕"}</div>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
  </div>
</body>
</html>
  `;
}
