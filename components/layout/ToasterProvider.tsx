"use client";
import { Toaster } from "react-hot-toast";

/**
 * ToasterProvider — client-only boundary for react-hot-toast.
 *
 * react-hot-toast uses goober (CSS-in-JS) which calls document.createElement
 * at module initialisation and generates incrementing class-name hashes.
 * When <Toaster> is rendered in a Server Component layout, the CSS hash
 * counters start at different values on the server vs. client, producing a
 * hydration mismatch.
 *
 * Marking this wrapper as "use client" means React treats it as a
 * client-only subtree: it is never server-rendered, so there is nothing to
 * hydrate and the mismatch disappears.
 */
export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#0F141D",
          color: "#F8FAFC",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          fontSize: "14px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        },
        success: { iconTheme: { primary: "#22C55E", secondary: "#070A0F" } },
        error: { iconTheme: { primary: "#EF4444", secondary: "#070A0F" } },
        duration: 4000,
      }}
    />
  );
}
