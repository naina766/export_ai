"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Download, Tag, CheckSquare, Trash2, UserPlus } from "lucide-react";
import { Button, cn } from "./index";

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "bronze" | "danger" | "ghost";
  onClick: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  actions = [],
  className,
}: {
  selectedCount: number;
  onClear: () => void;
  actions?: BulkAction[];
  className?: string;
}) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#151B23] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md font-sans",
            className
          )}
        >
          {/* Selected Counter */}
          <div className="flex items-center gap-2 pr-3 border-r border-[rgba(255,255,255,0.08)]">
            <span className="w-5 h-5 rounded bg-[#6366F1] text-white text-xs font-mono font-bold flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-[#F5F7FA]">selected</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {actions.map((act, i) => (
              <Button
                key={i}
                variant={act.variant || "secondary"}
                size="xs"
                onClick={act.onClick}
                leftIcon={act.icon}
              >
                {act.label}
              </Button>
            ))}
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-md text-[#667085] hover:text-[#F5F7FA] hover:bg-white/[0.06] transition-colors ml-1"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
