"use client";
import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Send,
  Globe2,
  ReceiptText,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Layers,
} from "lucide-react";
import {
  MetricInline,
  PageHeader,
} from "@/components/ui";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const pipelineHistory = [
  { month: "Jan", revenue: 14000, pipeline: 28000 },
  { month: "Feb", revenue: 18000, pipeline: 32000 },
  { month: "Mar", revenue: 24000, pipeline: 39000 },
  { month: "Apr", revenue: 31000, pipeline: 44000 },
  { month: "May", revenue: 38000, pipeline: 48800 },
];

const buyerAcquisition = [
  { month: "Jan", discovered: 520, qualified: 180 },
  { month: "Feb", discovered: 680, qualified: 240 },
  { month: "Mar", discovered: 840, qualified: 310 },
  { month: "Apr", discovered: 1100, qualified: 420 },
  { month: "May", discovered: 1140, qualified: 480 },
];

const scoreConversion = [
  { score: "90–100", count: 480, winRate: 38.5 },
  { score: "80–89", count: 390, winRate: 24.2 },
  { score: "70–79", count: 180, winRate: 14.8 },
  { score: "60–69", count: 90, winRate: 6.4 },
  { score: "<60", count: 40, winRate: 1.2 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "12M">("30D");

  return (
    <div className="space-y-10 max-w-[1440px] mx-auto pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Export Analytics & Revenue Intelligence"
        subtitle="Comprehensive metrics across pipeline growth, international buyer acquisition, campaign responses, and quotation conversions."
        actions={
          <div className="flex items-center gap-1 bg-[#0D1118] p-1 rounded-lg border border-[rgba(255,255,255,0.06)]">
            {(["7D", "30D", "90D", "12M"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timeRange === r ? "bg-[#151C28] text-[#F5F7FA]" : "text-[#5F6B7A] hover:text-[#8D98AA]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Top Inline Metric Bar ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricInline
          label="Qualified Buyer Base"
          value="4,280"
          trend={{ value: "+14.2%", isPositive: true }}
        />
        <MetricInline
          label="Outreach Sent"
          value="1,240"
          trend={{ value: "+8.5%", isPositive: true }}
        />
        <MetricInline
          label="Average Win Rate"
          value="18.4%"
          trend={{ value: "+2.1%", isPositive: true }}
        />
        <MetricInline
          label="Export Pipeline Value"
          value="$48,800"
          trend={{ value: "+19.4%", isPositive: true }}
        />
      </div>

      {/* ── 2 Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue & Pipeline Growth */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Pipeline Value & Realized Orders</h2>
            <p className="text-sm leading-6 text-slate-400">Monthly deal flow trajectory across international wholesale inquiries</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111722", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "13px" }} />
                <Area type="monotone" dataKey="pipeline" name="Pipeline Value ($)" stroke="#6366F1" strokeWidth={2} fill="url(#pipeGrad)" />
                <Area type="monotone" dataKey="revenue" name="Realized Orders ($)" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Total Pipeline
              <span className="w-2 h-2 rounded-full bg-[#10B981] ml-2" /> Realized Orders
            </span>
            <span className="font-mono text-[#F8FAFC]">+38.5% YoY Growth</span>
          </div>
        </div>

        {/* Buyer Acquisition Trajectory */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Buyer Lead Ingestion & Qualification</h2>
            <p className="text-sm leading-6 text-slate-400">Discovery crawler yields vs verified high-fit prospects</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buyerAcquisition} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111722", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "13px" }} />
                <Bar dataKey="discovered" name="Discovered Leads" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qualified" name="AI Qualified" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Discovered
              <span className="w-2 h-2 rounded-full bg-[#10B981] ml-2" /> AI Qualified
            </span>
            <span className="font-mono text-[#10B981]">42.1% Qualification Yield</span>
          </div>
        </div>
      </div>

      {/* ── Bottom: Score Conversion Efficiency ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">AI Qualification Score vs Commercial Win Rate</h2>
          <p className="text-sm leading-6 text-slate-400">Empirical conversion efficiency mapped across lead scoring bands</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {scoreConversion.map((row) => (
            <div key={row.score} className="py-3.5 px-3 flex items-center justify-between hover:bg-white/[0.025] rounded-lg transition-colors">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold text-[#F8FAFC] w-20">{row.score}</span>
                <span className="text-sm text-slate-300">{row.count} prospective buyers</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48 h-2 bg-[#111722] rounded-full overflow-hidden hidden sm:block">
                  <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${row.winRate * 2}%` }} />
                </div>
                <span className="font-mono text-sm font-semibold text-[#10B981] w-20 text-right">
                  {row.winRate}% win
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
