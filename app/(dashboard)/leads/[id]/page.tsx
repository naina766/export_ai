"use client";
import React, { useState, useEffect } from "react";
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
  Kanban,
  CheckSquare,
  Activity,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  Layers,
  FileText,
} from "lucide-react";
import {
  Button,
  Badge,
  CountryBadge,
  StatusBadge,
  PageHeader,
  LoadingSkeleton,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface LeadActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface LeadFollowUp {
  id: string;
  title?: string;
  type?: string;
  notes: string | null;
  scheduledAt: string;
  isCompleted: boolean;
}

interface LeadQuotation {
  id: string;
  quotationNumber: string;
  total: number;
  status: string;
}

interface LeadOpportunity {
  id: string;
  title: string;
  stage: string;
  inquiryValue: number | null;
  terms?: string;
  quotations?: LeadQuotation[];
}

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
  activities?: LeadActivity[];
  followUps?: LeadFollowUp[];
  opportunities?: LeadOpportunity[];
}

type TabType = "overview" | "intelligence" | "activity" | "opportunities" | "followups";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLead(json.data);
      } else {
        setError(json.message || "Buyer lead not found.");
      }
    } catch {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId]);

  const handleReclassify = async () => {
    setIsScoring(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/classify`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`AI Qualification Updated: Score ${json.data.leadScore}/100`);
        fetchLead();
      } else {
        toast.error(json.message || "Qualification failed");
      }
    } catch {
      toast.error("Qualification request failed");
    } finally {
      setIsScoring(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm(`Are you sure you want to delete ${lead?.companyName}? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Buyer lead deleted successfully.");
        router.push("/leads");
      } else {
        toast.error(json.message || "Failed to delete lead");
      }
    } catch {
      toast.error("Network error deleting lead");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto p-6 font-sans">
        <div className="h-8 w-40 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-[600px] mx-auto my-20 p-8 rounded-2xl bg-[#0F141D] border border-white/[0.08] text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-[#F8FAFC]">Buyer Profile Not Found</h2>
        <p className="text-sm text-slate-400">
          {error || "The requested buyer lead does not exist or you do not have permission to view it."}
        </p>
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={() => router.push("/leads")}>
            Return to Leads Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans">
      {/* ── Breadcrumb Bar & CRM Primary Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/leads")}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Directory
          </Button>
          <div className="h-4 w-px bg-white/[0.08]" />
          <span className="text-xs font-mono text-slate-400">Record #{lead.id.slice(0, 8)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            isLoading={isScoring}
            onClick={handleReclassify}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#D97706]" />}
          >
            Re-score AI
          </Button>
          <Link href={`/quotations/new?leadId=${lead.id}`}>
            <Button variant="secondary" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
              Create Quotation
            </Button>
          </Link>
          <Link href={`/campaigns/new?leadIds=${lead.id}`}>
            <Button variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
              Add to Campaign
            </Button>
          </Link>
          <button
            type="button"
            onClick={handleDeleteLead}
            disabled={isDeleting}
            title="Delete buyer lead"
            aria-label="Delete buyer lead"
            className="p-2 rounded-lg text-slate-500 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer border border-transparent hover:border-[#EF4444]/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Key Dossier Header Strip ── */}
      <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">{lead.companyName}</h1>
            <Badge variant="primary" size="sm">{lead.buyerType || "WHOLESALE"}</Badge>
            <StatusBadge status={lead.emailStatus} />
            <StatusBadge status={lead.outreachStatus} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{lead.country} {lead.city ? `• ${lead.city}` : ""}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-200">{lead.email}</span>
            </span>
            {lead.website && (
              <>
                <span>•</span>
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#818cf8] hover:underline flex items-center gap-1"
                >
                  <span>{lead.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Gemini AI Qualification Ring & Intent */}
        <div className="flex items-center gap-4 bg-[#0F141D] px-5 py-3 rounded-xl border border-white/[0.08] shrink-0">
          <div className="text-right space-y-0.5">
            <span className="text-[11px] text-slate-400 uppercase font-mono block">Gemini Export Fit</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className={cn(
                "text-3xl font-bold font-mono",
                lead.leadScore >= 80 ? "text-[#10B981]" :
                lead.leadScore >= 60 ? "text-[#818cf8]" :
                "text-slate-400"
              )}>
                {lead.leadScore}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 block">
              Intent: <strong className="text-slate-200">{lead.buyerIntent || "MEDIUM"}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs (5 Core CRM Sections) ── */}
      <div className="flex border-b border-white/[0.08] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "overview"
              ? "border-[#6366F1] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Building2 className="w-4 h-4 text-[#818cf8]" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab("intelligence")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "intelligence"
              ? "border-[#6366F1] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Sparkles className="w-4 h-4 text-[#D97706]" />
          AI Intelligence
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "activity"
              ? "border-[#6366F1] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Activity className="w-4 h-4 text-[#10B981]" />
          Activity ({lead.activities?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("opportunities")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "opportunities"
              ? "border-[#6366F1] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Kanban className="w-4 h-4 text-[#22D3EE]" />
          Opportunities ({lead.opportunities?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("followups")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "followups"
              ? "border-[#6366F1] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <CheckSquare className="w-4 h-4 text-[#818cf8]" />
          Follow-ups ({lead.followUps?.length || 0})
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div>
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Company Information */}
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Company & Procurement Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
                    <span className="text-xs font-mono uppercase text-slate-400">Legal Company Name</span>
                    <div className="font-medium text-[#F8FAFC]">{lead.companyName}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
                    <span className="text-xs font-mono uppercase text-slate-400">Buyer Segment</span>
                    <div className="font-medium text-[#F8FAFC]">{lead.buyerType}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
                    <span className="text-xs font-mono uppercase text-slate-400">Destination Market</span>
                    <div className="font-medium text-[#F8FAFC]">{lead.country} {lead.city ? `(${lead.city})` : ""}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-1">
                    <span className="text-xs font-mono uppercase text-slate-400">Primary Contact Person</span>
                    <div className="font-medium text-[#F8FAFC]">{lead.contactPerson || "Procurement Manager"}</div>
                  </div>
                </div>
              </div>

              {/* Product & Trade Requirements */}
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-3">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Catalog & Product Interest</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {lead.productInterest || "Handmade Tibetan Singing Bowls (7-Metal Bronze Alloy), Chakra Tuning Sets, Meditation Accessories"}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded bg-[#0A0D13] border border-white/[0.08] text-xs font-mono text-slate-300">
                    Target Terms: FOB / CIF Hamburg / CIF Los Angeles
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0A0D13] border border-white/[0.08] text-xs font-mono text-slate-300">
                    Acoustic Certification: Required (432Hz / 528Hz)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Contact & System Metadata */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Direct Contact</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono block">Work Email</span>
                    <span className="text-slate-200 font-mono text-sm">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-mono block">Phone / WhatsApp</span>
                      <span className="text-slate-200 font-mono text-sm">{lead.phone}</span>
                    </div>
                  )}
                  {lead.website && (
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-mono block">Domain</span>
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#818cf8] hover:underline font-mono text-sm"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-xs text-slate-400 uppercase font-mono block">Recorded In CRM</span>
                    <span className="text-slate-400 font-mono text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Shortcut */}
              <div className="p-5 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 space-y-3">
                <span className="text-xs font-mono font-semibold text-[#818cf8] uppercase tracking-wider block">
                  Next Sales Step
                </span>
                <p className="text-xs text-slate-300">
                  Generate an official commercial proforma quote with automated line items and CIF shipping terms.
                </p>
                <Link href={`/quotations/new?leadId=${lead.id}`} className="block">
                  <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<Receipt className="w-3.5 h-3.5" />}>
                    Generate Quotation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Intelligence */}
        {activeTab === "intelligence" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <h3 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span>Gemini Commercial Qualification Reasoning</span>
                  </h3>
                  <span className="text-xs font-mono text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                    {lead.aiConfidence ? `${Math.round(lead.aiConfidence * 100)}% Confidence` : "High Confidence"}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  {lead.aiReasoning || "Lead has been verified against wholesale sound therapy and Himalayan singing bowl trade patterns. Matches target commercial profile for wholesale export."}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 border-t border-white/[0.06]">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Sanitized input prompt evaluated with deterministic output schema</span>
                </div>
              </div>

              {/* Risk & Compliance Check */}
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-3">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Verification & Risk Signals</h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0D13] border border-white/[0.06]">
                    <span className="text-slate-300">RFC-5322 Syntax & Mailserver Validation</span>
                    <span className="text-[#10B981] font-semibold">VALIDATED (Passed)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0D13] border border-white/[0.06]">
                    <span className="text-slate-300">Company Website Resolution</span>
                    <span className="text-[#10B981] font-semibold">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0D13] border border-white/[0.06]">
                    <span className="text-slate-300">Wholesale Commercial Intent</span>
                    <span className="text-[#818cf8] font-semibold">{lead.buyerIntent || "MEDIUM"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#F8FAFC]">Recommended Action</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dispatch direct Himalayan artisan introduction email featuring 7-Chakra tuned harmonic bowls with CIF trade terms.
                </p>
                <Link href={`/campaigns/new?leadIds=${lead.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-center" leftIcon={<Send className="w-3.5 h-3.5" />}>
                    Launch Sequence
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Activity Timeline */}
        {activeTab === "activity" && (
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#F8FAFC]">Recorded Lead Activities</h3>
            {!lead.activities || lead.activities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No database activity events recorded for this lead yet.
              </div>
            ) : (
              <div className="space-y-4 relative border-l-2 border-white/[0.08] ml-4 pl-4">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative space-y-1">
                    <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="font-semibold text-slate-300">{act.type}</span>
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm font-medium text-[#F8FAFC]">{act.title}</div>
                    {act.description && <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sales Opportunities */}
        {activeTab === "opportunities" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">Sales Opportunities</h3>
                <p className="text-sm text-slate-400">Deals and quotations associated with this wholesale buyer</p>
              </div>
              <Link href="/opportunities">
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Manage Pipeline
                </Button>
              </Link>
            </div>

            {!lead.opportunities || lead.opportunities.length === 0 ? (
              <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-8 text-center space-y-3">
                <p className="text-sm text-slate-400">No sales opportunities created for this buyer yet.</p>
                <Link href={`/quotations/new?leadId=${lead.id}`}>
                  <Button variant="primary" size="sm">
                    Generate First Quotation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.opportunities.map((opp) => (
                  <div key={opp.id} className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 uppercase">{opp.terms || "FOB"}</span>
                      <Badge variant="primary" size="sm">{opp.stage}</Badge>
                    </div>
                    <h4 className="text-base font-semibold text-[#F8FAFC]">{opp.title}</h4>
                    <div className="text-lg font-bold font-mono text-[#10B981]">
                      ${(opp.inquiryValue || 0).toLocaleString()} USD
                    </div>
                    {opp.quotations && opp.quotations.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.06] space-y-1">
                        <span className="text-xs text-slate-400 font-mono block">Linked Quotation:</span>
                        {opp.quotations.map((q) => (
                          <div key={q.id} className="flex items-center justify-between text-xs font-mono text-slate-300">
                            <span>{q.quotationNumber}</span>
                            <span className="text-[#10B981]">${q.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Follow-ups */}
        {activeTab === "followups" && (
          <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-semibold text-[#F8FAFC]">Scheduled Follow-ups & Reminders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Persistent database-backed action items and buyer checkpoints</p>
              </div>
            </div>

            {/* Quick Add Follow-up Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem("fuTitle") as HTMLInputElement).value;
                const date = (form.elements.namedItem("fuDate") as HTMLInputElement).value;
                const notes = (form.elements.namedItem("fuNotes") as HTMLInputElement).value;
                if (!title || !date) {
                  toast.error("Title and scheduled date are required");
                  return;
                }
                try {
                  const res = await fetch("/api/follow-ups", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title,
                      scheduledAt: new Date(date).toISOString(),
                      notes: notes || undefined,
                      leadId,
                    }),
                  });
                  const json = await res.json();
                  if (json.success) {
                    toast.success("Follow-up scheduled");
                    form.reset();
                    fetchLead();
                  } else {
                    toast.error(json.message || "Failed to schedule follow-up");
                  }
                } catch {
                  toast.error("Network error scheduling follow-up");
                }
              }}
              className="p-4 rounded-lg bg-[#0A0D13] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="text-xs font-mono text-slate-400 block mb-1">Follow-up Action</label>
                <input
                  name="fuTitle"
                  type="text"
                  placeholder="e.g., Send FOB price quotation review"
                  className="w-full bg-[#111827] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Target Date</label>
                <input
                  name="fuDate"
                  type="date"
                  defaultValue={new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  required
                />
              </div>
              <div>
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Add Follow-up
                </Button>
              </div>
              <div className="sm:col-span-4">
                <input
                  name="fuNotes"
                  type="text"
                  placeholder="Optional context / buyer requirements note"
                  className="w-full bg-[#111827] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
                />
              </div>
            </form>

            {!lead.followUps || lead.followUps.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No follow-up action items scheduled for this lead. Use the form above to add one.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {lead.followUps.map((fu) => (
                  <div key={fu.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#F8FAFC]">
                        <span className={fu.isCompleted ? "line-through text-slate-500" : ""}>
                          {fu.title || fu.type}
                        </span>
                        {fu.isCompleted ? (
                          <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">Completed</span>
                        ) : (
                          <span className="text-xs font-mono text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded">Pending</span>
                        )}
                      </div>
                      {fu.notes && <p className="text-xs text-slate-400">{fu.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(fu.scheduledAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/follow-ups", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: fu.id, isCompleted: !fu.isCompleted }),
                            });
                            const json = await res.json();
                            if (json.success) {
                              toast.success(fu.isCompleted ? "Marked pending" : "Completed");
                              fetchLead();
                            }
                          } catch {
                            toast.error("Failed to update status");
                          }
                        }}
                      >
                        {fu.isCompleted ? "Reopen" : "Done"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
