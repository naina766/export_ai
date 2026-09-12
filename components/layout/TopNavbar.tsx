"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Menu,
  ChevronDown,
  Users,
  Send,
  Kanban,
  Receipt,
  Package,
} from "lucide-react";
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMacPlatform =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (isMacPlatform) {
      setIsMac(true);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(e.target as Node)
      ) {
        setIsCreateOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const createActions = [
    {
      label: "Buyer Lead",
      description: "Add prospective wholesale buyer",
      href: "/leads/new",
      icon: Users,
    },
    {
      label: "Outreach Campaign",
      description: "Launch targeted export sequence",
      href: "/campaigns/new",
      icon: Send,
    },
    {
      label: "Sales Opportunity",
      description: "Manage deal stages & terms",
      href: "/opportunities",
      icon: Kanban,
    },
    {
      label: "Proforma Quotation",
      description: "Generate official commercial quote",
      href: "/quotations/new",
      icon: Receipt,
    },
    {
      label: "Catalog Product",
      description: "Add singing bowl export SKU",
      href: "/products",
      icon: Package,
    },
  ];

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

          {/* Scalable + Create Menu */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              aria-expanded={isCreateOpen}
              aria-haspopup="true"
              aria-label="Create new CRM record"
              className="h-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 sm:px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-white/70 transition-transform duration-150",
                  isCreateOpen && "rotate-180 text-white"
                )}
              />
            </button>

            {isCreateOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/[0.1] bg-[#0E131C] p-1.5 shadow-2xl backdrop-blur-2xl animate-fade-in"
              >
                <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-white/[0.06] mb-1">
                  Quick Actions
                </div>
                {createActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={() => setIsCreateOpen(false)}
                      role="menuitem"
                      className="flex items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.05] group"
                    >
                      <div className="mt-0.5 rounded-md bg-white/[0.04] p-1.5 text-slate-400 group-hover:bg-[#6366F1]/10 group-hover:text-[#6366F1] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[#F8FAFC] group-hover:text-white transition-colors">
                          {action.label}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {action.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Menu */}
          <UserMenu onOpenShortcuts={onOpenShortcuts} />
        </div>
      </div>
    </header>
  );
}
