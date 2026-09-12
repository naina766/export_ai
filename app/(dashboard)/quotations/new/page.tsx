"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  Save,
  FileCheck,
  Building2,
  Globe2,
  Printer,
  FileText,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  PageHeader,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface Lead {
  id: string;
  companyName: string;
  country: string;
  contactPerson?: string | null;
  email?: string;
  city?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  priceMin: number;
}

interface LineItem {
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

const INCOTERMS = [
  { id: "FOB", label: "FOB", title: "Free on Board", desc: "Seller delivers goods loaded on vessel at origin port." },
  { id: "CIF", label: "CIF", title: "Cost, Insurance, Freight", desc: "Seller covers sea freight & marine insurance to destination port." },
  { id: "EXW", label: "EXW", title: "Ex Works", desc: "Buyer arranges pickup from artisan workshop in Nepal." },
  { id: "CFR", label: "CFR", title: "Cost & Freight", desc: "Seller pays ocean transport; buyer procures insurance." },
  { id: "DDP", label: "DDP", title: "Delivered Duty Paid", desc: "Seller bears all risks & customs clearance to buyer facility." },
];

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLeadId = searchParams.get("leadId") || "";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(prefillLeadId);
  const [tradeTerm, setTradeTerm] = useState("CIF");
  const [currency, setCurrency] = useState("USD");
  const [shippingCost, setShippingCost] = useState(480);
  const [validDays, setValidDays] = useState(30);
  const [destinationPort, setDestinationPort] = useState("Hamburg Port, Germany");
  const [notes, setNotes] = useState(
    "1. Prices are in USD on CIF terms including air/ocean cargo insurance.\n2. Includes master export carton packaging, frequency testing, and acoustic certificates.\n3. Payment Terms: 30% advance on confirmation, 70% against Bill of Lading (B/L)."
  );
  const [items, setItems] = useState<LineItem[]>([
    {
      productName: "Tibetan Master Hand-Hammered Singing Bowl (Grade AAA, 7-Metal)",
      sku: "SB-THH-001",
      quantity: 25,
      unitPrice: 75.0,
    },
    {
      productName: "7-Chakra Healing Harmonic Singing Bowl Set (432Hz Tuned)",
      sku: "SB-7CK-SET",
      quantity: 12,
      unitPrice: 220.0,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/leads?limit=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.items?.length > 0) {
          setLeads(res.data.items);
          if (!selectedLeadId) {
            setSelectedLeadId(res.data.items[0].id);
          }
        }
      });

    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.items?.length > 0) {
          setProducts(res.data.items);
        }
      });
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productName: "Full Moon Energized Meditation Singing Bowl",
        sku: "SB-FM-003",
        quantity: 10,
        unitPrice: 135.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0
  );
  const grandTotal = subtotal + (Number(shippingCost) || 0);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const activeIncoterm = INCOTERMS.find((t) => t.id === tradeTerm) || INCOTERMS[0];

  const handleSubmit = async (status: string = "DRAFT") => {
    if (!selectedLeadId) {
      toast.error("Please select a buyer lead.");
      return;
    }

    setIsLoading(true);
    try {
      const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          tradeTerm,
          currency,
          shippingCost: Number(shippingCost),
          notes,
          validUntil,
          status,
          items: items.map((i) => ({
            productName: i.productName,
            sku: i.sku || "EXP-ITEM",
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            total: Number(i.quantity) * Number(i.unitPrice),
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Commercial Quotation ${json.data.quotationNumber} generated!`);
        router.push("/quotations");
      } else {
        toast.error(json.message || "Failed to create quotation");
      }
    } catch {
      toast.error("Network error creating quotation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Commercial Export Quotation Builder"
        subtitle="Configure Incoterms, container quantities, and automated proforma invoices for international buyers."
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/quotations">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Quotes
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleSubmit("DRAFT")}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Export PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleSubmit("SENT")}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Issue Quotation
            </Button>
          </div>
        }
      />

      {/* ── Two-Column Commercial Workspace (Form Left | Proforma Preview Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ═════════════════════════════════════════════════════════════════════
            LEFT COLUMN (7 cols): COMMERCIAL CONFIGURATION FORM
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-6">
          {/* Section 1: Buyer Consignee */}
          <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-semibold text-[#F8FAFC]">1. Consignee / Buyer Selection</h2>
              <span className="text-xs font-mono text-slate-400">Linked to CRM Directory</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Select Buyer Lead *
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-[#05070B] border border-white/[0.1] rounded-lg px-3.5 h-11 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.companyName} — {l.country} ({l.contactPerson || "Procurement Lead"})
                  </option>
                ))}
              </select>

              {selectedLead && (
                <div className="p-3 rounded-lg bg-[#0F141D] border border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-slate-300 font-mono gap-2">
                  <span>Contact: {selectedLead.contactPerson || "Procurement Lead"}</span>
                  <span>Email: {selectedLead.email}</span>
                  <span>Destination: {selectedLead.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Prominent Incoterms & Trade Terms Selector */}
          <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-semibold text-[#F8FAFC]">2. International Trade Terms (Incoterms 2026)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Determine freight allocation, insurance liability, and transfer of title</p>
              </div>
              <span className="text-xs font-mono text-[#818cf8] font-semibold bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20">
                Current: {activeIncoterm.label}
              </span>
            </div>

            {/* Segmented Incoterms Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {INCOTERMS.map((term) => {
                const isSelected = tradeTerm === term.id;
                return (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => setTradeTerm(term.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all cursor-pointer select-none space-y-1",
                      isSelected
                        ? "bg-[#6366F1]/15 border-[#6366F1] text-white shadow-sm"
                        : "bg-[#05070B] border-white/[0.08] text-slate-400 hover:border-white/[0.2] hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono">{term.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#818cf8]" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight truncate">{term.title}</p>
                  </button>
                );
              })}
            </div>

            {/* Incoterm Explanation Callout */}
            <div className="p-3 rounded-lg bg-[#0F141D] border border-white/[0.06] text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-[#818cf8] font-mono uppercase text-[11px] block">
                {activeIncoterm.label}: {activeIncoterm.title}
              </span>
              <p className="text-slate-400 text-xs">{activeIncoterm.desc}</p>
            </div>

            {/* Currency & Logistics Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <Select
                  label="Quotation Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { label: "USD ($) — Standard Export", value: "USD" },
                    { label: "EUR (€) — European Corridor", value: "EUR" },
                    { label: "GBP (£) — United Kingdom", value: "GBP" },
                  ]}
                />
              </div>
              <div>
                <Input
                  label="Freight & Marine Insurance"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                />
              </div>
              <div>
                <Input
                  label="Quote Validity (Days)"
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-semibold text-[#F8FAFC]">3. Export Products & Container Quantities</h2>
                <p className="text-xs text-slate-400 mt-0.5">Specify product catalog items, artisan SKUs, units, and FOB/CIF rates</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                leftIcon={<Plus className="w-3.5 h-3.5 text-[#D97706]" />}
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0F141D] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-[#EF4444] text-xs font-mono transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Product Description</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                        className="w-full bg-[#05070B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">SKU</label>
                      <input
                        type="text"
                        value={item.sku || ""}
                        onChange={(e) => handleUpdateItem(idx, "sku", e.target.value)}
                        className="w-full bg-[#05070B] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", Number(e.target.value))}
                        className="w-full bg-[#05070B] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Rate ({currency})</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, "unitPrice", Number(e.target.value))}
                        className="w-full bg-[#05070B] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Commercial Notes */}
          <div className="rounded-xl bg-[#0B0F14] border border-white/[0.08] p-6 space-y-3">
            <h2 className="text-base font-semibold text-[#F8FAFC]">4. Payment & Commercial Terms</h2>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#05070B] border border-white/[0.08] rounded-lg p-3.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#6366F1] leading-relaxed"
            />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            RIGHT COLUMN (5 cols): LIVE PROFORMA INVOICE PREVIEW
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Document Preview (Official Proforma)
            </span>
            <span className="text-xs font-mono text-[#10B981] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Live Calculations
            </span>
          </div>

          {/* Proforma Sheet Component */}
          <div className="rounded-xl bg-[#0C1017] border border-white/[0.1] shadow-2xl p-6 space-y-6 font-sans text-xs text-slate-300">
            {/* Proforma Header */}
            <div className="flex justify-between items-start pb-4 border-b border-white/[0.08]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#6366F1] text-white flex items-center justify-center font-bold">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-white tracking-tight">EXPORT AI GUILD</span>
                </div>
                <p className="text-[11px] text-slate-400">Master Himalayan Artisan Guild</p>
                <p className="text-[10px] text-slate-500 font-mono">Kathmandu Valley • VAT: 301984729</p>
              </div>

              <div className="text-right space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-[#6366F1]/15 text-[#818cf8] font-mono font-semibold uppercase text-[10px] border border-[#6366F1]/30">
                  PROFORMA INVOICE
                </span>
                <div className="font-mono text-white text-xs font-semibold mt-1">#EXP-2026-00084</div>
                <div className="text-[10px] font-mono text-slate-400">Date: {new Date().toLocaleDateString()}</div>
                <div className="text-[10px] font-mono text-slate-400">Valid: {validDays} Days</div>
              </div>
            </div>

            {/* Consignee & Shipping Corridor */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Buyer / Consignee:</span>
                <div className="font-semibold text-white">{selectedLead?.companyName || "Wholesale Buyer Inc."}</div>
                <div className="text-slate-400">{selectedLead?.contactPerson || "Procurement Team"}</div>
                <div className="text-slate-400">{selectedLead?.country}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Trade Terms & Transit:</span>
                <div className="font-mono font-semibold text-[#10B981]">{tradeTerm} Terms</div>
                <div className="text-slate-400">Port of Origin: TIA / Kolkata</div>
                <div className="text-slate-400">Currency: {currency}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-1">Description</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {items.map((it, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-2 text-slate-200 pr-2">
                        <span className="font-medium block">{it.productName}</span>
                        <span className="text-[10px] font-mono text-slate-500">SKU: {it.sku}</span>
                      </td>
                      <td className="py-2 text-center font-mono">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">${it.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-semibold text-white">
                        ${(it.quantity * it.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="pt-3 border-t border-white/[0.08] space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({currency}):</span>
                <span className="text-white">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Freight & Insurance ({tradeTerm}):</span>
                <span className="text-white">${Number(shippingCost).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-white/[0.08] flex justify-between text-sm font-semibold text-white">
                <span className="text-[#10B981]">Total ({tradeTerm}):</span>
                <span className="text-[#10B981] font-bold text-base">${grandTotal.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-3 border-t border-white/[0.06] text-[10px] text-slate-500 space-y-1 font-mono">
              <p>Generated automatically via EXPORT AI Commercial Engine.</p>
              <p>Includes acoustic harmonics inspection certificate.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
