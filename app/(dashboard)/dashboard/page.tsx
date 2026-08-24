"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Send,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Globe2,
  Users,
  Activity,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Plus,
  Zap,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Layers,
} from "lucide-react";
import {
  Button,
  Badge,
  CountryBadge,
  StatusBadge,
  cn,
} from "@/components/ui";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

// ── Tabular KPI Animated Counter ──
function MetricCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const stepTime = 25;
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

// ── 8-Stage Connected Operational Pipeline ──
const PIPELINE_STAGES = [
  { id: "01", name: "Discovered", count: 4280, conversion: "100%", velocity: "3.2d" },
  { id: "02", name: "Validated", count: 2640, conversion: "61.6%", velocity: "1.1d" },
  { id: "03", name: "AI Qualified", count: 1180, conversion: "44.7%", velocity: "0.8d", highlight: true },
  { id: "04", name: "Contacted", count: 430, conversion: "36.4%", velocity: "2.4d" },
  { id: "05", name: "Interested", count: 92, conversion: "21.4%", velocity: "4.1d" },
  { id: "06", name: "Negotiating", count: 31, conversion: "33.7%", velocity: "5.6d" },
  { id: "07", name: "Quotation", count: 14, conversion: "45.1%", velocity: "2.8d" },
  { id: "08", name: "Won", count: 6, conversion: "42.8%", velocity: "Closed", won: true },
];

const GLOBAL_MARKETS = [
  { country: "USA", flag: "🇺🇸", buyers: 1640, pipeline: "$22,400", replyRate: "21.4%", intent: "High Intent", trend: "+14.2%" },
  { country: "Germany", flag: "🇩🇪", buyers: 980, pipeline: "$14,200", replyRate: "24.2%", intent: "Very High Intent", trend: "+18.0%" },
  { country: "UK", flag: "🇬🇧", buyers: 640, pipeline: "$8,600", replyRate: "18.5%", intent: "High Intent", trend: "+9.4%" },
  { country: "Canada", flag: "🇨🇦", buyers: 420, pipeline: "$4,800", replyRate: "16.8%", intent: "Moderate", trend: "+6.1%" },
  { country: "Australia", flag: "🇦🇺", buyers: 380, pipeline: "$5,200", replyRate: "19.1%", intent: "High Intent", trend: "+11.5%" },
  { country: "France", flag: "🇫🇷", buyers: 220, pipeline: "$3,400", replyRate: "15.4%", intent: "Moderate", trend: "+4.2%" },
];

const QUALITY_DISTRIBUTION = [
  { label: "90–100 High Intent", count: 86, percentage: 42.4, color: "bg-[#10B981]", textColor: "text-[#10B981]" },
  { label: "80–89 Strong Fit", count: 64, percentage: 31.5, color: "bg-[#6366F1]", textColor: "text-[#818cf8]" },
  { label: "70–79 Moderate Fit", count: 38, percentage: 18.7, color: "bg-[#22D3EE]", textColor: "text-[#22D3EE]" },
  { label: "<70 Low Fit", count: 15, percentage: 7.4, color: "bg-[#64748B]", textColor: "text-[#64748B]" },
];

const OUTREACH_DATA: Record<string, { time: string; sent: number; opened: number; replies: number }[]> = {
  "7D": [
    { time: "Mon", sent: 40, opened: 26, replies: 8 },
    { time: "Tue", sent: 75, opened: 52, replies: 16 },
    { time: "Wed", sent: 110, opened: 74, replies: 22 },
    { time: "Thu", sent: 140, opened: 96, replies: 31 },
    { time: "Fri", sent: 180, opened: 125, replies: 42 },
    { time: "Sat", sent: 195, opened: 134, replies: 45 },
    { time: "Sun", sent: 210, opened: 144, replies: 51 },
  ],
  "30D": [
    { time: "W1", sent: 240, opened: 165, replies: 52 },
    { time: "W2", sent: 520, opened: 360, replies: 112 },
    { time: "W3", sent: 880, opened: 590, replies: 194 },
    { time: "W4", sent: 1240, opened: 845, replies: 284 },
  ],
  "90D": [
    { time: "Month 1", sent: 950, opened: 640, replies: 198 },
    { time: "Month 2", sent: 2100, opened: 1420, replies: 452 },
    { time: "Month 3", sent: 3450, opened: 2380, replies: 780 },
  ],
  "12M": [
    { time: "Q1", sent: 2800, opened: 1890, replies: 610 },
    { time: "Q2", sent: 5900, opened: 4100, replies: 1320 },
    { time: "Q3", sent: 9400, opened: 6500, replies: 2180 },
    { time: "Q4", sent: 14200, opened: 9800, replies: 3440 },
  ],
};

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "12M">("30D");

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. DASHBOARD HERO (Command Center)
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#F8FAFC] tracking-tight leading-tight">
            Export Sales Command Center
          </h1>
          <p className="text-[15px] leading-6 text-slate-400">
            Discover, qualify and manage international wholesale buyers across global sound wellness markets.
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
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. INTEGRATED 6-KPI HORIZONTAL STRIP (Single unified visual group)
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="rounded-xl bg-[#0B0F14] border border-white/[0.08] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden"
      >
        {/* KPI 1: Total Buyers */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Buyers</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            <MetricCounter target={4280} />
          </div>
          <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
          </span>
        </div>

        {/* KPI 2: Qualified Leads */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Qualified Leads</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            <MetricCounter target={1180} />
          </div>
          <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.5%
          </span>
        </div>

        {/* KPI 3: Active Campaigns */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Active Campaigns</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            4
          </div>
          <span className="text-xs font-mono text-slate-400 block">2 in draft</span>
        </div>

        {/* KPI 4: Pipeline Value */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Pipeline Value</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            $48,600
          </div>
          <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +19.4%
          </span>
        </div>

        {/* KPI 5: Open Opportunities */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Open Opps</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            14
          </div>
          <span className="text-xs font-mono text-slate-400 block">6 closing soon</span>
        </div>

        {/* KPI 6: Win Rate */}
        <div className="p-5 space-y-1.5">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Win Rate</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
            24.2%
          </div>
          <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +2.1%
          </span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. GLOBAL EXPORT PIPELINE (Connected Operational Workflow)
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Global Export Pipeline</h2>
            <p className="text-sm leading-6 text-slate-400">Stage velocity and international buyer conversion funnel</p>
          </div>
          <Link
            href="/opportunities"
            className="text-sm text-[#6366F1] hover:underline font-medium inline-flex items-center gap-1"
          >
            Open Pipeline Board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Progression */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {PIPELINE_STAGES.map((st, idx) => (
            <Link
              key={st.id}
              href={`/opportunities?stage=${st.id}`}
              className={cn(
                "p-3.5 rounded-lg border transition-colors text-left space-y-2 block",
                st.won
                  ? "bg-[#10B981]/5 border-[#10B981]/30 hover:border-[#10B981]"
                  : st.highlight
                  ? "bg-[#6366F1]/5 border-[#6366F1]/40 hover:border-[#6366F1]"
                  : "bg-[#0A0D13] border-white/[0.08] hover:border-white/[0.16]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{st.id}</span>
                <span className="text-xs font-mono text-slate-300">{st.conversion}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#F8FAFC] block">{st.name}</span>
                <span className="text-lg font-semibold text-[#F8FAFC] tabular-nums font-mono block mt-0.5">
                  {st.count.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono block">
                {st.velocity}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MAIN ASYMMETRIC COMMAND AREA (65% Left / 35% Right Sticky Intelligence)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─────────────────────────────────────────────────────────────────
            LEFT COLUMN (65% / 8 cols): Markets, Quality, Charts & Signals
        ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section A: Global Buyer Markets Table */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Global Buyer Markets</h3>
                <p className="text-sm leading-6 text-slate-400">Ranked international wholesale demand corridors</p>
              </div>
              <Link href="/leads" className="text-sm text-[#22D3EE] hover:underline font-medium">
                View All Markets →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[13px] text-slate-400 font-medium font-sans">
                    <th className="py-3 px-4">Market</th>
                    <th className="py-3 px-4">Buyers</th>
                    <th className="py-3 px-4">Pipeline Value</th>
                    <th className="py-3 px-4">Reply Rate</th>
                    <th className="py-3 px-4">Intent Level</th>
                    <th className="py-3 px-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {GLOBAL_MARKETS.map((m) => (
                    <tr key={m.country} className="h-[60px] border-b border-white/[0.06] hover:bg-white/[0.025] transition-colors duration-150">
                      <td className="py-3.5 px-4 font-semibold text-[15px] text-[#F8FAFC] flex items-center gap-2.5">
                        <span className="text-lg">{m.flag}</span>
                        <span>{m.country}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">{m.buyers.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-[15px] text-[#F8FAFC]">{m.pipeline}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#10B981]">{m.replyRate}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={m.intent === "Very High Intent" ? "success" : "primary"} size="sm">
                          {m.intent}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-sm text-[#10B981]">{m.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Buyer Quality Distribution */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Buyer Quality Distribution</h3>
                <p className="text-sm leading-6 text-slate-400">AI qualification score breakdown across active leads</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded border border-[#10B981]/20">
                73.9% High & Strong Fit
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {QUALITY_DISTRIBUTION.map((q) => (
                <div key={q.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className={cn("font-medium", q.textColor)}>{q.label}</span>
                    <span className="text-slate-300 tabular-nums">
                      {q.count} buyers ({q.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0A0D13] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", q.color)} style={{ width: `${q.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Outreach Performance Recharts Graph */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Outreach Performance</h3>
                <p className="text-sm leading-6 text-slate-400">Verified delivery, open velocity, and wholesale inquiries</p>
              </div>

              {/* Segmented Period Selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0D13] border border-white/[0.08] w-fit">
                {(["7D", "30D", "90D", "12M"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTimeRange(p)}
                    className={cn(
                      "px-3 py-1 text-sm font-mono font-medium rounded-md transition-colors",
                      timeRange === p
                        ? "bg-[#131925] text-[#F8FAFC] shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={OUTREACH_DATA[timeRange]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gReply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F141D", borderColor: "rgba(148,163,184,0.16)", borderRadius: "8px", fontSize: "13px" }} />
                  <Area type="monotone" dataKey="sent" name="Dispatched" stroke="#6366F1" strokeWidth={1.5} fill="url(#gSent)" />
                  <Area type="monotone" dataKey="opened" name="Opened" stroke="#22D3EE" strokeWidth={1.5} fill="url(#gOpen)" />
                  <Area type="monotone" dataKey="replies" name="Replies" stroke="#10B981" strokeWidth={1.5} fill="url(#gReply)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Dispatched</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22D3EE]" /> Opened</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Replies</span>
              </div>
              <span className="font-mono text-[#F8FAFC]">68.4% open / 24.2% reply</span>
            </div>
          </div>

          {/* Section D: AI Recommendations Feed (Signal, Evidence, Confidence, Action) */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">AI Recommendations Feed</h3>
              </div>
              <span className="text-xs font-mono text-[#10B981] font-semibold">ACTION CENTER</span>
            </div>

            <div className="space-y-4">
              {/* Item 1: German Outreach */}
              <div className="p-4 rounded-lg bg-[#0A0D13] border-l-2 border-l-[#7C3AED] border-t border-r border-b border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#7C3AED] uppercase">AI SIGNAL</span>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded">
                    Confidence: 94%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Launch Targeted German Outreach</h4>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                    Why: German meditation studios show stronger response when CIF Hamburg shipping terms are stated upfront.
                  </p>
                </div>
                <div className="pt-1">
                  <Link href="/campaigns/new">
                    <Button variant="bronze" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Create German Campaign
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Item 2: Product Signal */}
              <div className="p-4 rounded-lg bg-[#0A0D13] border-l-2 border-l-[#22D3EE] border-t border-r border-b border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#22D3EE] uppercase">PRODUCT SIGNAL</span>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded">
                    Confidence: 91%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">7-Chakra Harmonic Sets</h4>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                    Demand increased among North American yoga and retreat centers (+18% inquiry surge).
                  </p>
                </div>
                <div className="pt-1">
                  <Link href="/products">
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Product Intelligence
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT COLUMN (35% / 4 cols): Sticky AI Sales Brief & Live Stream
        ───────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* AI Sales Brief Panel */}
          <div className="rounded-xl bg-[#0F141D] border border-[#6366F1]/30 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6366F1]" />
                <h3 className="text-base font-semibold text-[#F8FAFC]">AI Sales Brief</h3>
              </div>
              <span className="text-xs font-mono text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20 font-semibold">
                TODAY&apos;S INTELLIGENCE
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F8FAFC]">Germany Market</span>
                  <span className="font-mono text-[#10B981] font-semibold text-xs">94% Intent</span>
                </div>
                <p className="text-slate-400 text-xs leading-5">24.2% reply rate among German meditation studios.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F8FAFC]">7-Chakra Tuned Sets</span>
                  <span className="font-mono text-[#22D3EE] font-semibold text-xs">+18% Demand</span>
                </div>
                <p className="text-slate-400 text-xs leading-5">High volume requests for 432Hz master tuning sets.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F8FAFC]">18 High-Fit Buyers</span>
                  <span className="font-mono text-[#D97706] font-semibold text-xs">Uncontacted</span>
                </div>
                <p className="text-slate-400 text-xs leading-5">Verified wholesale decision makers awaiting initial sequence.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/campaigns/new" className="block w-full">
                <Button variant="bronze" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create German Campaign →
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Sales Activity Feed */}
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-base font-semibold text-[#F8FAFC]">Recent Sales Activity</h3>
              </div>
              <span className="text-xs font-mono text-[#10B981] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Live Stream
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#D97706] mt-2 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F8FAFC]">Quotation Generated</span>
                    <span className="text-xs font-mono text-slate-400">12m ago</span>
                  </div>
                  <p className="text-slate-400 text-xs">EXP-2026-000001 ($8,200 CIF Hamburg)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#10B981] mt-2 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F8FAFC]">Buyer Replied</span>
                    <span className="text-xs font-mono text-slate-400">45m ago</span>
                  </div>
                  <p className="text-slate-400 text-xs">Klangschalen Zentrum requested CIF pricing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F8FAFC]">Opportunity Moved</span>
                    <span className="text-xs font-mono text-slate-400">2h ago</span>
                  </div>
                  <p className="text-slate-400 text-xs">Zen Sound Therapy → Negotiation stage.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22D3EE] mt-2 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F8FAFC]">AI Qualified Buyer</span>
                    <span className="text-xs font-mono text-slate-400">3h ago</span>
                  </div>
                  <p className="text-slate-400 text-xs">94/100 • Sound Immersion LLC (USA).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F8FAFC]">Campaign Dispatched</span>
                    <span className="text-xs font-mono text-slate-400">4h ago</span>
                  </div>
                  <p className="text-slate-400 text-xs">24 personalized emails dispatched via Gmail.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
