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
  AlertCircle,
  RotateCw,
} from "lucide-react";
import {
  MetricInline,
  PageHeader,
  Button,
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

interface AnalyticsKPIs {
  totalBuyers: number;
  qualifiedBuyers: number;
  pipelineValue: number;
  activeCampaigns: number;
  openOpportunities: number;
  winRate: number;
  totalEmailsSent: number;
  replyRate: string;
}

interface QualityBand {
  band: string;
  label: string;
  count: number;
  percentage: number;
}

interface PipelineHistoryPoint {
  month: string;
  revenue: number;
  pipeline: number;
}

interface BuyerAcquisitionPoint {
  month: string;
  discovered: number;
  qualified: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "12M">("30D");
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [qualityDistribution, setQualityDistribution] = useState<QualityBand[]>([]);
  const [pipelineHistory, setPipelineHistory] = useState<PipelineHistoryPoint[]>([]);
  const [buyerAcquisition, setBuyerAcquisition] = useState<BuyerAcquisitionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, timeseriesRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch(`/api/analytics/timeseries?range=${timeRange}`),
      ]);

      if (!overviewRes.ok || !timeseriesRes.ok) {
        throw new Error("Failed to load export revenue intelligence.");
      }

      const overviewJson = await overviewRes.json();
      const timeseriesJson = await timeseriesRes.json();

      if (overviewJson.success && overviewJson.data) {
        setKpis(overviewJson.data.kpis);
        setQualityDistribution(overviewJson.data.qualityDistribution || []);
      }

      if (timeseriesJson.success && timeseriesJson.data) {
        setPipelineHistory(timeseriesJson.data.pipelineHistory || []);
        setBuyerAcquisition(timeseriesJson.data.buyerAcquisition || []);
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const totalClosedRevenue = pipelineHistory.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalOpenPipeline = pipelineHistory.reduce((acc, curr) => acc + curr.pipeline, 0);

  return (
    <div className="space-y-10 max-w-[1440px] mx-auto pb-16 font-sans">
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

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-between text-sm text-[#EF4444]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} leftIcon={<RotateCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Top Inline Metric Bar (100% Database-Backed) ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricInline
          label="Qualified Buyer Base"
          value={isLoading ? "..." : (kpis?.qualifiedBuyers || 0).toLocaleString()}
        />
        <MetricInline
          label="Outreach Sent"
          value={isLoading ? "..." : (kpis?.totalEmailsSent || 0).toLocaleString()}
        />
        <MetricInline
          label="Average Win Rate"
          value={isLoading ? "..." : `${kpis?.winRate || 0}%`}
        />
        <MetricInline
          label="Export Pipeline Value"
          value={isLoading ? "..." : `$${(kpis?.pipelineValue || 0).toLocaleString()}`}
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
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Loading deal trajectory...
              </div>
            ) : pipelineHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No pipeline history records for selected range ({timeRange}).
              </div>
            ) : (
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
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Total Open Pipeline (${totalOpenPipeline.toLocaleString()})
              <span className="w-2 h-2 rounded-full bg-[#10B981] ml-2" /> Realized Orders (${totalClosedRevenue.toLocaleString()})
            </span>
            <span className="font-mono text-[#F8FAFC]">Live Database Aggregation</span>
          </div>
        </div>

        {/* Buyer Acquisition Trajectory */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Buyer Lead Ingestion & Qualification</h2>
            <p className="text-sm leading-6 text-slate-400">Discovery crawler yields vs verified high-fit prospects</p>
          </div>

          <div className="h-64 w-full pt-2">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Loading lead trajectory...
              </div>
            ) : buyerAcquisition.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No buyer records found for selected range ({timeRange}).
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buyerAcquisition} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111722", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "13px" }} />
                  <Bar dataKey="discovered" name="Discovered Leads" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualified" name="AI Qualified" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Discovered
              <span className="w-2 h-2 rounded-full bg-[#10B981] ml-2" /> AI Qualified (Score ≥ 80)
            </span>
            <span className="font-mono text-[#10B981]">
              {kpis && kpis.totalBuyers > 0
                ? `${Math.round((kpis.qualifiedBuyers / kpis.totalBuyers) * 100)}% Qualification Yield`
                : "No data"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom: Score Conversion Efficiency (100% Database-Backed Quality Distribution) ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">AI Qualification Score Distribution</h2>
          <p className="text-sm leading-6 text-slate-400">Empirical distribution of international buyer prospects mapped across lead scoring bands</p>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-white/[0.04] rounded animate-pulse" />
            ))}
          </div>
        ) : qualityDistribution.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No score distribution records available in database.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {qualityDistribution.map((row) => (
              <div key={row.band} className="py-3.5 px-3 flex items-center justify-between hover:bg-white/[0.025] rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-[#F8FAFC] w-24">{row.band}</span>
                  <span className="text-sm text-slate-300">
                    {row.count} prospective buyers <span className="text-slate-500 font-mono text-xs">({row.label})</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-2 bg-[#111722] rounded-full overflow-hidden hidden sm:block">
                    <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#10B981] w-24 text-right">
                    {row.percentage}% of leads
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
