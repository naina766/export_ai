"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Send, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { Card, Button, Input, Select, Textarea, PageHeader } from "@/components/ui";
import toast from "react-hot-toast";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    country: "Germany",
    city: "",
    buyerType: "DISTRIBUTOR",
    buyerIntent: "HIGH",
    productInterest: "Handmade Tibetan Singing Bowls",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setErrors({ companyName: "Company name is required." });
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setErrors({ email: "Valid business email is required." });
      return;
    }
    if (!form.country.trim()) {
      setErrors({ country: "Country is required." });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors?.fieldErrors) {
          setErrors(
            Object.fromEntries(
              Object.entries(data.errors.fieldErrors).map(([k, v]) => [k, (v as string[])[0]])
            )
          );
        }
        throw new Error(data.message || "Failed to create lead");
      }
      toast.success("Buyer lead created and queued for Gemini AI qualification!");
      router.push(`/leads/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 font-sans">
      <PageHeader
        title="Add Wholesale Buyer Lead"
        subtitle="Record a prospective international wholesale buyer for automated AI scoring and outreach."
        actions={
          <Link href="/leads">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Directory
            </Button>
          </Link>
        }
      />

      <div className="p-6 rounded-xl bg-[#0B0F14] border border-white/[0.08] space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Company Profile */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-semibold uppercase text-slate-400 tracking-wider">
              Company & Geography
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Company Name *"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="e.g. Klangtherapie Zentrum GmbH"
                  error={errors.companyName}
                  required
                />
              </div>
              <div>
                <Input
                  label="Target Country *"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="e.g. Germany, USA, UK"
                  error={errors.country}
                  required
                />
              </div>
              <div>
                <Input
                  label="City / Region"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Munich, Bavaria"
                />
              </div>
              <div>
                <Input
                  label="Website"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="e.g. klangtherapie.de"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4 pt-4 border-t border-white/[0.06]">
            <h3 className="text-sm font-mono font-semibold uppercase text-slate-400 tracking-wider">
              Procurement Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Contact Person"
                  value={form.contactPerson}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                  placeholder="e.g. Helga Schmidt"
                />
              </div>
              <div>
                <Input
                  label="Commercial Email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="einkauf@klangtherapie.de"
                  error={errors.email}
                  required
                />
              </div>
              <div>
                <Input
                  label="Phone / WhatsApp"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+49 89 123456"
                />
              </div>
              <div>
                <Select
                  label="Buyer Type"
                  value={form.buyerType}
                  onChange={(e) => handleChange("buyerType", e.target.value)}
                  options={[
                    { label: "Distributor / Wholesaler", value: "DISTRIBUTOR" },
                    { label: "Retailer / Chain", value: "RETAILER" },
                    { label: "Meditation / Sound Studio", value: "STUDIO" },
                    { label: "Commercial Business", value: "BUSINESS" },
                    { label: "Individual / Practitioner", value: "INDIVIDUAL" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Intent */}
          <div className="space-y-4 pt-4 border-t border-white/[0.06]">
            <h3 className="text-sm font-mono font-semibold uppercase text-slate-400 tracking-wider">
              Export Fit & Intent
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Estimated Purchase Intent"
                  value={form.buyerIntent}
                  onChange={(e) => handleChange("buyerIntent", e.target.value)}
                  options={[
                    { label: "High (Ready for CIF / FOB quotation)", value: "HIGH" },
                    { label: "Medium (Catalog review & samples)", value: "MEDIUM" },
                    { label: "Low (General inquiry)", value: "LOW" },
                  ]}
                />
              </div>
              <div>
                <Input
                  label="Product Category Interest"
                  value={form.productInterest}
                  onChange={(e) => handleChange("productInterest", e.target.value)}
                  placeholder="e.g. 7-Chakra Harmonic Sets, Master Bowls"
                />
              </div>
            </div>
            <div>
              <Textarea
                label="Procurement Notes / Background"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Specific trade requirements (e.g., requires acoustic certificates, master carton packaging, CIF Hamburg pricing)..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
              Trigger automated RFC-5322 validation & Gemini AI scoring
            </span>
            <div className="flex items-center gap-3">
              <Link href="/leads">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" size="md" isLoading={loading} type="submit" leftIcon={<Send className="w-4 h-4" />}>
                Create & Qualify Lead
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
