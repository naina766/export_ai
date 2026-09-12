"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  DollarSign,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Building2,
  TrendingUp,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Filter,
} from "lucide-react";
import {
  MetricCard,
  Button,
  Badge,
  CountryBadge,
  PageHeader,
  DetailSheet,
  Tabs,
  ActivityTimeline,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

const STAGES = [
  { id: "PROSPECTING", label: "Discovered" },
  { id: "VALIDATED", label: "Validated" },
  { id: "QUALIFIED", label: "AI Qualified" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "INTERESTED", label: "Interested" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "QUOTATION", label: "Quotation" },
  { id: "CLOSED_WON", label: "Won" },
];

interface Opportunity {
  id: string;
  title: string;
  stage: string;
  inquiryValue: number | null;
  currency: string;
  quantity: number | null;
  terms: string;
  productName?: string;
  daysInStage?: number;
  lastActivity?: string;
  lead: {
    id: string;
    companyName: string;
    contactPerson?: string | null;
    email?: string;
    country: string;
    leadScore?: number;
    website?: string | null;
  };
  quotations?: { id: string; quotationNumber: string; total: number; status: string }[];
}

const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    title: "Sound Immersion LLC",
    stage: "NEGOTIATION",
    inquiryValue: 8200,
    currency: "USD",
    quantity: 40,
    terms: "FOB",
    productName: "7-Chakra Tuned Harmonic Sets",
    daysInStage: 2,
    lastActivity: "2h ago",
    lead: {
      id: "lead-1",
      companyName: "Sound Immersion LLC",
      contactPerson: "David Miller",
      email: "david@soundimmersion.com",
      country: "USA",
      leadScore: 94,
      website: "soundimmersion.com",
    },
    quotations: [{ id: "q-1", quotationNumber: "EXP-2026-000001", total: 8200, status: "SENT" }],
  },
  {
    id: "opp-2",
    title: "Klangschalen Zentrum",
    stage: "QUOTATION",
    inquiryValue: 14200,
    currency: "USD",
    quantity: 60,
    terms: "CIF Hamburg",
    productName: "Tibetan Master Hand-Hammered Singing Bowls",
    daysInStage: 3,
    lastActivity: "45m ago",
    lead: {
      id: "lead-2",
      companyName: "Klangschalen Zentrum München",
      contactPerson: "Helga Schmidt",
      email: "einkauf@klang-zentrum.de",
      country: "Germany",
      leadScore: 92,
      website: "klang-zentrum.de",
    },
    quotations: [{ id: "q-2", quotationNumber: "EXP-2026-000002", total: 14200, status: "DRAFT" }],
  },
  {
    id: "opp-3",
    title: "Prana Wellness Guild",
    stage: "INTERESTED",
    inquiryValue: 6400,
    currency: "USD",
    quantity: 30,
    terms: "FOB",
    productName: "Full Moon Energized Meditation Bowls",
    daysInStage: 4,
    lastActivity: "1d ago",
    lead: {
      id: "lead-3",
      companyName: "Prana Wellness Guild",
      contactPerson: "Sarah Jenkins",
      email: "orders@pranawellness.co.uk",
      country: "UK",
      leadScore: 88,
      website: "pranawellness.co.uk",
    },
  },
  {
    id: "opp-4",
    title: "Zen Sound Retreats",
    stage: "CONTACTED",
    inquiryValue: 4800,
    currency: "USD",
    quantity: 20,
    terms: "FOB",
    productName: "Crystal Quartz Tuning Sets",
    daysInStage: 1,
    lastActivity: "3h ago",
    lead: {
      id: "lead-4",
      companyName: "Zen Sound Retreats",
      contactPerson: "Liam Wong",
      email: "liam@zensound.ca",
      country: "Canada",
      leadScore: 85,
    },
  },
  {
    id: "opp-5",
    title: "Melbourne Holistic Spa",
    stage: "CLOSED_WON",
    inquiryValue: 15000,
    currency: "USD",
    quantity: 80,
    terms: "CIF Melbourne",
    productName: "7-Metal Master Singing Bowls (Grade AAA)",
    daysInStage: 12,
    lastActivity: "4d ago",
    lead: {
      id: "lead-5",
      companyName: "Melbourne Holistic Spa",
      contactPerson: "Chloe Taylor",
      email: "procurement@melbournespa.com.au",
      country: "Australia",
      leadScore: 96,
    },
  },
];

export default function OpportunitiesKanbanPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(SAMPLE_OPPORTUNITIES);
  const [filter, setFilter] = useState<"ALL" | "HIGH_VALUE" | "HIGH_INTENT" | "STALE" | "FOLLOWUP">("ALL");
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedMobileStage, setSelectedMobileStage] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch("/api/opportunities");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setOpportunities(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedId) return;

    const oppId = draggedId;
    // Optimistic UI Update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: stageId, daysInStage: 0 } : o))
    );
    setDragOverStage(null);
    setDraggedId(null);
    toast.success(`Opportunity moved to ${STAGES.find((s) => s.id === stageId)?.label}`);

    try {
      await fetch("/api/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: oppId, stage: stageId }),
      });
    } catch {
      // ignore network errors
    }
  };

  const filteredOpportunities = opportunities.filter((o) => {
    if (filter === "HIGH_VALUE") return (o.inquiryValue || 0) >= 10000;
    if (filter === "HIGH_INTENT") return (o.lead.leadScore || 0) >= 90;
    if (filter === "STALE") return (o.daysInStage || 0) >= 5;
    if (filter === "FOLLOWUP") return o.stage === "NEGOTIATION" || o.stage === "QUOTATION";
    return true;
  });

  const totalPipeline = opportunities.reduce((sum, o) => sum + (Number(o.inquiryValue) || 0), 0);
  const weightedPipeline = Math.round(totalPipeline * 0.64);
  const averageDeal = Math.round(totalPipeline / (opportunities.length || 1));

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <PageHeader
        title="Sales Pipeline & Export Deals"
        subtitle="Manage negotiation stages, wholesale inquiry volumes, container terms, and quotation conversions."
        actions={
          <Link href="/quotations/new">
            <Button variant="primary" size="md" leftIcon={<Receipt className="w-4 h-4" />}>
              Create Quotation
            </Button>
          </Link>
        }
      />

      {/* ── CONTINUOUS KPI STRIP ── */}
      <div className="rounded-xl bg-[#0B0F14] border border-[rgba(255,255,255,0.08)] p-6 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(255,255,255,0.08)] gap-6 lg:gap-0">
        <div className="lg:px-6 first:pl-0 space-y-2">
          <span className="text-sm font-medium text-[#A1AAB8] block">Total Pipeline</span>
          <div className="text-3xl font-bold tracking-tight text-[#F8FAFC] font-mono tabular-nums">${(totalPipeline || 48600).toLocaleString()}</div>
          <span className="text-sm font-mono text-[#10B981] flex items-center gap-1">+19.4% this quarter</span>
        </div>
        <div className="lg:px-6 pt-4 lg:pt-0 space-y-2">
          <span className="text-sm font-medium text-[#A1AAB8] block">Weighted Pipeline</span>
          <div className="text-3xl font-bold tracking-tight text-[#F8FAFC] font-mono tabular-nums">${(weightedPipeline || 31200).toLocaleString()}</div>
          <span className="text-sm font-mono text-[#10B981] flex items-center gap-1">64% expected probability</span>
        </div>
        <div className="lg:px-6 pt-4 lg:pt-0 space-y-2">
          <span className="text-sm font-medium text-[#A1AAB8] block">Win Rate</span>
          <div className="text-3xl font-bold tracking-tight text-[#F8FAFC] font-mono tabular-nums">24.2%</div>
          <span className="text-sm font-mono text-[#10B981] flex items-center gap-1">+2.4% conversion</span>
        </div>
        <div className="lg:px-6 last:pr-0 pt-4 lg:pt-0 space-y-2">
          <span className="text-sm font-medium text-[#A1AAB8] block">Average Order</span>
          <div className="text-3xl font-bold tracking-tight text-[#F8FAFC] font-mono tabular-nums">${(averageDeal || 8100).toLocaleString()}</div>
          <span className="text-sm font-mono text-[#10B981] flex items-center gap-1">FOB/CIF AOV</span>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        {[
          { key: "ALL", label: "All Opportunities" },
          { key: "HIGH_VALUE", label: "High Value ($10K+)" },
          { key: "HIGH_INTENT", label: "High Intent (AI 90+)" },
          { key: "STALE", label: "Stale Deals (5d+ in stage)" },
          { key: "FOLLOWUP", label: "Needs Follow-up" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap",
              filter === f.key
                ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50"
                : "bg-[#0B0F14] text-[#737D8C] border-[rgba(255,255,255,0.08)] hover:text-[#F8FAFC] hover:border-[rgba(255,255,255,0.15)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── MOBILE STAGE SELECTOR (Prevents cramped 8-columns on small screens) ── */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-slate-400 shrink-0">View Stage:</span>
        <button
          type="button"
          onClick={() => setSelectedMobileStage("ALL")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-mono border whitespace-nowrap",
            selectedMobileStage === "ALL"
              ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50"
              : "bg-[#0B0F14] text-slate-400 border-white/[0.08]"
          )}
        >
          All Stages
        </button>
        {STAGES.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedMobileStage(st.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-mono border whitespace-nowrap",
              selectedMobileStage === st.id
                ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50 font-semibold"
                : "bg-[#0B0F14] text-slate-400 border-white/[0.08]"
            )}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ── 8-STAGE KANBAN BOARD ── */}
      <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin">
        {STAGES.filter((st) => selectedMobileStage === "ALL" || st.id === selectedMobileStage).map((stage) => {
          const stageDeals = filteredOpportunities.filter((o) => o.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, o) => sum + (Number(o.inquiryValue) || 0), 0);
          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDrop={() => handleDrop(stage.id)}
              className={cn(
                "w-80 flex-shrink-0 rounded-xl bg-[#0B0F14] border transition-colors p-4 flex flex-col justify-between",
                isOver ? "border-[#6366F1] bg-[#10151C]" : "border-white/[0.08]"
              )}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="text-sm font-semibold text-[#F8FAFC]">{stage.label}</span>
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-md bg-[#10151C] text-slate-300 border border-white/[0.06]">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-2 mb-4">
                  ${stageTotal.toLocaleString()}
                </div>

                {/* Deal Cards List */}
                <div className="space-y-3 min-h-[160px]">
                  {stageDeals.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500 rounded-lg border border-dashed border-white/[0.08]">
                      Drag deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onClick={() => setActiveOpportunity(deal)}
                        className="p-4 rounded-lg bg-[#10151C] border border-white/[0.08] hover:border-[#6366F1]/50 transition-colors space-y-3 cursor-grab active:cursor-grabbing shadow-xs"
                      >
                        {/* Company & Country */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#F8FAFC] line-clamp-1">{deal.lead.companyName}</p>
                            <span className="text-xs text-slate-400">{deal.lead.country}</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                            AI {deal.lead.leadScore || 90}
                          </span>
                        </div>

                        {/* Product */}
                        <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed">
                          {deal.productName || "7-Chakra Tuned Sets"}
                        </p>

                        {/* Financials & Stage Telemetry */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08] text-sm">
                          <span className="font-mono font-semibold text-[#F8FAFC]">
                            ${Number(deal.inquiryValue || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {deal.daysInStage || 2}d in stage
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Add */}
              <div className="pt-3 mt-3 border-t border-white/[0.08]">
                <Link
                  href={`/quotations/new?stage=${stage.id}`}
                  className="w-full text-center py-2 rounded-lg border border-dashed border-white/[0.08] hover:border-[#6366F1] text-xs font-mono text-slate-400 hover:text-[#F8FAFC] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Deal
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          OPPORTUNITY DETAIL DRAWER
      ═══════════════════════════════════════════════════════════════════════ */}
      <DetailSheet
        isOpen={!!activeOpportunity}
        onClose={() => setActiveOpportunity(null)}
        title={activeOpportunity?.lead.companyName || "Deal Overview"}
        subtitle={activeOpportunity ? `${activeOpportunity.lead.country} • Stage: ${activeOpportunity.stage}` : undefined}
      >
        {activeOpportunity && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] text-center">
                <span className="text-xs text-slate-400 uppercase font-mono block">Deal Value</span>
                <span className="text-xl font-bold font-mono text-[#10B981] mt-0.5 block">
                  ${Number(activeOpportunity.inquiryValue || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] text-center">
                <span className="text-xs text-slate-400 uppercase font-mono block">AI Fit Score</span>
                <span className="text-xl font-bold font-mono text-[#6366F1] mt-0.5 block">
                  {activeOpportunity.lead.leadScore || 92} / 100
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] text-center">
                <span className="text-xs text-slate-400 uppercase font-mono block">Days in Stage</span>
                <span className="text-xl font-bold font-mono text-[#F8FAFC] mt-0.5 block">
                  {activeOpportunity.daysInStage || 2}d
                </span>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div className="p-5 rounded-lg bg-[#111827] border border-[#6366F1]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" /> Recommended Next Action
                </h4>
                <span className="text-xs font-mono text-[#10B981] font-semibold">94% Confidence</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                &ldquo;Follow up within 24 hours and include CIF Hamburg pricing with 432Hz tuning frequency certificate.&rdquo;
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Link href="/follow-ups" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Create Follow-up
                  </Button>
                </Link>
                <Link href={`/quotations/new?leadId=${activeOpportunity.lead.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full" leftIcon={<Receipt className="w-3.5 h-3.5 text-[#22D3EE]" />}>
                    Create Quotation
                  </Button>
                </Link>
              </div>
            </div>

            {/* Product & Commercial Information */}
            <div className="p-5 rounded-lg bg-[#0D121C] border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider font-mono">Product & Terms</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Product Interest</span>
                  <span className="text-[#F8FAFC] font-medium">{activeOpportunity.productName || "7-Chakra Tuned Sets"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Trade Term</span>
                  <span className="text-[#F8FAFC] font-mono font-medium">{activeOpportunity.terms}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Contact Person</span>
                  <span className="text-[#F8FAFC]">{activeOpportunity.lead.contactPerson || "Procurement Director"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Email</span>
                  <span className="text-[#F8FAFC] font-mono text-xs">{activeOpportunity.lead.email}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-5 rounded-lg bg-[#0D121C] border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider font-mono">Activity History</h4>
              <ActivityTimeline
                items={[
                  {
                    id: "act-1",
                    title: "Opportunity Created",
                    description: `Opened deal value of $${Number(activeOpportunity.inquiryValue || 0).toLocaleString()}`,
                    type: "DEAL",
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "act-2",
                    title: "Quotation EXP-2026-000001 Dispatched",
                    description: "Commercial FOB/CIF proforma invoice sent via Gmail",
                    type: "QUOTATION",
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
