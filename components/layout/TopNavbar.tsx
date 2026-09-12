"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Menu } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NotificationButton } from "@/components/layout/NotificationButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/components/ui";

export function TopNavbar({
  isSidebarCollapsed,
  onOpenCommand,
  onOpenShortcuts,
  onOpenMobileMenu,
}: {
  isSidebarCollapsed: boolean;
  onOpenCommand?: () => void;
  onOpenShortcuts?: () => void;
  onOpenMobileMenu?: () => void;
}) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const isMacPlatform = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (isMacPlatform) {
      setIsMac(true);
    }
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16 w-full border-b border-white/[0.08] bg-[#070A0F]/95 backdrop-blur-xl transition-all duration-200 font-sans ml-0",
        isSidebarCollapsed ? "md:ml-[72px]" : "md:ml-[240px]"
      )}
    >
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] md:grid-cols-[minmax(200px,1fr)_minmax(280px,520px)_minmax(200px,1fr)] items-center gap-4 px-4 sm:px-6">
        {/* ── Left: Hamburger Menu (Mobile) & Breadcrumbs ── */}
        <div className="min-w-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors text-slate-300 md:hidden cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumbs />
        </div>

        {/* ── Center: Global Search (Never overlaps) ── */}
        <div className="w-full min-w-0 hidden md:flex justify-center">
          <div className="relative w-full max-w-[520px]">
            <button
              type="button"
              onClick={onOpenCommand}
              aria-label="Search commands, buyers, campaigns..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 pr-14 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 hover:bg-white/[0.05] transition-all flex items-center justify-between text-left cursor-pointer group"
            >
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                Search commands, buyers, campaigns...
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-slate-500 pointer-events-none">
                {isMac ? "⌘K" : "Ctrl K"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex shrink-0 items-center justify-end gap-3 min-w-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="Open search command palette"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors text-slate-300 md:hidden cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <NotificationButton />

          {/* New Campaign Button */}
          <Link href="/campaigns/new">
            <button
              type="button"
              className="hidden sm:flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Campaign</span>
            </button>
          </Link>

          {/* User Menu */}
          <UserMenu onOpenShortcuts={onOpenShortcuts} />
        </div>
      </div>
    </header>
  );
}
