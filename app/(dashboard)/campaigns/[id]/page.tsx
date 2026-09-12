"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Play,
  Pause,
  ArrowLeft,
  Users,
  Eye,
  Mail,
  Activity,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  FileText,
  DollarSign,
  Receipt,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Badge,
  MetricCard,
  CountryBadge,
  StatusBadge,
  PageHeader,
  ActivityTimeline,
  LoadingSkeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
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
import toast from "react-hot-toast";

interface CampaignDetail {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalLeads: number;
  sentCount: number;
  openRate?: number;
  replyRate?: number;
  qualifiedCount?: number;
  pipelineGenerated?: number;
  market?: string;
  productName?: string;
  createdAt: string;
  product?: { name: string; sku: string };
  template?: { name: string; subject: string; body: string };
  recipients?: {
    id: string;
    status: string;
    lead: {
      id: string;
      companyName: string;
      contactPerson?: string | null;
      email: string;
      country: string;
      leadScore?: number;
    };
  }[];
  personalizedEmails?: {
    id: string;
    isApproved: boolean;
  }[];
}

const hourlyPerformance = [
  { time: "09:00", sent: 20, opened: 12, replies: 2 },
  { time: "11:00", sent: 45, opened: 32, replies: 7 },
  { time: "13:00", sent: 75, opened: 54, replies: 12 },
  { time: "15:00", sent: 100, opened: 71, replies: 18 },
  { time: "17:00", sent: 124, opened: 85, replies: 24 },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [activeTab, setActiveTab] = useState("audience");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCampaign(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [campaignId]);

  const handleToggleState = async () => {
    if (!campaign) return;
    const isRunning = campaign.status === "RUNNING";
    const endpoint = isRunning ? `/api/campaigns/${campaign.id}/pause` : `/api/campaigns/${campaign.id}/start`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Campaign ${isRunning ? "paused" : "resumed"}`);
        setCampaign({ ...campaign, status: isRunning ? "PAUSED" : "RUNNING" });
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const tabs = [
    { id: "audience", label: "Audience & Leads" },
    { id: "sequence", label: "Email Sequence" },
    { id: "replies", label: "Replies & Sentiment" },
    { id: "activity", label: "Activity Timeline" },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link href="/campaigns" className="hover:text-[#F8FAFC]">Campaigns</Link>
            <span>/</span>
            <span className="text-slate-300">{campaign?.name || "Q3 Germany Singing Bowls Wholesale"}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              {campaign?.name || "Q3 Germany Singing Bowls Wholesale"}
            </h1>
            <Badge variant="primary" size="sm">{campaign?.status || "RUNNING"}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/campaigns">
            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
          </Link>
          <Button
            variant={campaign?.status === "RUNNING" ? "secondary" : "primary"}
            size="md"
            onClick={handleToggleState}
            leftIcon={campaign?.status === "RUNNING" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {campaign?.status === "RUNNING" ? "Pause Campaign" : "Resume Dispatch"}
          </Button>
        </div>
      </div>

      {/* ── 4 KPI CARDS (Real DB-backed Metrics) ── */}
      {(() => {
        const totalRecipients = campaign?.recipients?.length ?? campaign?.totalLeads ?? 0;
        const totalSent = campaign?.recipients?.filter((r) => r.status === "SENT" || r.status === "DELIVERED").length ?? 0;
        const approvedEmails = campaign?.personalizedEmails?.filter((p) => p.isApproved).length ?? 0;
        const totalPersonalized = campaign?.personalizedEmails?.length ?? 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Recipients"
              value={String(totalRecipients)}
              trend={{ value: `${totalSent} Dispatched`, isPositive: totalSent > 0 }}
              icon={<Send className="w-4 h-4 text-[#64748B]" />}
            />
            <MetricCard
              label="Approved Drafts"
              value={totalPersonalized > 0 ? `${approvedEmails} / ${totalPersonalized}` : "0"}
              trend={{
                value: approvedEmails === totalPersonalized && totalPersonalized > 0 ? "Ready to Dispatch" : "Human Approval Gate",
                isPositive: approvedEmails > 0,
              }}
              icon={<Eye className="w-4 h-4 text-[#22D3EE]" />}
            />
            <MetricCard
              label="Campaign Status"
              value={campaign?.status || "DRAFT"}
              trend={{ value: `${totalSent} Sent`, isPositive: true }}
              icon={<MessageSquare className="w-4 h-4 text-[#10B981]" />}
            />
            <MetricCard
              label="Target Product"
              value={campaign?.product?.sku || "Wholesale Catalog"}
              trend={{ value: campaign?.product?.name ? "FOB Tier" : "General", isPositive: true }}
              icon={<DollarSign className="w-4 h-4 text-[#6366F1]" />}
            />
          </div>
        );
      })()}

      {/* ── PERFORMANCE CHART & AI CAMPAIGN INSIGHTS (8 cols / 4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Hourly Dispatch & Reply Trajectory Area Chart */}
        <div className="lg:col-span-8 rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Outreach Hourly Response Velocity</h2>
              <p className="text-sm leading-6 text-slate-400">Cumulative deliveries, opens, and commercial response telemetry</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded border border-[#10B981]/20">
              Optimal Response: 14:00 CET
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="openG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="replyG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "13px" }} />
                <Area type="monotone" dataKey="sent" name="Dispatched" stroke="#6366F1" strokeWidth={2} fill="url(#sentG)" />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#22D3EE" strokeWidth={2} fill="url(#openG)" />
                <Area type="monotone" dataKey="replies" name="Replies" stroke="#10B981" strokeWidth={2} fill="url(#replyG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Dispatched</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22D3EE]" /> Opened</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Replies</span>
            </div>
            <span className="font-mono text-[#F8FAFC]">Hourly Dispatch Telemetry</span>
          </div>
        </div>

        {/* Right 4 cols: AI Recommendations for this campaign */}
        <div className="lg:col-span-4 rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">AI Campaign Insights</h2>
            </div>
            <span className="text-xs font-mono text-[#10B981] font-semibold">ACTIVE OPTIMIZER</span>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#F8FAFC]">Schedule Step 2 Follow-Up</span>
                <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded font-medium">94% Confidence</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                42 buyers opened but have not replied. Dispatching follow-up tomorrow at 10:00 CET will recover ~14 responses.
              </p>
              <div className="pt-1">
                <Button variant="primary" size="sm" onClick={() => toast.success("Step 2 Follow-up scheduled")}>
                  Schedule Wave →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS: Audience, Sequence, Replies, Activity ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: AUDIENCE */}
        {activeTab === "audience" && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer / Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Klangschalen Zentrum München", contact: "Helga Schmidt", country: "Germany 🇩🇪", score: 94, email: "einkauf@klang-zentrum.de", status: "REPLIED" },
                  { name: "Prana Sound Retreats", contact: "Michael Chen", country: "USA 🇺🇸", score: 91, email: "orders@pranasound.com", status: "SENT" },
                  { name: "Nordic Sound Bath Studio", contact: "Astrid Lind", country: "Sweden 🇸🇪", score: 88, email: "astrid@nordicsound.se", status: "REPLIED" },
                ].map((rec, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-semibold text-base text-[#F8FAFC]">{rec.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{rec.contact}</div>
                    </TableCell>
                    <TableCell className="text-sm">{rec.country}</TableCell>
                    <TableCell><span className="font-mono text-sm font-semibold text-[#10B981]">{rec.score}</span></TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">{rec.email}</TableCell>
                    <TableCell><StatusBadge status={rec.status} /></TableCell>
                    <TableCell className="text-right">
                      <Link href="/leads">
                        <Button variant="outline" size="sm">Inspect</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* TAB 2: EMAIL SEQUENCE */}
        {activeTab === "sequence" && (
          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#F8FAFC]">Step 1: Direct Artisan Wholesale Hook (Initial)</span>
                <Badge variant="success" size="sm">Dispatched</Badge>
              </div>
              <p className="text-sm font-mono text-[#22D3EE]">Subject: Direct Himalayan Artisan Supply: 432Hz Master Singing Bowls for {"{{companyName}}"}</p>
              <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.06] text-sm text-slate-300 font-mono leading-relaxed space-y-2">
                <p>Dear Procurement Team at {"{{companyName}}"}&#44;</p>
                <p>As direct Himalayan artisan producers in the Kathmandu Valley, we craft authentic 7-metal hand-hammered singing bowls and tuned 432Hz harmonic sets with complete acoustic frequency certificates.</p>
                <p>We provide wholesale FOB and CIF European port pricing. Would you be open to reviewing our 2026 export catalog?</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPLIES */}
        {activeTab === "replies" && (
          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#F8FAFC]">Klangschalen Zentrum München (Germany)</span>
                <span className="text-xs font-mono text-[#10B981] font-medium">Positive Sentiment</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                &ldquo;Hello, thank you for reaching out. Please send your CIF Hamburg wholesale price list for 7-chakra tuned sets. We are looking for 40 units next month.&rdquo;
              </p>
              <div className="pt-2 flex justify-end">
                <Link href="/quotations/new">
                  <Button variant="primary" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                    Generate CIF Quotation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY */}
        {activeTab === "activity" && (
          <div className="p-4">
            <ActivityTimeline
              items={[
                {
                  id: "act-1",
                  title: `Campaign Status: ${campaign?.status || "DRAFT"}`,
                  description: `${campaign?.recipients?.length ?? campaign?.totalLeads ?? 0} verified buyer recipients loaded for outreach.`,
                  type: "CAMPAIGN",
                  createdAt: campaign?.createdAt || new Date().toISOString(),
                },
                {
                  id: "act-2",
                  title: "AI Personalization Gate",
                  description: `${campaign?.personalizedEmails?.filter((p) => p.isApproved).length ?? 0} of ${campaign?.personalizedEmails?.length ?? 0} draft emails approved for sending.`,
                  type: "ANALYTICS",
                  createdAt: new Date().toISOString(),
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
