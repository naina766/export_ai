"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe2,
  Users,
  Eye,
  Mail,
  Zap,
} from "lucide-react";
import {
  MetricCard,
  Button,
  Badge,
  CountryBadge,
  StatusBadge,
  PageHeader,
  EmptyState,
  LoadingSkeleton,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalLeads: number;
  sentCount: number;
  openRate?: number;
  replyRate?: number;
  qualifiedCount?: number;
  health?: "EXCELLENT" | "HEALTHY" | "NEEDS_ATTENTION";
  market?: string;
  productName?: string;
  createdAt: string;
  product?: { name: string };
  recipients?: { id: string; status: string }[];
}

const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    name: "Q3 Germany Singing Bowls Wholesale",
    subject: "Direct Himalayan Artisan Supply: 432Hz Master Singing Bowls for {{companyName}}",
    status: "RUNNING",
    totalLeads: 124,
    sentCount: 124,
    openRate: 68.4,
    replyRate: 24.2,
    qualifiedCount: 18,
    health: "EXCELLENT",
    market: "Germany 🇩🇪",
    productName: "Tibetan Master Hand-Hammered Singing Bowls",
    createdAt: new Date().toISOString(),
  },
  {
    id: "camp-2",
    name: "USA Sound Healing Clinics & Studios",
    subject: "Artisan 7-Chakra Tuning Sets & Acoustic Certificates for {{companyName}}",
    status: "RUNNING",
    totalLeads: 210,
    sentCount: 180,
    openRate: 61.2,
    replyRate: 19.5,
    qualifiedCount: 22,
    health: "HEALTHY",
    market: "USA 🇺🇸",
    productName: "7-Chakra Tuned Harmonic Sets",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "camp-3",
    name: "UK & Nordic Holistic Distributors",
    subject: "Direct Export Supply: Full Moon Energized Meditation Bowls",
    status: "PAUSED",
    totalLeads: 85,
    sentCount: 85,
    openRate: 48.0,
    replyRate: 11.4,
    qualifiedCount: 5,
    health: "NEEDS_ATTENTION",
    market: "UK 🇬🇧 / Nordics",
    productName: "Full Moon Energized Bowls",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const aiRecommendations = [
  {
    title: "Optimize Follow-up Timing",
    confidence: "88% Confidence",
    reason: "Send follow-up sequence 6–8 hours earlier to align with Central European working hours (09:00 CET).",
    actionText: "Update Sequence Schedule",
    actionHref: "/campaigns/camp-1",
  },
  {
    title: "Localized Subject Lines for DACH",
    confidence: "94% Confidence",
    reason: "German subject lines with Incoterm references outperform English-only variants by 14% in initial opens.",
    actionText: "Apply German Copy Variant",
    actionHref: "/templates",
  },
  {
    title: "Priority Outreach for 18 High-Fit Buyers",
    confidence: "92% Confidence",
    reason: "18 verified buyers with qualification score > 85 should be moved to direct personalized sequence dispatch.",
    actionText: "Launch Priority Batch",
    actionHref: "/leads?minScore=85",
  },
];

export default function CampaignsControlCenterPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SAMPLE_CAMPAIGNS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setCampaigns(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = currentStatus === "RUNNING" ? "PAUSED" : "RUNNING";

    try {
      const endpoint = currentStatus === "RUNNING" ? `/api/campaigns/${id}/pause` : `/api/campaigns/${id}/start`;
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Campaign ${newStatus === "RUNNING" ? "resumed" : "paused"}`);
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      toast.error("Failed to update campaign state");
    }
  };

  const getHealthBadge = (health?: string) => {
    if (health === "EXCELLENT") {
      return (
        <span className="text-xs font-mono font-medium text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded border border-[#10B981]/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Excellent Health
        </span>
      );
    }
    if (health === "HEALTHY") {
      return (
        <span className="text-xs font-mono font-medium text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded border border-[#22D3EE]/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" /> Healthy
        </span>
      );
    }
    return (
      <span className="text-xs font-mono font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded border border-[#F59E0B]/20 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" /> Needs Attention
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight leading-tight">
            Campaigns
          </h1>
          <p className="text-base leading-7 text-slate-400 mt-2">
            Create, monitor, and optimize AI-powered buyer outreach across global markets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/campaigns/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TOP METRICS (4 MetricCards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Campaigns"
          value={campaigns.filter((c) => c.status === "RUNNING").length}
          trend={{ value: "Dispatched", isPositive: true }}
          icon={<Send className="w-4 h-4 text-[#64748B]" />}
        />
        <MetricCard
          label="Total Outreach Sent"
          value="1,240"
          trend={{ value: "+8.5% volume", isPositive: true }}
          icon={<Mail className="w-4 h-4 text-[#64748B]" />}
        />
        <MetricCard
          label="Average Open Rate"
          value="64.8%"
          trend={{ value: "Top Decile", isPositive: true }}
          icon={<Eye className="w-4 h-4 text-[#64748B]" />}
        />
        <MetricCard
          label="Overall Reply Rate"
          value="21.4%"
          trend={{ value: "+3.2% vs avg", isPositive: true }}
          icon={<Activity className="w-4 h-4 text-[#64748B]" />}
        />
      </div>

      {/* ── MAIN WORKSPACE (8 cols Campaigns / 4 cols AI Optimization Panel) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ═════════════════════════════════════════════════════════════════════
            LEFT 68% (8 cols): CAMPAIGN CONTROL CARDS
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Active Outreach Waves</h2>
            <span className="text-xs font-mono text-slate-400">{campaigns.length} total sequences</span>
          </div>

          <div className="space-y-4">
            {campaigns.map((camp) => (
              <Link
                key={camp.id}
                href={`/campaigns/${camp.id}`}
                className="block p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] hover:border-[#6366F1]/50 transition-colors space-y-4 group"
              >
                {/* Header: Title, Health, Market */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                      {camp.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                      <span>{camp.market || "Germany 🇩🇪"}</span>
                      <span>•</span>
                      <span>{camp.productName || "Singing Bowls Wholesale"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getHealthBadge(camp.health)}
                    <span className="text-xs font-mono font-medium text-[#10B981] flex items-center gap-1.5 pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span>{camp.status}</span>
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-[#0A0D13] border border-white/[0.06] text-sm">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono block">Recipients</span>
                    <span className="text-base font-semibold font-mono text-[#F8FAFC] mt-0.5 block">
                      {camp.totalLeads || 124}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono block">Open Rate</span>
                    <span className="text-base font-semibold font-mono text-[#22D3EE] mt-0.5 block">
                      {camp.openRate || 68.4}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono block">Reply Rate</span>
                    <span className="text-base font-semibold font-mono text-[#10B981] mt-0.5 block">
                      {camp.replyRate || 24.2}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono block">AI Qualified</span>
                    <span className="text-base font-semibold font-mono text-[#6366F1] mt-0.5 block">
                      {camp.qualifiedCount || 18} buyers
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-xs text-slate-400 font-mono">
                    Subject: &ldquo;{camp.subject.slice(0, 48)}...&rdquo;
                  </span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleStatus(camp.id, camp.status, e)}
                      leftIcon={camp.status === "RUNNING" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#10B981]" />}
                    >
                      {camp.status === "RUNNING" ? "Pause" : "Resume"}
                    </Button>
                    <span className="text-[#6366F1] font-medium text-sm inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            RIGHT 32% (4 cols): AI CAMPAIGN OPTIMIZATION PANEL
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">AI Campaign Insights</h2>
            </div>
            <span className="text-xs font-mono text-[#10B981] font-semibold">OPTIMIZER</span>
          </div>

          <div className="space-y-3.5">
            {aiRecommendations.map((rec) => (
              <div
                key={rec.title}
                className="p-4 rounded-lg bg-[#0A0D13] border border-white/[0.08] hover:border-[#22D3EE]/40 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F8FAFC]">{rec.title}</span>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded border border-[#10B981]/20 font-medium">
                    {rec.confidence}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">&ldquo;{rec.reason}&rdquo;</p>

                <div className="pt-1">
                  <Link
                    href={rec.actionHref}
                    className="text-sm text-[#22D3EE] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {rec.actionText} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
            Gemini AI continuously monitors mailbox delivery rates, reply sentiment, and conversion telemetry to propose sequence optimizations.
          </div>
        </div>
      </div>
    </div>
  );
}
