"use client";
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MetricTooltip } from "@/components/ui/metric-tooltip";
import { cn } from "@/components/ui";

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
  accent?: "default" | "indigo" | "emerald" | "bronze" | "cyan";
}

export function KPIBar({
  metrics,
  className,
}: {
  metrics: KPIMetric[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.06)] rounded-xl bg-[#0B0F14] border border-[rgba(255,255,255,0.07)] p-2 font-sans",
        className
      )}
    >
      {metrics.map((m) => {
        const isUp = m.trend === "up";
        const isDown = m.trend === "down";

        return (
          <div key={m.id} className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#98A2B3] flex items-center gap-2">
                {m.label}
                {m.tooltip && <MetricTooltip content={m.tooltip} />}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums",
                  m.accent === "indigo" && "text-[#818cf8]",
                  m.accent === "emerald" && "text-[#10B981]",
                  m.accent === "bronze" && "text-[#D97706]",
                  m.accent === "cyan" && "text-[#22D3EE]",
                  (!m.accent || m.accent === "default") && "text-[#F5F7FA]"
                )}
              >
                {m.value}
              </span>

              {m.change && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-mono font-medium",
                    isUp ? "text-[#10B981]" : isDown ? "text-[#EF4444]" : "text-[#667085]"
                  )}
                >
                  {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                  {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                  {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                  <span>{m.change}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
