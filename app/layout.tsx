import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: { default: "EXPORT AI — Enterprise B2B Export Sales Operating System", template: "%s | EXPORT AI" },
  description: "AI-Powered B2B Export Intelligence Platform for singing bowls and artisanal wellness wholesale.",
  keywords: ["export AI", "B2B sales CRM", "wholesale buyers", "singing bowls", "export management", "outreach automation"],
  authors: [{ name: "EXPORT AI" }],
  robots: "noindex",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#070A0F] text-[#F8FAFC] antialiased selection:bg-[#6366F1]/30 selection:text-white">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0F141D",
              color: "#F8FAFC",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              fontSize: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            },
            success: { iconTheme: { primary: "#22C55E", secondary: "#070A0F" } },
            error: { iconTheme: { primary: "#EF4444", secondary: "#070A0F" } },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
