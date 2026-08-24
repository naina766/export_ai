"use client";
import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Terminal,
  Activity,
  Check,
  RotateCw,
} from "lucide-react";
import { StatusBadge, cn } from "@/components/ui";

export interface LogEntry {
  id: string;
  time: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
}

export interface PipelineStage {
  id: string;
  stepNum: string;
  label: string;
  status: "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED";
  count?: number;
}

export function DiscoveryExecutionLog({
  stages,
  logs,
  progress = 78,
  totalRecords = 550,
  processedRecords = 428,
  elapsedTime = "42s",
}: {
  stages: PipelineStage[];
  logs: LogEntry[];
  progress?: number;
  totalRecords?: number;
  processedRecords?: number;
  elapsedTime?: string;
}) {
  const [filter, setFilter] = useState<"ALL" | "INFO" | "SUCCESS" | "WARNING" | "ERROR">("ALL");

  const getSeverityStyle = (s: LogEntry["severity"]) => {
    if (s === "SUCCESS") return "text-emerald-400 font-semibold";
    if (s === "WARNING") return "text-amber-400 font-semibold";
    if (s === "ERROR") return "text-red-400 font-semibold";
    return "text-indigo-400 font-semibold";
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    return log.severity === filter;
  });

  return (
    <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-5 lg:p-6 space-y-6 font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-wider uppercase text-[#F8FAFC]">LIVE DISCOVERY</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            RUNNING
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">Elapsed: {elapsedTime}</span>
      </div>

      {/* ── 5-Step Pipeline (Consistent Row Heights py-3.5 px-4) ── */}
      <div className="space-y-2">
        {stages.map((stage) => {
          const isDone = stage.status === "COMPLETED";
          const isRunning = stage.status === "RUNNING";

          return (
            <div
              key={stage.id}
              className={cn(
                "py-3.5 px-4 rounded-lg border flex items-center justify-between transition-colors min-h-[52px]",
                isRunning
                  ? "bg-[#6366F1]/10 border-[#6366F1]/40 text-[#F8FAFC]"
                  : isDone
                  ? "bg-[#22C55E]/5 border-[#22C55E]/20 text-[#F8FAFC]"
                  : "bg-[#0A0D13] border-white/[0.06] text-slate-400 opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 font-semibold">{stage.stepNum}</span>
                <span className="text-sm font-medium">{stage.label}</span>
              </div>

              <div className="flex items-center gap-3">
                {typeof stage.count === "number" && (
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {stage.count} leads
                  </span>
                )}
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center text-xs">
                    ✓
                  </span>
                ) : isRunning ? (
                  <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-ping" />
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Progress Bar ── */}
      <div className="space-y-2 p-4 rounded-lg bg-[#0A0D13] border border-white/[0.06]">
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            AI Qualification Pipeline
          </span>
          <span className="text-[#F8FAFC] font-semibold tabular-nums">
            {progress}% • {processedRecords}/{totalRecords}
          </span>
        </div>
        <div className="w-full h-2 bg-[#05070B] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Developer-Console Live Log ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            {(["ALL", "INFO", "SUCCESS", "WARNING", "ERROR"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors",
                  filter === f
                    ? "bg-white/[0.1] text-white font-semibold"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-slate-500">AUTOSCROLL</span>
        </div>

        <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.08] max-h-52 overflow-y-auto font-mono text-sm space-y-2 leading-6">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <span className="text-slate-600 text-xs select-none flex-shrink-0 mt-0.5">{log.time}</span>
              <span className={cn("text-xs uppercase w-16 select-none flex-shrink-0 mt-0.5", getSeverityStyle(log.severity))}>
                {log.severity}
              </span>
              <span className="text-slate-300 text-sm flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
