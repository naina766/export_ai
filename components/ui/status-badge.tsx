"use client";
import React from "react";
import { cn } from "./index";

export type StandardStatus =
  | "RUNNING"
  | "COMPLETED"
  | "QUEUED"
  | "PENDING"
  | "FAILED"
  | "PAUSED"
  | "CANCELLED"
  | "SCHEDULED"
  | "SENT"
  | "REPLIED"
  | "VALID"
  | "INVALID"
  | "RISKY"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "VIEWED"
  | "NOT_CONTACTED"
  | "INTERESTED"
  | "NEGOTIATION"
  | "QUOTATION"
  | "WON"
  | string;

interface StatusStyle {
  label?: string;
  bg: string;
  text: string;
  dot: string;
  pulse?: boolean;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  RUNNING: {
    label: "Running",
    bg: "bg-[#10B981]/10 border-[#10B981]/25",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
    pulse: true,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  ACTIVE: {
    label: "Active",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  WON: {
    label: "Won",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  ACCEPTED: {
    label: "Accepted",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  VALID: {
    label: "Valid",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  HIGH: {
    label: "High Intent",
    bg: "bg-[#10B981]/10 border-[#10B981]/20",
    text: "text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  QUEUED: {
    label: "Queued",
    bg: "bg-[#6366F1]/10 border-[#6366F1]/20",
    text: "text-[#818cf8]",
    dot: "bg-[#6366F1]",
  },
  SENT: {
    label: "Sent",
    bg: "bg-[#6366F1]/10 border-[#6366F1]/20",
    text: "text-[#818cf8]",
    dot: "bg-[#6366F1]",
  },
  INTERESTED: {
    label: "Interested",
    bg: "bg-[#6366F1]/10 border-[#6366F1]/20",
    text: "text-[#818cf8]",
    dot: "bg-[#6366F1]",
  },
  REPLIED: {
    label: "Replied",
    bg: "bg-[#22D3EE]/10 border-[#22D3EE]/20",
    text: "text-[#22D3EE]",
    dot: "bg-[#22D3EE]",
  },
  VIEWED: {
    label: "Viewed",
    bg: "bg-[#22D3EE]/10 border-[#22D3EE]/20",
    text: "text-[#22D3EE]",
    dot: "bg-[#22D3EE]",
  },
  NEGOTIATION: {
    label: "Negotiation",
    bg: "bg-[#D97706]/10 border-[#D97706]/20",
    text: "text-[#D97706]",
    dot: "bg-[#D97706]",
  },
  QUOTATION: {
    label: "Quotation",
    bg: "bg-[#D97706]/10 border-[#D97706]/20",
    text: "text-[#D97706]",
    dot: "bg-[#D97706]",
  },
  PAUSED: {
    label: "Paused",
    bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  RISKY: {
    label: "Risky",
    bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-[#EF4444]/10 border-[#EF4444]/20",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  INVALID: {
    label: "Invalid",
    bg: "bg-[#EF4444]/10 border-[#EF4444]/20",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-[#EF4444]/10 border-[#EF4444]/20",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  },
  PENDING: {
    label: "Pending",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  },
  DRAFT: {
    label: "Draft",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#94A3B8]",
    dot: "bg-[#64748B]",
  },
  LOW: {
    label: "Low",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  },
  NOT_CONTACTED: {
    label: "Not Contacted",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  },
};

export function StatusBadge({
  status,
  className,
  customLabel,
}: {
  status: StandardStatus;
  className?: string;
  customLabel?: string;
}) {
  const norm = (status || "").toUpperCase();
  const conf = STATUS_CONFIG[norm] || {
    label: status || "Unknown",
    bg: "bg-white/[0.04] border-[rgba(148,163,184,0.12)]",
    text: "text-[#94A3B8]",
    dot: "bg-[#64748B]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium font-sans h-6 select-none",
        conf.bg,
        conf.text,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          conf.dot,
          conf.pulse && "animate-pulse"
        )}
      />
      <span>{customLabel || conf.label || status}</span>
    </span>
  );
}
