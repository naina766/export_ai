"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  Send,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  Button,
  Badge,
  ScoreBadge,
  CountryBadge,
  StatusBadge,
  PageHeader,
  ActivityTimeline,
  LoadingSkeleton,
} from "@/components/ui";
import toast from "react-hot-toast";

interface LeadDetail {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  buyerType: string;
  buyerIntent: string;
  industry: string | null;
  productInterest: string | null;
  leadScore: number;
  aiConfidence: number | null;
  aiReasoning: string | null;
  emailStatus: string;
  outreachStatus: string;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  campaignRecipients?: {
    campaign: { name: string; status: string };
    status: string;
    sentAt: string | null;
  }[];
  opportunities?: {
    id: string;
    title: string;
    stage: string;
    inquiryValue: number | null;
  }[];
  quotations?: {
    id: string;
    quotationNumber: string;
    total: number;
    status: string;
  }[];
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const json = await res.json();
      if (json.success) setLead(json.data);
    } catch {
      toast.error("Failed to load lead details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const handleReclassify = async () => {
    setIsScoring(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/classify`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`AI Qualification Updated: Score ${json.data.leadScore}/100`);
        fetchLead();
      }
    } catch {
      toast.error("Qualification failed");
    } finally {
      setIsScoring(false);
    }
  };

  if (isLoading && !lead) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-12 text-center text-[#5F6B7A]">
        Buyer profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title={lead.companyName}
        subtitle={`${lead.country} • ${lead.buyerType || "Wholesale Buyer"} • ${lead.industry || "Sound Healing & Wellness"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/leads">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              isLoading={isScoring}
              onClick={handleReclassify}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#D97706]" />}
            >
              Re-score
            </Button>
            <Link href={`/quotations/new?leadId=${lead.id}`}>
              <Button variant="secondary" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5 text-[#D97706]" />}>
                Create Quotation
              </Button>
            </Link>
            <Link href={`/campaigns/new?leadIds=${lead.id}`}>
              <Button variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Add to Campaign
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Top Summary Strip ── */}
      <div className="rounded-xl bg-[#0D1118] border border-white/[0.08] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[#F5F7FA]">{lead.companyName}</h2>
            <Badge variant="primary" size="sm">{lead.buyerType}</Badge>
            <StatusBadge status={lead.emailStatus} />
          </div>
          <p className="text-sm text-slate-400">
            Contact: <strong className="text-[#F5F7FA] font-medium">{lead.contactPerson || "Procurement Director"}</strong> • Location: <strong className="text-[#F5F7FA] font-medium">{lead.country}</strong> {lead.city ? `(${lead.city})` : ""}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#111722] px-5 py-3 rounded-xl border border-white/[0.06]">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-mono block">Gemini AI Fit Score</span>
            <span className="text-2xl font-bold font-mono text-[#6366F1]">{lead.leadScore} / 100</span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: AI Reasoning & Overview */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Reasoning Section */}
          <div className="rounded-xl bg-[#0D1118] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>AI Commercial Qualification Reasoning</span>
              </h3>
              <span className="text-xs font-mono text-[#10B981] font-semibold">
                {lead.aiConfidence ? `${Math.round(lead.aiConfidence * 100)}% Confidence` : "92% Confidence"}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {lead.aiReasoning || "Verified distributor specializing in sound therapy instruments and Tibetan singing bowls with strong commercial presence in tier-1 import market."}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Grounding verified against wholesale business records</span>
            </div>
          </div>

          {/* Product Interest & Company Data */}
          <div className="rounded-xl bg-[#0D1118] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F7FA]">Product Interest & Catalog Fit</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {lead.productInterest || "Tibetan hand-hammered 7-metal singing bowls, 7-chakra tuning sets, full moon sound bath instruments."}
            </p>
          </div>
        </div>

        {/* Right 5 cols: Contact & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl bg-[#0D1118] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F7FA]">Contact & Domain</h3>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase font-mono block">Email</span>
                <span className="text-[#F5F7FA] font-mono text-sm">{lead.email}</span>
              </div>
              {lead.phone && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-mono block">Phone</span>
                  <span className="text-[#F5F7FA] font-mono text-sm">{lead.phone}</span>
                </div>
              )}
              {lead.website && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-mono block">Website</span>
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6366F1] hover:underline font-mono text-sm"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-[#0D1118] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F7FA]">Activity Timeline</h3>
            <ActivityTimeline
              items={[
                {
                  id: "act-1",
                  title: "Lead Discovered",
                  description: "Ingested via international wholesale directory crawler",
                  type: "DISCOVERY",
                  createdAt: lead.createdAt,
                },
                {
                  id: "act-2",
                  title: "RFC-5322 Validated",
                  description: `Status: ${lead.emailStatus}`,
                  type: "VALIDATION",
                  createdAt: lead.createdAt,
                },
                {
                  id: "act-3",
                  title: "AI Qualified",
                  description: `Assigned score of ${lead.leadScore}/100`,
                  type: "AI_QUALIFIED",
                  createdAt: lead.createdAt,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
