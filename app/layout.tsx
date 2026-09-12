import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/layout/ToasterProvider";

export const metadata: Metadata = {
  title: { default: "EXPORT AI — Enterprise B2B Export Sales Operating System", template: "%s | EXPORT AI" },
  description: "AI-Powered B2B Export Intelligence Platform for singing bowls and artisanal wellness wholesale.",
  keywords: ["export AI", "B2B sales CRM", "wholesale buyers", "singing bowls", "export management", "outreach automation"],
  authors: [{ name: "EXPORT AI" }],
  robots: "noindex",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#070A0F] text-[#F8FAFC] antialiased selection:bg-[#6366F1]/30 selection:text-white">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
