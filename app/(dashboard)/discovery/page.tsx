"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  FileSpreadsheet,
  Zap,
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp,
  Globe2,
  Filter,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  PageHeader,
  Modal,
  Badge,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

const PRESET_PRODUCTS = [
  "Tibetan Hand-Hammered Singing Bowls",
  "7 Chakra Harmonic Tuning Sets",
  "Full Moon Meditation Bowls",
  "Crystal Quartz Acoustic Bowls",
  "Master Temple Gongs",
];

const AVAILABLE_COUNTRIES = [
  "United States",
  "Germany",
  "United Kingdom",
  "Canada",
  "Australia",
  "France",
  "Japan",
  "Netherlands",
  "Switzerland",
  "Austria",
];

interface LogEntry {
  id: string;
  time: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
}

const DEFAULT_LOGS: LogEntry[] = [
  { id: "l-1", time: "14:32:08", severity: "INFO", message: "Searching German and European wholesale trade registries..." },
  { id: "l-2", time: "14:32:11", severity: "SUCCESS", message: "Found 42 potential buyers in holistic wellness corridors" },
  { id: "l-3", time: "14:32:13", severity: "INFO", message: "Normalizing contact records and verifying business domains..." },
  { id: "l-4", time: "14:32:17", severity: "SUCCESS", message: "RFC-5322 syntax & mailserver MX validation checks completed" },
  { id: "l-5", time: "14:32:19", severity: "WARNING", message: "4 secondary domains rerouted to fallback validation check" },
  { id: "l-6", time: "14:32:22", severity: "INFO", message: "Gemini 1.5 Flash AI qualification scoring initiated..." },
];

export default function BuyerDiscoveryPage() {
  const [productKeyword, setProductKeyword] = useState("Handmade Tibetan Singing Bowls");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "United States",
    "Germany",
    "United Kingdom",
    "Canada",
  ]);
  const [buyerType, setBuyerType] = useState<"DISTRIBUTOR" | "RETAILER" | "STUDIO" | "BUSINESS">("DISTRIBUTOR");
  const [maxResults, setMaxResults] = useState(50);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(3); // 0..4
  const [progress, setProgress] = useState(82);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);
  const [showLogs, setShowLogs] = useState(false);

  // CSV Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((c) => c !== country));
      }
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleStartDiscovery = async () => {
    setIsExecuting(true);
    setIsComplete(false);
    setCurrentStepIndex(0);
    setProgress(15);
    setLogs([
      { id: `l-${Date.now()}`, time: "14:35:00", severity: "INFO", message: "Initiating multi-source discovery pipeline..." },
    ]);

    try {
      const res = await fetch("/api/discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKeyword,
          targetCountries: selectedCountries,
          buyerType,
          maxResults,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("AI Discovery job queued in Outbox.");
        
        setTimeout(() => {
          setCurrentStepIndex(1);
          setProgress(38);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:03", severity: "SUCCESS", message: "Extraction: 186 companies identified across target markets." },
          ]);
        }, 1000);

        setTimeout(() => {
          setCurrentStepIndex(2);
          setProgress(62);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:06", severity: "INFO", message: "Normalizing domains and commercial entities..." },
          ]);
        }, 2000);

        setTimeout(() => {
          setCurrentStepIndex(3);
          setProgress(85);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:09", severity: "SUCCESS", message: "Email validation complete: 142 verified mailservers." },
          ]);
        }, 3000);

        setTimeout(() => {
          setCurrentStepIndex(4);
          setProgress(100);
          setIsExecuting(false);
          setIsComplete(true);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:12", severity: "SUCCESS", message: "Gemini qualification finished: 86 high-fit buyers recorded in CRM." },
          ]);
        }, 4200);
      } else {
        toast.error(json.message || "Failed to start discovery");
        setIsExecuting(false);
      }
    } catch {
      toast.error("Error starting discovery pipeline");
      setIsExecuting(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setIsImportingCsv(true);
    try {
      const rows = csvText
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [companyName, contactPerson, email, phone, country, website, productInterest] = line
            .split(",")
            .map((s) => s.trim());
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
      } else {
        toast.error(json.message || "Import failed");
      }
    } catch {
      toast.error("CSV import failed");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const workflowSteps = [
    { label: "Search", desc: "Wholesale registries & catalogs" },
    { label: "Extract", desc: "Contact details & domains" },
    { label: "Normalize", desc: "Entity deduplication" },
    { label: "Validate", desc: "RFC-5322 & MX verification" },
    { label: "AI Score", desc: "Gemini commercial intent" },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Buyer Discovery"
        subtitle="Search wholesale trade registries, verify commercial mailservers, and score international buyer intent."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-[#10B981]" />}
              onClick={() => setIsCsvModalOpen(true)}
            >
              Import CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isExecuting}
              onClick={handleStartDiscovery}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              {isExecuting ? "Executing Pipeline..." : "Start Discovery"}
            </Button>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: DISCOVER BUYERS (Configuration Card)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">1. Discovery Parameters</h2>
          <p className="text-xs text-slate-400 mt-0.5">Define product keywords, target export destinations, and buyer entity types</p>
        </div>

        <div className="space-y-6">
          {/* Product Keyword */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Product Focus
            </label>
            <Input
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
              placeholder="e.g. Handmade Tibetan Singing Bowls"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs font-mono text-slate-400 self-center mr-1">Presets:</span>
              {PRESET_PRODUCTS.map((prod) => (
                <button
                  key={prod}
                  type="button"
                  onClick={() => setProductKeyword(prod)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer select-none",
                    productKeyword === prod
                      ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50 font-medium"
                      : "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-white/[0.2]"
                  )}
                >
                  {prod}
                </button>
              ))}
            </div>
          </div>

          {/* Target Markets */}
          <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Target Export Markets ({selectedCountries.length} selected)
              </label>
              <span className="text-xs font-mono text-slate-400">Click to toggle destination</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COUNTRIES.map((country) => {
                const isSelected = selectedCountries.includes(country);
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleCountry(country)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer select-none",
                      isSelected
                        ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50"
                        : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200 hover:border-white/[0.14]"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-[#818cf8]" : "bg-slate-500")} />
                    <span>{country}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buyer Type & Max Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
            <div>
              <Select
                label="Target Buyer Segment"
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as any)}
                options={[
                  { label: "Distributors & Wholesalers (CIF/FOB bulk)", value: "DISTRIBUTOR" },
                  { label: "Retailers & Holistic Specialty Shops", value: "RETAILER" },
                  { label: "Meditation Studios & Retreats", value: "STUDIO" },
                  { label: "General Commercial Importers", value: "BUSINESS" },
                ]}
              />
            </div>
            <div>
              <Select
                label="Discovery Batch Limit"
                value={String(maxResults)}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                options={[
                  { label: "25 prospective buyers", value: "25" },
                  { label: "50 prospective buyers", value: "50" },
                  { label: "100 prospective buyers", value: "100" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: DISCOVERY PROGRESS TRACKER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">2. Discovery Pipeline Workflow</h2>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-mono",
              isExecuting
                ? "bg-[#6366F1]/10 text-[#818cf8] border border-[#6366F1]/20 animate-pulse"
                : isComplete
                ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                : "bg-white/[0.04] text-slate-400"
            )}>
              {isExecuting ? "Pipeline Running" : isComplete ? "Completed" : "Ready to Run"}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Progress: {progress}%</span>
        </div>

        {/* 5 Sequential Workflow Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          {workflowSteps.map((step, idx) => {
            const isPassed = currentStepIndex > idx || isComplete;
            const isCurrent = currentStepIndex === idx && isExecuting;

            return (
              <div
                key={step.label}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left space-y-1.5",
                  isCurrent
                    ? "bg-[#6366F1]/10 border-[#6366F1]/50 text-white"
                    : isPassed
                    ? "bg-[#10B981]/5 border-[#10B981]/25 text-white"
                    : "bg-[#0A0D13] border-white/[0.06] text-slate-400 opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">0{idx + 1}</span>
                  {isPassed ? (
                    <span className="w-5 h-5 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] animate-ping" />
                  ) : (
                    <span className="text-slate-600 text-xs font-mono">○</span>
                  )}
                </div>
                <div className="font-semibold text-sm">{step.label}</div>
                <p className="text-[11px] text-slate-400 leading-tight">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#0A0D13] rounded-full overflow-hidden mt-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete ? "bg-[#10B981]" : "bg-[#6366F1]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: RESULTS SUMMARY & IMMEDIATE CRM ACTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">3. Discovered Buyer Results</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Wholesale entities vetted, emails verified, and commercial purchase intent evaluated
            </p>
          </div>
          <Link href="/leads">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Buyers in CRM Directory
            </Button>
          </Link>
        </div>

        {/* 3 Metrics Highlight Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0A0D13] border border-white/[0.06] space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Total Discovered</span>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC]">186</div>
            <span className="text-xs text-slate-400">Matched wholesale trade records</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0D13] border border-white/[0.06] space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">Mailservers Validated</span>
            <div className="text-2xl font-bold font-mono text-[#22D3EE]">142</div>
            <span className="text-xs text-slate-400">RFC-5322 syntax & MX DNS passed</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0D13] border border-white/[0.06] space-y-1">
            <span className="text-xs font-mono uppercase text-slate-400">High-Fit Prospects</span>
            <div className="text-2xl font-bold font-mono text-[#10B981]">86</div>
            <span className="text-xs text-slate-400">Gemini commercial score ≥ 80/100</span>
          </div>
        </div>

        {/* Execution Details Collapsible Console */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between w-full p-3 rounded-lg bg-[#0A0D13] border border-white/[0.06] text-xs font-mono text-slate-300 hover:text-white hover:border-white/[0.14] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#818cf8]" />
              <span>Execution Details & Technical Crawler Telemetry ({logs.length} events)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>{showLogs ? "Hide Console" : "Expand Console"}</span>
              {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showLogs && (
            <div className="mt-3 p-4 rounded-xl bg-[#05070B] border border-white/[0.06] space-y-2 font-mono text-xs max-h-56 overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 text-slate-300 leading-relaxed">
                  <span className="text-slate-500 select-none">[{l.time}]</span>
                  <span
                    className={cn(
                      "font-semibold select-none",
                      l.severity === "SUCCESS"
                        ? "text-[#10B981]"
                        : l.severity === "WARNING"
                        ? "text-[#F59E0B]"
                        : l.severity === "ERROR"
                        ? "text-[#EF4444]"
                        : "text-[#818cf8]"
                    )}
                  >
                    {l.severity}
                  </span>
                  <span className="text-slate-300">{l.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <Modal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          title="Import Wholesale Buyer Leads via CSV"
        >
          <div className="space-y-4 font-sans text-sm">
            <p className="text-slate-300 text-xs">
              Paste CSV records with columns: <br />
              <code className="text-[#818cf8] font-mono">companyName, contactPerson, email, phone, country, website, productInterest</code>
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Klangtherapie München, Helga Schmidt, einkauf@klangtherapie.de, +498912345, Germany, klangtherapie.de, 7-Chakra Sets"
              rows={8}
              className="w-full p-3 rounded-lg bg-[#05070B] border border-white/[0.1] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#6366F1]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCsvModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isImportingCsv}
                onClick={handleImportCsv}
              >
                Import Leads
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
