"use client";
import React from "react";
import { CheckCircle2, Cpu, Database, Server, Radio, Zap, ShieldCheck } from "lucide-react";
import { StatusBadge, cn } from "@/components/ui";

export function SystemHealthPopover({
  isOpen,
  onClose,
  activeJobs = 3,
  qualifiedBuyers = 86,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeJobs?: number;
  qualifiedBuyers?: number;
}) {
  if (!isOpen) return null;

  const services = [
    { name: "Next.js Core API", status: "RUNNING", detail: "HTTP 200 OK • <45ms" },
    { name: "PostgreSQL Database", status: "COMPLETED", detail: "Prisma ORM • Connected" },
    { name: "RabbitMQ Message Broker", status: "RUNNING", detail: "AMQP Stream Active" },
    { name: "Discovery Worker", status: "RUNNING", detail: "Registry Crawler Active" },
    { name: "Gemini AI Inference Worker", status: "RUNNING", detail: "Flash 1.5 Scoring Queue" },
    { name: "Gmail Dispatch Worker", status: "COMPLETED", detail: "OAuth2 Token Valid" },
  ];

  const queues = [
    { name: "discovery.jobs", count: activeJobs, status: "RUNNING" },
    { name: "lead.validation", count: 4, status: "RUNNING" },
    { name: "ai.scoring", count: 8, status: "RUNNING" },
    { name: "email.outreach", count: 2, status: "COMPLETED" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-6 top-16 w-80 sm:w-96 bg-[#0B0F14] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl p-4 space-y-4 z-50 animate-fade-in font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs font-bold text-[#F5F7FA]">System Operations Health</span>
          </div>
          <StatusBadge status="ACTIVE" customLabel="All Systems Nominal" />
        </div>

        {/* Services List */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            CORE SERVICES & WORKERS
          </span>
          <div className="space-y-1.5">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between p-2 rounded-lg bg-[#07090D] border border-white/[0.05] text-xs"
              >
                <div>
                  <span className="font-semibold text-[#F5F7FA] block">{svc.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{svc.detail}</span>
                </div>
                <StatusBadge status={svc.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Queues List */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            ACTIVE RABBITMQ QUEUES
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {queues.map((q) => (
              <div
                key={q.name}
                className="p-2.5 rounded-lg bg-[#10151C] border border-white/[0.05] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 truncate">{q.name}</span>
                  <span className="font-bold text-[#F5F7FA] tabular-nums">{q.count}</span>
                </div>
                <span className="text-xs text-[#10B981] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
