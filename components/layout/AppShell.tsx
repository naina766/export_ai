"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/layout/KeyboardShortcutsDialog";
import { cn } from "@/components/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const keySequenceRef = useRef<string[]>([]);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      // ? for shortcuts
      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // / for search focus
      if (e.key === "/") {
        e.preventDefault();
        const searchEl = document.querySelector<HTMLInputElement>("input[type='text'], input[placeholder*='Search']");
        if (searchEl) {
          searchEl.focus();
        } else {
          setIsCommandOpen(true);
        }
        return;
      }

      // Key Sequences (e.g. G D, G L)
      const key = e.key.toUpperCase();
      keySequenceRef.current.push(key);

      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = setTimeout(() => {
        keySequenceRef.current = [];
      }, 1000);

      const seq = keySequenceRef.current.join(" ");
      if (seq === "G D") {
        router.push("/dashboard");
        keySequenceRef.current = [];
      } else if (seq === "G L") {
        router.push("/leads");
        keySequenceRef.current = [];
      } else if (seq === "G C") {
        router.push("/campaigns");
        keySequenceRef.current = [];
      } else if (seq === "G O") {
        router.push("/opportunities");
        keySequenceRef.current = [];
      } else if (seq === "G Q") {
        router.push("/quotations");
        keySequenceRef.current = [];
      } else if (seq === "G P") {
        router.push("/products");
        keySequenceRef.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#07090D] text-[#F5F7FA] font-sans">
      {/* ── Fixed Sidebar ── */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* ── Main Workspace ── */}
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          isSidebarCollapsed={isCollapsed}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
        <main
          className={cn(
            "flex-1 p-6 lg:p-8 xl:p-10 transition-all duration-200",
            isCollapsed ? "ml-[72px]" : "ml-[240px]"
          )}
        >
          <div className="max-w-[1600px] w-full mx-auto">{children}</div>
        </main>
      </div>

      {/* ── Global Fast Command Palette (⌘K) ── */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* ── Global Keyboard Shortcuts Dialog (?) ── */}
      <KeyboardShortcutsDialog isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
