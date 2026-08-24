"use client";
import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "./index";
import { cn } from "./index";

export interface NextBestActionProps {
  action: string;
  reason: string;
  confidence: number;
  priority?: "HIGH" | "MEDIUM" | "URGENT";
  variant?: "full" | "compact" | "drawer";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function NextBestAction({
  action,
  reason,
  confidence,
  priority = "HIGH",
  variant = "full",
  actionLabel = "Take Action",
  onAction,
  className,
}: NextBestActionProps) {
  if (variant === "compact") {
    return (
      <div
        onClick={onAction}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 hover:border-[#6366F1]/50 cursor-pointer transition-colors text-xs group",
          className
        )}
        title={reason}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] flex-shrink-0" />
        <span className="text-[#F8FAFC] font-medium truncate max-w-[200px]">{action}</span>
        <span className="text-[#10B981] font-mono font-bold text-xs">{confidence}%</span>
        <ArrowRight className="w-3 h-3 text-[#6366F1] group-hover:translate-x-0.5 transition-transform" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-[#0F141D] border border-[#6366F1]/30 relative overflow-hidden space-y-3",
        variant === "drawer" ? "bg-[#0A0D13] border-[#6366F1]/40" : "",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center text-[#818cf8]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-bold text-[#818cf8] uppercase tracking-wider">
            AI NEXT BEST ACTION
          </span>
        </div>

        <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded border border-[#10B981]/20 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> {confidence}% confidence
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">{action}</h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="text-slate-400 font-medium">Why: </span>
          {reason}
        </p>
      </div>

      {onAction && (
        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">Decision support active</span>
          <Button
            variant="bronze"
            size="sm"
            onClick={onAction}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
