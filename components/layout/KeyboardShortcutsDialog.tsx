"use client";
import React from "react";
import { Command, X, Keyboard } from "lucide-react";
import { Modal } from "@/components/ui";

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigationShortcuts = [
    { key: "G D", description: "Go to Dashboard Overview" },
    { key: "G L", description: "Go to Buyer Leads CRM" },
    { key: "G C", description: "Go to Outreach Campaigns" },
    { key: "G O", description: "Go to Sales Pipeline Kanban" },
    { key: "G Q", description: "Go to Commercial Quotations" },
    { key: "G P", description: "Go to Products Catalog" },
  ];

  const actionShortcuts = [
    { key: "⌘ / Ctrl + K", description: "Open Command Palette" },
    { key: "/", description: "Focus active table/workspace search" },
    { key: "N", description: "Create contextual new record" },
    { key: "?", description: "Toggle keyboard shortcuts helper" },
    { key: "ESC", description: "Close active drawer, modal, or popover" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Power-user fast navigation and workspace actions."
      size="md"
    >
      <div className="space-y-5 text-sm font-sans">
        {/* Navigation Group */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            WORKSPACE NAVIGATION
          </span>
          <div className="grid grid-cols-1 gap-2">
            {navigationShortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#07090D] border border-white/[0.06]"
              >
                <span className="text-slate-300 text-sm">{s.description}</span>
                <kbd className="px-2.5 py-1 rounded bg-[#10151C] border border-white/[0.12] text-xs font-mono text-[#F5F7FA]">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Group */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            ACTIONS & CONTROLS
          </span>
          <div className="grid grid-cols-1 gap-2">
            {actionShortcuts.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#07090D] border border-white/[0.06]"
              >
                <span className="text-slate-300 text-sm">{s.description}</span>
                <kbd className="px-2.5 py-1 rounded bg-[#10151C] border border-white/[0.12] text-xs font-mono text-[#F5F7FA]">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
