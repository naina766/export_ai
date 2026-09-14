"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Users,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Package,
  ShieldCheck,
  Check,
  Building2,
  RotateCcw,
  Edit,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  ScoreBadge,
  CountryBadge,
  PageHeader,
} from "@/components/ui";
import toast from "react-hot-toast";

interface Lead {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string;
  country: string;
  leadScore: number;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

const STEPS = [
  { id: 1, label: "01 Audience" },
  { id: 2, label: "02 Product" },
  { id: 3, label: "03 Template" },
  { id: 4, label: "04 AI Personalization" },
  { id: 5, label: "05 Review" },
  { id: 6, label: "06 Launch" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeadIds = searchParams.get("leadIds")?.split(",") || [];

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Q3 Singing Bowls Wholesale Outreach");
  const [subject, setSubject] = useState("Direct Himalayan Artisan Supply: Premium Handcrafted Singing Bowls for {{companyName}}");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(3000);
  const [isApproved, setIsApproved] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(initialLeadIds);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/leads?limit=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setLeads(res.data.items || []);
          if (initialLeadIds.length === 0 && res.data.items?.length > 0) {
            setSelectedLeadIds(res.data.items.slice(0, 5).map((l: Lead) => l.id));
          }
        }
      });

    fetch("/api/templates")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setTemplates(res.data);
          setSelectedTemplateId(res.data[0].id);
          setSubject(res.data[0].subject);
        }
      });

    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.items?.length > 0) {
          setProducts(res.data.items);
          setSelectedProductId(res.data.items[0].id);
        }
      });
  }, []);

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = templates.find((t) => t.id === tplId);
    if (found) setSubject(found.subject);
  };

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleCreateAndLaunch = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error("Please select at least one recipient lead.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          productId: selectedProductId || undefined,
          templateId: selectedTemplateId || undefined,
          leadIds: selectedLeadIds,
          dailyLimit: Number(dailyLimit),
          delayBetweenEmails: Number(delayBetweenEmails),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Campaign created with precomputed AI personalized copy!");
        router.push(`/campaigns/${json.data.id}`);
      } else {
        const fieldErrors = json.errors?.fieldErrors;
        const detailMsg = fieldErrors
          ? Object.entries(fieldErrors)
              .map(([key, errs]) => `${key}: ${(errs as string[]).join(", ")}`)
              .join("; ")
          : null;
        toast.error(detailMsg || json.message || "Failed to create campaign");
      }
    } catch {
      toast.error("Network error during campaign creation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <PageHeader
        title="Create Outreach Campaign"
        subtitle="6-step sequence wizard with precomputed Gemini AI personalization and human review."
        actions={
          <Link href="/campaigns">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Campaigns
            </Button>
          </Link>
        }
      />

      {/* ── Stepper ── */}
      <div className="grid grid-cols-6 gap-2 p-1.5 rounded-xl bg-[#0D1118] border border-white/[0.08]">
        {STEPS.map((s) => {
          const isCurrent = step === s.id;
          const isPassed = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => isPassed && setStep(s.id)}
              disabled={!isPassed && !isCurrent}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-[#151C28] text-[#F5F7FA]"
                  : isPassed
                  ? "text-[#10B981] hover:bg-[#151C28]"
                  : "text-slate-500 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono ${
                  isPassed
                    ? "bg-[#10B981]/20 text-[#10B981]"
                    : isCurrent
                    ? "bg-[#6366F1] text-white"
                    : "bg-[#111722] text-slate-500"
                }`}
              >
                {isPassed ? <Check className="w-3 h-3" /> : s.id}
              </span>
              <span className="hidden sm:inline truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step 1: Audience ── */}
      {step === 1 && (
        <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">Step 1: Campaign Audience & Recipients</h3>
            <p className="text-sm leading-6 text-slate-400">Select verified buyers for this targeted outreach wave ({selectedLeadIds.length} chosen)</p>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl bg-[#111722]">
            {leads.map((l) => {
              const isSelected = selectedLeadIds.includes(l.id);
              return (
                <div
                  key={l.id}
                  onClick={() => handleToggleLead(l.id)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-[#151C28]" : "hover:bg-[#1A2434]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-white/[0.2] bg-[#080A0F] text-[#6366F1] focus:ring-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#F5F7FA]">{l.companyName}</p>
                      <p className="text-xs text-slate-400 font-mono">{l.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CountryBadge country={l.country || "Unknown"} />
                    <ScoreBadge score={l.leadScore} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Continue to Product
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Product ── */}
      {step === 2 && (
        <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">Step 2: Select Featured Product</h3>
            <p className="text-sm leading-6 text-slate-400">Attach export catalog item to feature in email copy</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#6366F1]/10 border-[#6366F1]"
                      : "bg-[#111722] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#F5F7FA] truncate">{p.name}</h4>
                    {isSelected && <Check className="w-4 h-4 text-[#6366F1]" />}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">SKU: {p.sku}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Continue to Template
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Template ── */}
      {step === 3 && (
        <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-5">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">Step 3: Email Subject & Baseline Template</h3>
            <p className="text-sm leading-6 text-slate-400">Name your campaign and configure template baseline</p>
          </div>

          <div className="space-y-5">
            <Input
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 North America Wellness Distributors"
              required
            />
            <Input
              label="Subject Line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Direct Artisan Supply: Himalayan Singing Bowls for {{companyName}}"
              required
            />
            <Select
              label="Baseline Outreach Template"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              options={templates.map((t) => ({ label: t.name, value: t.id }))}
            />
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Continue to AI Personalization
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: AI Personalization (Side-by-Side: Buyer Profile & Generated Copy) ── */}
      {step === 4 && (
        <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">Step 4: AI Personalization Preview</h3>
              <p className="text-sm leading-6 text-slate-400">Gemini 1.5 Flash generates tailored hooks for each verified buyer profile</p>
            </div>
            <span className="text-xs font-mono text-[#D97706] font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> Confidence: 94%
            </span>
          </div>

          {/* Side-by-Side Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Buyer Profile */}
            <div className="p-5 rounded-xl bg-[#111722] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F7FA]">Klangtherapie Zentrum München</h4>
                  <p className="text-xs text-slate-400">Munich, Germany • Sound Therapy Center</p>
                </div>
                <ScoreBadge score={94} />
              </div>

              <div>
                <span className="text-xs uppercase font-mono font-medium text-slate-400 tracking-wider block">AI Commercial Reasoning</span>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  &ldquo;German wellness studio with existing sound therapy offering and active procurement in handcrafted 432Hz 7-Chakra sets.&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-xs text-slate-400 font-mono">
                Target Incoterm: CIF Hamburg
              </div>
            </div>

            {/* Right: Generated Email */}
            <div className="p-5 rounded-xl bg-[#111722] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-[#F8FAFC]">Generated Email Copy</span>
                <Badge variant={isApproved ? "success" : "warning"} size="sm">
                  {isApproved ? "Approved" : "Needs Review"}
                </Badge>
              </div>

              <div className="p-3.5 rounded-lg bg-[#080A0F] border border-white/[0.06] text-sm text-slate-300 space-y-2 font-mono leading-relaxed max-h-48 overflow-y-auto">
                <p className="text-[#6366F1]">Subject: Direct Himalayan Artisan Supply: 432Hz Master Singing Bowls for Klangtherapie Zentrum</p>
                <p>Dear Procurement Team at Klangtherapie Zentrum,</p>
                <p>I noticed your dedicated sound therapy practice in Munich. As direct Himalayan artisan producers, we craft authentic 7-metal hand-hammered singing bowls and 432Hz tuned chakra sets specifically suited for professional acoustic therapy.</p>
                <p>We provide wholesale FOB and CIF Hamburg pricing with complete acoustic frequency certificates. Would you be open to reviewing our 2026 export catalog?</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => toast.success("AI regenerated hook")}>
                  Regenerate
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Approve copy:</span>
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    className="rounded border-white/[0.2] bg-[#080A0F] text-[#6366F1] focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(5)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Review Configuration
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">Step 5: Review Campaign Parameters</h3>
            <p className="text-sm leading-6 text-slate-400">Confirm dispatch volume, rate limits, and worker outbox routing</p>
          </div>

          <div className="p-5 rounded-xl bg-[#111722] border border-white/[0.06] space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Campaign Name:</span>
              <span className="font-medium text-[#F5F7FA]">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Audience:</span>
              <span className="font-mono text-[#10B981] font-medium">{selectedLeadIds.length} verified buyer leads</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Send Limit:</span>
              <span className="font-mono text-[#F5F7FA]">{dailyLimit} emails / day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Queue Architecture:</span>
              <span className="text-[#6366F1] font-mono">RabbitMQ Transactional Outbox</span>
            </div>
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="md" onClick={() => setStep(4)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(6)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Proceed to Launch
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 6: Launch ── */}
      {step === 6 && (
        <div className="p-8 rounded-xl bg-[#0F141D] border border-white/[0.08] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center mx-auto">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#F5F7FA]">Launch Outreach Wave</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Dispatches sequence to RabbitMQ queue with precomputed Gemini AI personalization.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="ghost" size="md" onClick={() => setStep(5)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleCreateAndLaunch}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Confirm & Launch Sequence
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
