"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui";
import { useRealtimeStream } from "@/lib/realtime/useRealtimeStream";

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "AI" | "SALES" | "DISCOVERY" | "CAMPAIGNS">("ALL");
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    events,
    unreadCount,
    markAllRead,
    markAsRead,
  } = useRealtimeStream();

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

  const filteredEvents = events.filter((ev) => {
    if (selectedTab === "ALL") return true;
    return ev.category === selectedTab;
  });

  return (
    <div className="relative font-sans shrink-0" ref={popoverRef}>
      {/* ── 40x40 Bell Trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors active:scale-95 relative focus:outline-none cursor-pointer"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#6366F1]" />
        )}
      </button>

      {/* ── Notifications Popover with Motion ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0F141D] border border-white/[0.12] shadow-2xl p-4 space-y-3 z-50"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] text-xs font-semibold text-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#6366F1]/20 text-[#818cf8] text-xs font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-mono text-slate-400 hover:text-[#22D3EE] transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
              {(["ALL", "AI", "SALES", "DISCOVERY", "CAMPAIGNS"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTab(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded transition-colors cursor-pointer",
                    selectedTab === tab
                      ? "bg-[#6366F1]/20 text-[#818cf8] font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No notifications in this category</p>
              ) : (
                filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => markAsRead(ev.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-xs space-y-1 cursor-pointer",
                      ev.read
                        ? "bg-[#0A0D13] border-white/[0.04] opacity-75"
                        : "bg-[#131925] border-[#6366F1]/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F8FAFC] text-sm">{ev.title}</span>
                      <span className="text-xs font-mono text-slate-400">{ev.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{ev.description}</p>
                    {ev.link && (
                      <Link
                        href={ev.link}
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-[#6366F1] hover:underline font-mono inline-block pt-1"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
