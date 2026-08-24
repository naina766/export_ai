"use client";
import React from "react";
import { cn } from "./index";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}: {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "segmented";
  className?: string;
}) {
  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-1 rounded-lg bg-[#0A0D13] border border-white/[0.08] gap-1 overflow-x-auto max-w-full",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
                isActive
                  ? "bg-[#131925] text-[#F8FAFC] shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded",
                    isActive ? "bg-[#6366F1]/20 text-[#818cf8]" : "bg-white/[0.04] text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("border-b border-white/[0.08] overflow-x-auto", className)}>
      <nav className="flex items-center gap-6 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "py-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 border-b-2 -mb-px outline-none",
                isActive
                  ? "border-[#6366F1] text-[#F8FAFC] font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/[0.16]"
              )}
            >
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded-full",
                    isActive ? "bg-[#6366F1]/20 text-[#818cf8]" : "bg-white/[0.04] text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
