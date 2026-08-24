"use client";
import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "./index";

export function MetricTooltip({
  title,
  content,
  children,
  className,
}: {
  title?: string;
  content: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn("relative inline-flex items-center group cursor-help select-none", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
      role="tooltip"
    >
      {children || <Info className="w-3.5 h-3.5 text-[#64748B] hover:text-[#94A3B8] transition-colors" />}

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#0A0D13] border border-white/[0.12] shadow-xl text-xs text-[#F8FAFC] z-50 animate-fade-in pointer-events-none font-sans">
          {title && <span className="font-semibold text-[#818cf8] block mb-0.5">{title}</span>}
          <span className="text-slate-300 leading-relaxed block">{content}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0A0D13]" />
        </div>
      )}
    </div>
  );
}
