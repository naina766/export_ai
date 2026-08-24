"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, Keyboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui";

export function UserMenu({
  onOpenShortcuts,
}: {
  onOpenShortcuts?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
    <div className="relative font-sans shrink-0" ref={menuRef}>
      {/* ── Circular Avatar Trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open user profile menu"
        className="w-9 h-9 rounded-full bg-[#0F141D] border border-white/[0.08] hover:border-white/[0.2] hover:ring-2 hover:ring-indigo-500/30 flex items-center justify-center text-xs font-mono font-semibold text-[#F8FAFC] transition-all focus:outline-none cursor-pointer"
      >
        EA
      </button>

      {/* ── User Dropdown Menu with Subtle Animation ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0F141D] border border-white/[0.12] shadow-2xl p-2 space-y-1 z-50"
          >
            {/* User Header */}
            <div className="px-3 py-2.5 border-b border-white/[0.06] space-y-0.5">
              <p className="text-sm font-semibold text-[#F8FAFC]">Admin User</p>
              <p className="text-xs text-slate-400 font-mono">admin@exportai.com</p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Export Director • Workspace Owner
              </div>
            </div>

            {/* Links */}
            <div className="py-1 space-y-0.5 text-sm">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenShortcuts) onOpenShortcuts();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  <span>Keyboard Shortcuts</span>
                </div>
                <kbd className="text-xs font-mono text-slate-500 bg-[#0A0D13] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  ?
                </kbd>
              </button>
            </div>

            {/* Logout */}
            <div className="pt-1 border-t border-white/[0.06]">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
