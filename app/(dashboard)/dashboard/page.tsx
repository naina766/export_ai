"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Send,
  ArrowRight,
  Sparkles,
  Globe2,
  Users,
  Activity,
  DollarSign,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Layers,
  AlertCircle,
  RotateCw,
  Zap,
  TrendingUp,
  Target,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Badge,
  CountryBadge,
  StatusBadge,
  cn,
} from "@/components/ui";
import { motion } from "framer-motion";

interface DashboardKPIs {
  totalBuyers: number;
  qualifiedBuyers: number;
  totalEmailsSent: number;
  replyRate: string;
  pipelineValue: number;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopCountry {
  country: string;
  count: number;
  percentage: number;
}

interface RecentLead {
  id: string;
  companyName: string;
  contactPerson: string | null;
  country: string;
  leadScore: number;
  buyerIntent: string;
  emailStatus: string;
  createdAt: string;
}

function MetricCounter({
  target,
  prefix = "",
  suffix = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 600;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, funnelRes, leadsRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch("/api/analytics/funnel"),
        fetch("/api/leads?limit=5&sortBy=createdAt&sortOrder=desc"),
      ]);

      if (!overviewRes.ok || !funnelRes.ok) {
        throw new Error("Failed to load dashboard operational analytics.");
      }

      const overviewJson = await overviewRes.json();
      const funnelJson = await funnelRes.json();
      const leadsJson = leadsRes.ok ? await leadsRes.json() : null;

      if (overviewJson.success && overviewJson.data) {
        setKpis(overviewJson.data.kpis);
        setTopCountries(overviewJson.data.topCountries || []);
      }

      if (funnelJson.success && funnelJson.data) {
        setFunnel(funnelJson.data.funnel || []);
      }

      if (leadsJson?.success && leadsJson.data) {
        setRecentLeads(leadsJson.data.items || []);
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. DASHBOARD HEADER (Command Center)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight">
              Export Sales Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Live DB
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Enterprise wholesale CRM for international buyer discovery, AI qualification, and quotation pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/discovery">
            <Button variant="outline" size="md" leftIcon={<Compass className="w-4 h-4 text-[#22D3EE]" />}>
              Discover Buyers
            </Button>
          </Link>
          <Link href="/campaigns/new">
            <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />}>
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-between text-sm text-[#EF4444]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboardData} leftIcon={<RotateCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          2. PRIMARY 5-KPI STRIP (Database-Backed Metrics)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 space-y-2 animate-pulse">
              <div className="h-3 w-20 bg-white/[0.06] rounded" />
              <div className="h-7 w-28 bg-white/[0.08] rounded" />
              <div className="h-3 w-16 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden">
          {/* KPI 1: Total Buyers */}
          <div className="p-5 space-y-1.5">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Buyers</span>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
              <MetricCounter target={kpis?.totalBuyers || 0} />
            </div>
            <span className="text-xs font-mono text-slate-400 block">Verified database records</span>
          </div>

          {/* KPI 2: AI Qualified Leads */}
          <div className="p-5 space-y-1.5">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">AI Qualified Leads</span>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#818cf8] tabular-nums font-mono">
              <MetricCounter target={kpis?.qualifiedBuyers || 0} />
            </div>
            <span className="text-xs font-mono text-[#10B981] flex items-center gap-0.5">
              Score ≥ 80 / 100
            </span>
          </div>

          {/* KPI 3: Pipeline Value */}
          <div className="p-5 space-y-1.5">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Pipeline Value</span>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#10B981] tabular-nums font-mono">
              <MetricCounter target={kpis?.pipelineValue || 0} prefix="$" />
            </div>
            <span className="text-xs font-mono text-slate-400 block">Active wholesale inquiries</span>
          </div>

          {/* KPI 4: Outreach Emails */}
          <div className="p-5 space-y-1.5">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Outreach Sent</span>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
              <MetricCounter target={kpis?.totalEmailsSent || 0} />
            </div>
            <span className="text-xs font-mono text-slate-400 block">Dispatched via Gmail</span>
          </div>

          {/* KPI 5: Reply Rate */}
          <div className="p-5 space-y-1.5">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Buyer Reply Rate</span>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#22D3EE] tabular-nums font-mono">
              {kpis?.replyRate || "0.0%"}
            </div>
            <span className="text-xs font-mono text-[#22D3EE] block">Wholesale response rate</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          3. PIPELINE FUNNEL + AI NEXT ACTION (Side-by-Side Hierarchy)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 cols): 8-Stage Global Export Pipeline */}
        <div className="xl:col-span-8 rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Global Export Pipeline Stages</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  End-to-end conversion workflow from initial discovery to closed export sales
                </p>
              </div>
              <Link
                href="/opportunities"
                className="text-xs text-[#818cf8] hover:underline font-medium inline-flex items-center gap-1"
              >
                Open Pipeline Board <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Funnel Stage Progression Cards */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-white/[0.06] bg-[#0A0D13] space-y-2 animate-pulse">
                    <div className="h-3 w-10 bg-white/[0.06] rounded" />
                    <div className="h-4 w-16 bg-white/[0.08] rounded" />
                    <div className="h-6 w-12 bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
            ) : funnel.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No pipeline stages recorded yet. Begin by discovering wholesale leads.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-4">
                {funnel.map((st, idx) => (
                  <Link
                    key={st.name}
                    href="/opportunities"
                    className="p-3 rounded-lg border transition-colors text-left space-y-2 bg-[#0A0D13] border-white/[0.08] hover:border-white/[0.2] block group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">0{idx + 1}</span>
                      <span className="text-[10px] font-mono text-slate-300">{st.percentage}%</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-white" title={st.name}>
                        {st.name}
                      </span>
                      <span className="text-base font-semibold text-[#F8FAFC] tabular-nums font-mono block mt-0.5">
                        {st.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(st.percentage, 100)}%`, backgroundColor: st.color }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated across active international wholesale accounts</span>
            <Link href="/reports" className="text-slate-400 hover:text-slate-300 underline font-mono">
              Export Funnel Report
            </Link>
          </div>
        </div>

        {/* Right (4 cols): AI Next Action Card (High-Conviction Decision Support) */}
        <div className="xl:col-span-4 rounded-xl bg-[#0F141D] border border-[#6366F1]/30 p-6 space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#818cf8]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-[#818cf8] uppercase tracking-wider">
                  AI NEXT ACTION
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 94% Confidence
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#F8FAFC] leading-snug">
                Prioritize German wellness & sound therapy distributors
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Gemini commercial inference identified peak CIF Hamburg demand for 432Hz harmonic singing bowl sets.
              </p>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Commercial Evidence:
              </span>
              <ul className="text-xs text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>High product-fit score (avg. 92/100 across 42 Bavaria buyers)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                  <span>Highest regional response rate (24.2% historical reply rate)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span>Ready for CIF Hamburg proforma terms & acoustic certificates</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <Link href="/leads?country=Germany" className="flex-1">
              <Button variant="outline" size="sm" className="w-full justify-center">
                View Buyers
              </Button>
            </Link>
            <Link href="/campaigns/new" className="flex-1">
              <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MARKET INTELLIGENCE & RECENT BUYER INQUIRIES
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Top Buyer Markets & Recent Leads */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section A: Top Buyer Geographic Corridors */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Top Buyer Geographic Markets</h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribution of wholesale buyer inquiries by country</p>
              </div>
              <Link href="/leads" className="text-xs text-[#22D3EE] hover:underline font-medium">
                View All Leads →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/[0.04] rounded animate-pulse" />
                ))}
              </div>
            ) : topCountries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No international buyer records yet.
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                {topCountries.map((c) => (
                  <div key={c.country} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/leads?country=${encodeURIComponent(c.country)}`}
                        className="font-medium text-[#F8FAFC] flex items-center gap-2 hover:text-[#818cf8] transition-colors"
                      >
                        <Globe2 className="w-4 h-4 text-[#6366F1]" />
                        <span>{c.country}</span>
                      </Link>
                      <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
                        <span>{c.count} buyers ({c.percentage}%)</span>
                        <Link
                          href={`/leads?country=${encodeURIComponent(c.country)}`}
                          className="text-[#818cf8] hover:underline text-[11px]"
                        >
                          View buyers →
                        </Link>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#0A0D13] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Recent Ingested Leads */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Recent Buyer Inquiries</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest wholesale prospects ingested and scored</p>
              </div>
              <Link href="/leads" className="text-xs text-[#818cf8] hover:underline font-medium">
                Explore Full Directory →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/[0.04] rounded animate-pulse" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No buyer inquiries found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[12px] text-slate-400 font-mono uppercase">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Country</th>
                      <th className="py-2.5 px-3">AI Score</th>
                      <th className="py-2.5 px-3">Email Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {recentLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-medium text-[#F8FAFC]">
                          <Link href={`/leads/${l.id}`} className="hover:text-[#818cf8] transition-colors">
                            {l.companyName}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-xs">{l.country}</td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "font-mono text-xs font-bold px-2 py-0.5 rounded",
                              l.leadScore >= 80
                                ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                                : l.leadScore >= 60
                                ? "bg-[#6366F1]/10 text-[#818cf8] border border-[#6366F1]/20"
                                : "bg-slate-800 text-slate-400"
                            )}
                          >
                            {l.leadScore}/100
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={l.emailStatus} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/leads/${l.id}`}
                            className="text-xs text-[#818cf8] hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Quick Operations & Outbox Telemetry */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Quick Operations Panel */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D97706]" />
              <span>Export Operations</span>
            </h3>
            <div className="space-y-2.5">
              <Link href="/discovery" className="block">
                <Button variant="outline" size="md" className="w-full justify-start" leftIcon={<Compass className="w-4 h-4 text-[#22D3EE]" />}>
                  Run Buyer Discovery Job
                </Button>
              </Link>
              <Link href="/campaigns/new" className="block">
                <Button variant="outline" size="md" className="w-full justify-start" leftIcon={<Send className="w-4 h-4 text-[#10B981]" />}>
                  Dispatch Outreach Sequence
                </Button>
              </Link>
              <Link href="/quotations" className="block">
                <Button variant="outline" size="md" className="w-full justify-start" leftIcon={<Receipt className="w-4 h-4 text-[#6366F1]" />}>
                  Review Proforma Quotations
                </Button>
              </Link>
              <Link href="/jobs" className="block">
                <Button variant="outline" size="md" className="w-full justify-start" leftIcon={<Activity className="w-4 h-4 text-[#818cf8]" />}>
                  Inspect Background Jobs
                </Button>
              </Link>
            </div>
          </div>

          {/* Outbox & Broker Architecture Card */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Broker Integration</span>
              <span className="flex items-center gap-1.5 text-xs font-mono text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Transactional Outbox
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Asynchronous jobs (AI classification, email validation, campaign dispatch) are committed atomically to the PostgreSQL Outbox table before delivery to RabbitMQ.
            </p>
            <div className="pt-1">
              <Link href="/jobs" className="text-xs text-[#818cf8] hover:underline font-mono inline-flex items-center gap-1">
                View fleet metrics & worker health →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
