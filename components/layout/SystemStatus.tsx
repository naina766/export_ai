"use client";
import React, { useState, useRef, useEffect } from "react";
import { Server, Activity, Cpu, CheckCircle2, ShieldCheck, RefreshCw, X } from "lucide-react";
import { cn } from "@/components/ui";

export interface SystemStatusProps {
  activeJobs?: number;
  qualifiedBuyers?: number;
  className?: string;
}

export function SystemStatus({
  activeJobs = 4,
  qualifiedBuyers = 86,
  className,
}: SystemStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative font-sans" ref={popoverRef}>
      {/* ── Compact Trigger Pill ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open system telemetry status"
        className={cn(
          "inline-flex items-center gap-2 h-9 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs font-mono select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50",
          className
        )}
      >
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse flex-shrink-0" />
        <span className="font-medium text-slate-300 hidden sm:inline">Operational</span>
      </button>

      {/* ── Telemetry Popover ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-[#0F141D] border border-white/[0.12] shadow-2xl p-4 space-y-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#22C55E]" />
              <h4 className="text-sm font-semibold text-[#F8FAFC]">System Operations</h4>
            </div>
            <span className="text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded font-medium">
              100% HEALTH
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">RabbitMQ</span>
              <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Connected
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Workers</span>
              <span className="text-[#F8FAFC] font-semibold">7 active</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Active Queues</span>
              <span className="text-[#F8FAFC] font-semibold">3 operational</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Failed Jobs</span>
              <span className="text-[#22C55E] font-semibold">0</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Heartbeat:</span>
            <span className="text-slate-300">12 sec ago • 24ms latency</span>
          </div>
        </div>
      )}
    </div>
  );
}
