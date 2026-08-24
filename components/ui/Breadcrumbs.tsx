"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  discovery: "Buyer Discovery",
  leads: "Buyer Leads",
  "ai-insights": "AI Insights",
  products: "Product Catalog",
  campaigns: "Campaigns",
  opportunities: "Sales Pipeline",
  quotations: "Quotations",
  "follow-ups": "Follow-ups",
  templates: "Email Templates",
  analytics: "Analytics",
  reports: "Reports",
  jobs: "Background Jobs",
  documents: "Documents & Assets",
  settings: "Settings",
  new: "New",
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items?: BreadcrumbItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems: BreadcrumbItem[] = items || [
    { label: "EXPORT AI", href: "/dashboard" },
    ...segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = ROUTE_LABELS[seg] || decodeURIComponent(seg.replace(/-/g, " "));
      return { label, href };
    }),
  ];

  const displayItems = breadcrumbItems.length === 1
    ? [{ label: "EXPORT AI", href: "/dashboard" }, { label: "Dashboard", href: "/dashboard" }]
    : breadcrumbItems;

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex items-center gap-2 text-sm select-none font-sans min-w-0", className)}>
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-slate-700 select-none">/</span>
            )}
            {isLast ? (
              <span className="font-medium text-slate-300 tracking-tight whitespace-nowrap truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap truncate max-w-[140px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
