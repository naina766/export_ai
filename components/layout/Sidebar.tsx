"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Users,
  Sparkles,
  Kanban,
  Receipt,
  Clock,
  Send,
  FileText,
  Package,
  FolderLock,
  BarChart3,
  FileSpreadsheet,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe2,
} from "lucide-react";
import { cn } from "@/components/ui";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Buyer Discovery", href: "/discovery", icon: Compass },
      { name: "Buyer Leads", href: "/leads", icon: Users },
      { name: "AI Insights", href: "/ai-insights", icon: Sparkles },
    ],
  },
  {
    label: "SALES",
    items: [
      { name: "Campaigns", href: "/campaigns", icon: Send },
      { name: "Sales Pipeline", href: "/opportunities", icon: Kanban },
      { name: "Quotations", href: "/quotations", icon: Receipt },
      { name: "Follow-ups", href: "/follow-ups", icon: Clock },
    ],
  },
  {
    label: "CATALOG",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Documents", href: "/documents", icon: FolderLock },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: FileSpreadsheet },
      { name: "Background Jobs", href: "/jobs", icon: Cpu },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-[#080B10] border-r border-white/[0.06] flex flex-col justify-between transition-all duration-200 font-sans",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* ── Brand Header ── */}
      <div>
        <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center text-white flex-shrink-0 font-bold shadow-xs">
              <Globe2 className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-[#F8FAFC]">EXPORT AI</span>
                <span className="text-[11px] text-slate-400 font-mono tracking-tight">Export Intelligence OS</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Navigation Groups ── */}
        <div className="py-3 px-2.5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              {!isCollapsed && (
                <span className="px-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-2.5 h-[38px] rounded-lg text-sm font-medium transition-colors relative group",
                      isActive
                        ? "bg-white/[0.06] text-white font-medium border-l-2 border-[#6366F1]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.035]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        isActive ? "text-[#6366F1]" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer / Status & Logout ── */}
      <div className="p-3 border-t border-white/[0.06] bg-[#080B10] space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-1.5 rounded-md bg-[#0B0F14] border border-white/[0.04] flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              RabbitMQ
            </span>
            <span className="text-[#22C55E]">Connected</span>
          </div>
        )}
        <Link
          href="/login"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </aside>
  );
}
