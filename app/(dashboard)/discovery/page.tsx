"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  FileSpreadsheet,
  Zap,
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  PageHeader,
  Modal,
  cn,
} from "@/components/ui";
import { DiscoveryExecutionLog, LogEntry, PipelineStage } from "@/components/discovery/DiscoveryExecutionLog";
import toast from "react-hot-toast";

const PRESET_PRODUCTS = [
  "Tibetan Hand-Hammered",
  "7 Chakra Tuning Sets",
  "Full Moon Bowls",
  "Crystal Quartz Bowls",
  "Temple Gongs",
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

const DEFAULT_LOGS: LogEntry[] = [
  { id: "l-1", time: "14:32:08", severity: "INFO", message: "Searching German and European wholesale trade registries..." },
  { id: "l-2", time: "14:32:11", severity: "SUCCESS", message: "Found 42 potential buyers in holistic wellness corridors" },
  { id: "l-3", time: "14:32:13", severity: "INFO", message: "Normalizing contact records and verifying business domains..." },
  { id: "l-4", time: "14:32:17", severity: "SUCCESS", message: "RFC-5322 syntax & mailserver MX validation checks completed" },
  { id: "l-5", time: "14:32:19", severity: "WARNING", message: "4 secondary domains rerouted to fallback validation check" },
  { id: "l-6", time: "14:32:22", severity: "INFO", message: "Gemini 1.5 Flash AI qualification scoring initiated..." },
];

export default function BuyerDiscoveryPage() {
  const [productKeyword, setProductKeyword] = useState("Singing Bowls");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "United States",
    "Germany",
    "United Kingdom",
    "France",
  ]);
  const [buyerType, setBuyerType] = useState<"BUSINESS" | "DISTRIBUTOR" | "STUDIO" | "RETAILER">("DISTRIBUTOR");
  const [maxResults, setMaxResults] = useState(50);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(78);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);

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
    setProgress(20);
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
        toast.success("AI Discovery job queued in RabbitMQ outbox.");
        setTimeout(() => {
          setProgress(45);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:04", severity: "SUCCESS", message: "Extraction completed: 180 companies found." },
          ]);
        }, 1200);

        setTimeout(() => {
          setProgress(75);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:08", severity: "INFO", message: "Gemini AI scoring buyer commercial intent..." },
          ]);
        }, 2400);

        setTimeout(() => {
          setProgress(100);
          setIsExecuting(false);
          setIsComplete(true);
          setLogs((prev) => [
            ...prev,
            { id: `l-${Date.now()}`, time: "14:35:12", severity: "SUCCESS", message: "Discovery complete: 86 high-fit buyers added to CRM." },
          ]);
        }, 3600);
      } else {
        toast.error(json.message || "Failed to start discovery");
        setIsExecuting(false);
      }
    } catch {
      toast.error("Error starting discovery");
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
      } else {
        toast.error(json.message || "Import failed");
      }
    } catch {
      toast.error("CSV import failed");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const stages: PipelineStage[] = [
    { id: "s-1", stepNum: "01", label: "Search", status: "COMPLETED", count: 428 },
    { id: "s-2", stepNum: "02", label: "Extract", status: "COMPLETED", count: 284 },
    { id: "s-3", stepNum: "03", label: "Normalize", status: "COMPLETED", count: 210 },
    { id: "s-4", stepNum: "04", label: "Validate", status: isExecuting ? "RUNNING" : "COMPLETED", count: 186 },
    { id: "s-5", stepNum: "05", label: "AI Score", status: isExecuting ? "RUNNING" : isComplete ? "COMPLETED" : "QUEUED", count: 86 },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Buyer Discovery"
        subtitle="Find and qualify international wholesale buyers for your export catalog."
        actions={
          <>
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
          </>
        }
      />

      {/* ── Completion Banner (Non-intrusive) ── */}
      {isComplete && (
        <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between animate-fade-in text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[#F8FAFC]">Discovery Execution Completed</span>
              <p className="text-slate-400 text-xs mt-0.5">
                428 buyers discovered • 86 high-intent prospects qualified with verified emails.
              </p>
            </div>
          </div>
          <Link href="/leads">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Buyers in CRM
            </Button>
          </Link>
        </div>
      )}

      {/* ── 12-Column Grid: Discovery Configuration (7 cols) vs Live Execution (5 cols) ── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ─────────────────────────────────────────────────────────────────
            LEFT COLUMN (7 cols / 12): Discovery Configuration
        ───────────────────────────────────────────────────────────────── */}
        <section className="col-span-12 xl:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">Discovery Configuration</h2>
              <p className="text-sm leading-6 text-slate-400">Specify targeted products, export corridors, and buyer segment</p>
            </div>

            <div className="space-y-6">
              {/* Product Focus */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300 block">
                  Product Focus
                </label>
                <Input
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                  placeholder="e.g. Singing Bowls"
                />

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-mono text-slate-400 block">Preset Products:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PRODUCTS.map((prod) => (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => setProductKeyword(prod)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer select-none",
                          productKeyword === prod
                            ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50 font-medium"
                            : "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-500/10"
                        )}
                      >
                        {prod}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Markets Multi-select */}
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Target Markets
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedCountries.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COUNTRIES.map((c) => {
                    const isSelected = selectedCountries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCountry(c)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm border transition-colors flex items-center gap-1.5 cursor-pointer select-none",
                          isSelected
                            ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50 font-medium"
                            : "bg-[#0A0D13] text-slate-400 border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.03]"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buyer Type Segmented Control */}
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <label className="text-sm font-medium text-slate-300 block">
                  Buyer Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["BUSINESS", "DISTRIBUTOR", "STUDIO", "RETAILER"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBuyerType(type)}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition-colors cursor-pointer capitalize",
                        buyerType === type
                          ? "bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/50 font-semibold"
                          : "bg-[#0A0D13] text-slate-400 border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.03]"
                      )}
                    >
                      {type.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maximum Results */}
              <div className="pt-2 border-t border-white/[0.06]">
                <Select
                  label="Maximum Results"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  options={[
                    { label: "25 high-priority buyers", value: 25 },
                    { label: "50 standard prospects", value: 50 },
                    { label: "100 comprehensive batch", value: 100 },
                    { label: "250 maximum export quota", value: 250 },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT COLUMN (5 cols / 12): Live Discovery Execution Pipeline
        ───────────────────────────────────────────────────────────────── */}
        <section className="col-span-12 xl:col-span-5 space-y-6">
          <DiscoveryExecutionLog
            stages={stages}
            logs={logs}
            progress={progress}
            totalRecords={550}
            processedRecords={428}
            elapsedTime={isExecuting ? "18s" : "42s"}
          />
        </section>
      </div>

      {/* ── Operational Metric Strip (Below configuration) ── */}
      <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden">
        <div className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Leads Found</span>
          <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] font-mono tabular-nums">428</div>
          <span className="text-xs font-mono text-[#22C55E]">Indexed across 10 markets</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Validated</span>
          <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] font-mono tabular-nums">284</div>
          <span className="text-xs font-mono text-[#22C55E]">Active mailboxes verified</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">AI Qualified</span>
          <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] font-mono tabular-nums">86</div>
          <span className="text-xs font-mono text-[#818cf8]">High commercial fit</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Duplicates</span>
          <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] font-mono tabular-nums">14</div>
          <span className="text-xs font-mono text-slate-500">Auto-deduplicated</span>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Invalid Emails</span>
          <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] font-mono tabular-nums">4</div>
          <span className="text-xs font-mono text-amber-400">Removed from pipeline</span>
        </div>
      </div>

      {/* ── CSV Modal ── */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Custom Buyer Lists (CSV)"
        description="Upload existing supplier contacts, trade fair lists, or directory leads."
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`companyName, contactPerson, email, phone, country, website, productInterest\nPrana Sound Healing LLC, Michael Chen, orders@pranasound.com, +1 555-0192, United States, pranasound.com, 7-Chakra sets and Tibetan Master bowls\nKlangschalen Zentrum, Helga Schmidt, einkauf@klang-zentrum.de, +49 89 12345, Germany, klang-zentrum.de, Full Moon bowls`}
            className="w-full bg-[#0A0D13] border border-white/[0.08] rounded-lg p-3.5 text-sm font-mono text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
          />
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="md" onClick={() => setIsCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isImportingCsv}
              onClick={handleImportCsv}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Import Leads
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
