"use client";
import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Copy,
  Sparkles,
  Code2,
  Search,
  Check,
  Zap,
  Globe2,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
  isDefault: boolean;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "German Meditation Studios Hook (CIF Hamburg)",
    subject: "Direct Himalayan Artisan Supply: 432Hz Master Singing Bowls for {{companyName}}",
    body: "Dear {{contactPerson}},\n\nAs direct Himalayan artisan producers in the Kathmandu Valley, we craft authentic 7-metal hand-hammered singing bowls and tuned 432Hz harmonic sets with complete acoustic frequency certificates.\n\nWe provide wholesale FOB and CIF European port pricing. Would you be open to reviewing our 2026 export catalog?",
    variables: ["companyName", "contactPerson", "country"],
    category: "DACH Region",
    isDefault: true,
  },
  {
    id: "tpl-2",
    name: "USA Sound Therapy Clinics Introduction",
    subject: "Artisan 7-Chakra Tuning Sets & Acoustic Certificates for {{companyName}}",
    body: "Hi {{contactPerson}},\n\nWe specialize in exporting certified 432Hz 7-chakra meditation sets and master Tibetan hand-hammered bowls directly to North American holistic centers.\n\nOur minimum wholesale order is 10 sets with direct door-to-door air freight. Can I send our wholesale price list?",
    variables: ["companyName", "contactPerson"],
    category: "North America",
    isDefault: false,
  },
  {
    id: "tpl-3",
    name: "UK & Nordic Wholesale Re-engagement",
    subject: "Export Price List & Sample Availability: Full Moon Energized Bowls",
    body: "Dear {{contactPerson}},\n\nFollowing up on our artisan singing bowls catalog, we now have new stock of Full Moon energized bowls and temple gongs ready for export dispatch.\n\nWould you like a sample evaluation unit dispatched this week?",
    variables: ["companyName", "contactPerson"],
    category: "Re-engagement",
    isDefault: false,
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Wholesale Outreach");

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setTemplates(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    if (!name || !subject || !body) {
      toast.error("Please fill in all template fields");
      return;
    }

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, body, category }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Template saved successfully");
        setIsModalOpen(false);
        setName("");
        setSubject("");
        setBody("");
        fetchTemplates();
      }
    } catch {
      toast.error("Failed to save template");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <PageHeader
        title="Email Outreach Templates"
        subtitle="Reusable export sales email copy with dynamic template tags and Gemini AI personalization tokens."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Template
          </Button>
        }
      />

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#0F141D] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates or subjects..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "DACH Region", "North America", "Re-engagement", "Wholesale Outreach"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-[#6366F1]/10 text-[#818cf8] border-[#6366F1]/40 font-medium"
                  : "bg-[#0A0D13] text-slate-400 border-white/[0.08] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
              )}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── TEMPLATES GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-6 rounded-xl bg-[#0F141D] border border-white/[0.08] hover:border-white/[0.2] transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#F8FAFC]">{tpl.name}</h3>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">{tpl.category}</span>
                </div>
                {tpl.isDefault && <Badge variant="primary" size="sm">Default</Badge>}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-mono">Subject</span>
                <p className="text-sm font-mono text-[#22D3EE] line-clamp-1 bg-[#0A0D13] p-2.5 rounded-lg border border-white/[0.06]">
                  {tpl.subject}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-mono">Email Body Copy</span>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-4 bg-[#0A0D13] p-3.5 rounded-lg border border-white/[0.06] whitespace-pre-line font-mono">
                  {tpl.body}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {"{{companyName}} • {{contactPerson}}"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(tpl.body);
                  toast.success("Template copied to clipboard");
                }}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Template Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Email Outreach Template"
        description="Configure dynamic variables like {{companyName}} and {{contactPerson}}."
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. German CIF Hamburg Wholesale Hook"
          />
          <Input
            label="Subject Line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Direct Himalayan Supply: 432Hz Master Singing Bowls for {{companyName}}"
          />
          <Textarea
            label="Email Body"
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Dear {{contactPerson}},\n\nI am reaching out regarding authentic handcrafted singing bowls..."
          />
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreate}>
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
