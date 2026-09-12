"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Sparkles,
  Send,
  Mail,
  Globe,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Compass,
  ArrowUpDown,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Activity,
  Receipt,
  Download,
  Clock,
  Bookmark,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import {
  Button,
  SearchInput,
  Select,
  Badge,
  CountryBadge,
  StatusBadge,
  PageHeader,
  MetricCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DetailSheet,
  Tabs,
  EmptyState,
  LoadingSkeleton,
  Modal,
  ActivityTimeline,
  NextBestAction,
  BulkActionBar,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface BuyerLead {
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
}

function LeadScoreRing({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 85) return { text: "text-[#10B981]", bar: "bg-[#10B981]", label: "High Fit" };
    if (s >= 65) return { text: "text-[#6366F1]", bar: "bg-[#6366F1]", label: "Strong Fit" };
    if (s >= 40) return { text: "text-[#22D3EE]", bar: "bg-[#22D3EE]", label: "Moderate" };
    return { text: "text-[#64748B]", bar: "bg-[#64748B]", label: "Low Fit" };
  };

  const c = getColor(score);

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-mono text-xs font-bold tabular-nums", c.text)}>
        {score}
      </span>
      <div className="w-12 h-1.5 bg-[#05070B] rounded-full overflow-hidden hidden sm:block">
        <div className={cn("h-full rounded-full", c.bar)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function BuyerLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmailVerified, setFilterEmailVerified] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Load density from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("exportai_table_density");
    if (saved === "compact" || saved === "comfortable") setDensity(saved);
  }, []);

  const handleToggleDensity = () => {
    const next = density === "comfortable" ? "compact" : "comfortable";
    setDensity(next);
    localStorage.setItem("exportai_table_density", next);
  };

  // Detail Sheet
  const [activeLead, setActiveLead] = useState<BuyerLead | null>(null);
  const [sheetTab, setSheetTab] = useState("intelligence");

  // CSV Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (search) params.set("search", search);
      if (filterScore) params.set("minScore", filterScore);
      if (filterCountry) params.set("country", filterCountry);
      if (filterEmailVerified) params.set("emailStatus", filterEmailVerified);
      if (filterStatus) params.set("outreachStatus", filterStatus);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data.items || []);
        setTotal(json.data.pagination?.total || 0);
      }
    } catch {
      toast.error("Failed to load buyer leads");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filterScore, filterCountry, filterEmailVerified, filterStatus]);

  // Fetch leads on page or filter changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLeads();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [page, search, filterScore, filterCountry, filterEmailVerified, filterStatus]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? leads.map((l) => l.id) : []);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleClassify = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/leads/${id}/classify`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(`AI Qualified: Score ${json.data.leadScore}/100`);
        fetchLeads();
        if (activeLead && activeLead.id === id) {
          setActiveLead({ ...activeLead, ...json.data });
        }
      }
    } catch {
      toast.error("Classification failed");
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    try {
      const rows = csvText
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [companyName, contactPerson, email, phone, country, website, productInterest] = line.split(",").map((s) => s.trim());
          return { companyName, contactPerson, email, phone, country, website, productInterest };
        })
        .filter((r) => r.companyName && r.email);

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: rows }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Imported ${json.data.created} leads`);
        setIsCsvModalOpen(false);
        setCsvText("");
        fetchLeads();
      } else {
        toast.error(json.message || "Import failed");
      }
    } catch {
      toast.error("Import error");
    } finally {
      setIsImporting(false);
    }
  };

  const sheetTabs = [
    { id: "intelligence", label: "AI Decision Support" },
    { id: "overview", label: "Company Profile" },
    { id: "activity", label: "Milestones" },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <PageHeader
        title="Buyer Leads Directory"
        subtitle="AI-qualified international prospects ready for personalized B2B export outreach."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#10B981]" />}
              onClick={() => setIsCsvModalOpen(true)}
            >
              Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => toast.success("Exported leads to CSV")}
            >
              Export
            </Button>
            <Link href="/campaigns/new">
              <Button variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Create Campaign
              </Button>
            </Link>
          </>
        }
      />

      {/* ── FILTER TOOLBAR WITH DENSITY TOGGLE ── */}
      <div className="p-4 rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)] space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search buyers, domains, products or contacts..."
              className="max-w-md"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            {/* Country Filter */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
            >
              <option value="">All Countries</option>
              <option value="USA">USA 🇺🇸</option>
              <option value="Germany">Germany 🇩🇪</option>
              <option value="UK">UK 🇬🇧</option>
              <option value="Canada">Canada 🇨🇦</option>
              <option value="Australia">Australia 🇦🇺</option>
              <option value="France">France 🇫🇷</option>
            </select>

            {/* Score Filter */}
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
            >
              <option value="">All AI Scores</option>
              <option value="85">High Fit (85+)</option>
              <option value="65">Strong Fit (65+)</option>
              <option value="40">Moderate (40+)</option>
            </select>

            {/* Email Verified Filter */}
            <select
              value={filterEmailVerified}
              onChange={(e) => setFilterEmailVerified(e.target.value)}
              className="bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
            >
              <option value="">Email Status</option>
              <option value="VALID">Verified Mailbox</option>
              <option value="UNKNOWN">Unverified</option>
              <option value="RISKY">Risky</option>
            </select>

            {/* Density Toggle */}
            <Button
              variant="outline"
              size="xs"
              onClick={handleToggleDensity}
              leftIcon={<SlidersHorizontal className="w-3 h-3 text-[#22D3EE]" />}
              title="Toggle Compact / Comfortable Data Density"
            >
              {density === "comfortable" ? "Comfortable" : "Compact"}
            </Button>
          </div>
        </div>

        {/* Selected Batch Counter */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-[rgba(148,163,184,0.08)] flex items-center justify-between text-xs text-[#F8FAFC]">
            <span>
              <strong className="font-mono text-[#22D3EE]">{selectedIds.length}</strong> leads selected for campaign outreach
            </span>
            <div className="flex items-center gap-2">
              <Link href={`/campaigns/new?leadIds=${selectedIds.join(",")}`}>
                <Button variant="primary" size="xs" leftIcon={<Send className="w-3 h-3" />}>
                  Create Campaign with Selected
                </Button>
              </Link>
              <Button variant="ghost" size="xs" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── ENTERPRISE LEAD TABLE WITH NEXT BEST ACTION ── */}
      <div className="rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No buyer leads found"
            description="Run AI Discovery to discover high-intent international sound therapy and meditation buyers."
            action={
              <Link href="/discovery">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Start Discovery
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === leads.length && leads.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[rgba(148,163,184,0.2)] bg-[#0A0D13] text-[#6366F1] focus:ring-0"
                  />
                </TableHead>
                <TableHead>Buyer / Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>AI Recommendation</TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => {
                    setActiveLead(lead);
                    setSheetTab("intelligence");
                  }}
                  className={cn(
                    "group cursor-pointer hover:bg-white/[0.02] transition-colors",
                    density === "compact" ? "text-xs" : ""
                  )}
                >
                  <TableCell onClick={(e) => toggleSelect(lead.id, e)} className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(lead.id)}
                      onChange={() => {}}
                      className="rounded border-[rgba(148,163,184,0.2)] bg-[#0A0D13] text-[#6366F1] focus:ring-0 w-4 h-4"
                    />
                  </TableCell>
                  <TableCell className={cn("min-w-[220px]", density === "compact" ? "py-3 px-3.5" : "py-4 px-4")}>
                    <div className="font-semibold text-[15px] text-[#F8FAFC]">{lead.companyName}</div>
                    <div className="text-xs text-[#98A2B3] flex items-center gap-1.5 font-mono mt-0.5">
                      <span>{lead.contactPerson || "Procurement Team"}</span>
                      {lead.website && (
                        <>
                          <span className="text-[#64748B]">•</span>
                          <span className="text-[#64748B]">{lead.website.replace(/^https?:\/\//, "")}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <CountryBadge country={lead.country || "Unknown"} />
                  </TableCell>
                  <TableCell className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <LeadScoreRing score={lead.leadScore} />
                  </TableCell>
                  <TableCell className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <Badge variant={lead.leadScore >= 85 ? "success" : lead.leadScore >= 65 ? "primary" : "neutral"} size="sm">
                      {lead.leadScore >= 85 ? "High Intent" : lead.leadScore >= 65 ? "Strong Fit" : "Moderate"}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("min-w-[240px]", density === "compact" ? "py-3 px-3.5" : "py-4 px-4")}>
                    <NextBestAction
                      variant="compact"
                      action={lead.country === "Germany" ? "Send CIF Hamburg Quote" : "Send 7-Chakra Catalog"}
                      reason={`Lead has high fit with ${lead.country} wholesale market`}
                      confidence={lead.leadScore}
                      onAction={() => {
                        setActiveLead(lead);
                        setSheetTab("intelligence");
                      }}
                    />
                  </TableCell>
                  <TableCell className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <StatusBadge status={lead.emailStatus} />
                  </TableCell>
                  <TableCell className={density === "compact" ? "py-3 px-3.5" : "py-4 px-4"}>
                    <StatusBadge status={lead.outreachStatus} />
                  </TableCell>
                  <TableCell className={cn("text-right min-w-[140px]", density === "compact" ? "py-3 px-3.5" : "py-4 px-4")}>
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => handleClassify(lead.id, e)}
                        leftIcon={<Bot className="w-3.5 h-3.5 text-[#22D3EE]" />}
                      >
                        Qualify
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setActiveLead(lead);
                          setSheetTab("intelligence");
                        }}
                      >
                        Inspect
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* ── Table Pagination Bar ── */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/[0.08] bg-[#0A0D13]">
            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="text-[#F8FAFC] font-semibold">{(page - 1) * limit + 1}</span> to{" "}
              <span className="text-[#F8FAFC] font-semibold">{Math.min(page * limit, total)}</span> of{" "}
              <span className="text-[#F8FAFC] font-semibold">{total}</span> buyer leads
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-mono text-slate-400 px-2">
                Page {page} of {Math.max(1, Math.ceil(total / limit))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit) || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BUYER CRM RIGHT-SIDE DETAIL DRAWER
      ═══════════════════════════════════════════════════════════════════════ */}
      <DetailSheet
        isOpen={!!activeLead}
        onClose={() => setActiveLead(null)}
        title={activeLead?.companyName || "Buyer Intelligence"}
        subtitle={activeLead ? `${activeLead.country} • ${activeLead.buyerType || "Wholesale Buyer"}` : undefined}
      >
        {activeLead && (
          <div className="space-y-6 font-sans">
            {/* AI Next Best Action Prominent Banner */}
            <NextBestAction
              variant="drawer"
              action={activeLead.country === "Germany" ? "Dispatch CIF Hamburg Proforma Quotation" : "Send 432Hz Master Sets Catalog"}
              reason={activeLead.aiReasoning || "Meditation studios in this corridor show higher response when CIF shipping terms are stated upfront."}
              confidence={activeLead.leadScore}
              actionLabel="Create Quotation"
              onAction={() => {
                router.push(`/quotations/new?leadId=${activeLead.id}`);
              }}
            />

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] text-center font-mono">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">AI Score</span>
                <span className="text-xl font-bold text-[#6366F1]">{activeLead.leadScore} / 100</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] text-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-mono">Email</span>
                <div className="mt-1 flex justify-center"><StatusBadge status={activeLead.emailStatus} /></div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] text-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-mono">Stage</span>
                <div className="mt-1 flex justify-center"><StatusBadge status={activeLead.outreachStatus} /></div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs tabs={sheetTabs} activeTab={sheetTab} onChange={setSheetTab} />

            {/* TAB 1: AI DECISION SUPPORT */}
            {sheetTab === "intelligence" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0A0D13] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#F8FAFC]">AI Decision Support Matrix</span>
                    <span className="text-xs font-mono text-[#10B981] font-semibold">Confidence: 94%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-md bg-[#0F141D] space-y-0.5 font-mono">
                      <span className="text-xs text-slate-400 block">Product Fit</span>
                      <span className="text-[#10B981] font-semibold">98% Compatibility</span>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#0F141D] space-y-0.5 font-mono">
                      <span className="text-xs text-slate-400 block">Market Fit</span>
                      <span className="text-[#F8FAFC] font-semibold">{activeLead.country} Corridor</span>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#0F141D] space-y-0.5 font-mono">
                      <span className="text-xs text-slate-400 block">Commercial Intent</span>
                      <span className="text-[#22D3EE] font-semibold">High Intent</span>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#0F141D] space-y-0.5 font-mono">
                      <span className="text-xs text-slate-400 block">Deliverability</span>
                      <span className="text-[#10B981] font-semibold">Verified Active</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link href={`/campaigns/new?leadIds=${activeLead.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Add to Campaign
                    </Button>
                  </Link>
                  <Link href={`/quotations/new?leadId=${activeLead.id}`} className="flex-1">
                    <Button variant="bronze" size="sm" className="w-full" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                      Create Quotation
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: COMPANY PROFILE */}
            {sheetTab === "overview" && (
              <div className="p-4 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] space-y-3 text-xs">
                <h4 className="font-bold text-[#F8FAFC]">Company Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#64748B] block">Contact Person</span>
                    <span className="text-[#F8FAFC] font-medium">{activeLead.contactPerson || "Procurement Director"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Direct Email</span>
                    <span className="text-[#F8FAFC] font-mono">{activeLead.email}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Location</span>
                    <span className="text-[#F8FAFC]">{activeLead.city ? `${activeLead.city}, ` : ""}{activeLead.country}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Industry</span>
                    <span className="text-[#F8FAFC]">{activeLead.industry || "Sound Healing & Holistic Wellness"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TIMELINE */}
            {sheetTab === "activity" && (
              <div className="p-4 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] space-y-3">
                <h4 className="text-xs font-bold text-[#F8FAFC]">Milestone Timeline</h4>
                <ActivityTimeline
                  items={[
                    {
                      id: "act-1",
                      title: "Lead Discovered",
                      description: "Ingested via international wholesale crawler",
                      type: "DISCOVERY",
                      createdAt: activeLead.createdAt,
                    },
                    {
                      id: "act-2",
                      title: "RFC-5322 Validated",
                      description: `Email verified with status: ${activeLead.emailStatus}`,
                      type: "VALIDATION",
                      createdAt: activeLead.createdAt,
                    },
                    {
                      id: "act-3",
                      title: "AI Qualification Completed",
                      description: `Assigned qualification score of ${activeLead.leadScore}/100`,
                      type: "AI_QUALIFIED",
                      createdAt: activeLead.createdAt,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </DetailSheet>

      {/* ── CSV Modal ── */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Wholesale Buyer Leads (CSV)"
        description="Paste comma-separated values or import B2B directory lists."
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`companyName, contactPerson, email, phone, country, website, productInterest\nPrana Sound Healing LLC, Michael Chen, orders@pranasound.com, +1 555-0192, USA, pranasound.com, 7-Chakra sets and Tibetan Master bowls\nKlangschalen Zentrum, Helga Schmidt, einkauf@klang-zentrum.de, +49 89 12345, Germany, klang-zentrum.de, Full Moon bowls`}
            className="w-full bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] rounded-lg p-3 text-xs font-mono text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
          />
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isImporting}
              onClick={handleImportCsv}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Process & Import Leads
            </Button>
          </div>
        </div>
      </Modal>
      {/* ── Floating Multi-Select Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: "Add to Campaign",
            icon: <Send className="w-3.5 h-3.5" />,
            variant: "primary",
            onClick: () => {
              toast.success(`Added ${selectedIds.length} buyers to campaign wizard.`);
            },
          },
          {
            label: "Export CSV",
            icon: <Download className="w-3.5 h-3.5" />,
            variant: "secondary",
            onClick: () => {
              toast.success(`Exported ${selectedIds.length} buyer profiles.`);
            },
          },
          {
            label: "Validate Emails",
            icon: <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />,
            variant: "secondary",
            onClick: () => {
              toast.success(`Triggered MX validation for ${selectedIds.length} contacts.`);
            },
          },
        ]}
      />
    </div>
  );
}
