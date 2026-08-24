"use client";
import { useState, useEffect } from "react";
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
  PageHeader,
} from "@/components/ui";
import toast from "react-hot-toast";

interface Lead {
  id: string;
  companyName: string;
  country: string;
  contactPerson?: string | null;
  email?: string;
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

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLeadId = searchParams.get("leadId") || "";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(prefillLeadId);
  const [tradeTerm, setTradeTerm] = useState("FOB");
  const [currency, setCurrency] = useState("USD");
  const [shippingCost, setShippingCost] = useState(350);
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState(
    "1. Prices are in USD on FOB / CIF terms.\n2. Includes master export carton packaging and acoustic frequency certificate.\n3. Payment Terms: 30% advance on order confirmation, 70% against Bill of Lading (B/L)."
  );
  const [items, setItems] = useState<LineItem[]>([
    {
      productName: "Tibetan Master Hand-Hammered Singing Bowl (Grade AAA)",
      sku: "SB-THH-001",
      quantity: 20,
      unitPrice: 75.0,
    },
    {
      productName: "7-Chakra Healing Singing Bowl Harmonic Set",
      sku: "SB-7CK-SET",
      quantity: 10,
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
        quantity: 5,
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

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
  const grandTotal = subtotal + (Number(shippingCost) || 0);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

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
    <div className="space-y-8 max-w-[1100px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <PageHeader
        title="Create Commercial Export Quotation"
        subtitle="Construct official international wholesale price quotes with automated line item calculations."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/quotations">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Cancel
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
              Preview PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleSubmit("SENT")}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Quotation
            </Button>
          </div>
        }
      />

      {/* ── Document-Style Quotation Sheet ── */}
      <div className="bg-[#0D1118] border border-white/[0.08] rounded-xl overflow-hidden">
        {/* Document Header */}
        <div className="p-8 border-b border-white/[0.06] bg-[#111722]/50 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#D97706] flex items-center justify-center text-white font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-semibold text-[#F5F7FA] tracking-tight block">EXPORT AI</span>
                <span className="text-xs text-[#D97706] font-mono font-medium block">PROFORMA INVOICE & QUOTE</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 pt-1">Himalayan Artisan Singing Bowls Export Guild</p>
            <p className="text-xs text-slate-500">Kathmandu Valley • Master Artisan Guild</p>
          </div>

          <div className="text-left md:text-right space-y-1">
            <h2 className="text-xl font-semibold text-[#F5F7FA] tracking-tight">Commercial Export Quotation</h2>
            <p className="text-sm font-mono text-[#D97706]">#QT-2026-001 (Auto-generated on Save)</p>
            <p className="text-xs text-slate-400 font-mono">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Buyer Information & Logistics */}
        <div className="p-8 border-b border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0D1118]">
          {/* Buyer Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">Buyer / Consignee</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full bg-[#111722] border border-white/[0.08] rounded-lg px-3.5 h-11 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#6366F1]"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.companyName} ({l.country})
                </option>
              ))}
            </select>
            {selectedLead && (
              <div className="text-xs text-slate-400 pt-1 space-y-0.5 font-mono">
                <p>{selectedLead.contactPerson || "Procurement Contact"}</p>
                <p>{selectedLead.email}</p>
              </div>
            )}
          </div>

          {/* Trade Terms & Currency */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">Trade Terms</label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Incoterms"
                value={tradeTerm}
                onChange={(e) => setTradeTerm(e.target.value)}
                options={[
                  { label: "FOB (Free on Board)", value: "FOB" },
                  { label: "CIF (Cost, Insurance, Freight)", value: "CIF" },
                  { label: "EXW (Ex Works)", value: "EXW" },
                  { label: "CFR (Cost and Freight)", value: "CFR" },
                  { label: "DDP (Delivered Duty Paid)", value: "DDP" },
                ]}
              />
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { label: "USD ($)", value: "USD" },
                  { label: "EUR (€)", value: "EUR" },
                  { label: "GBP (£)", value: "GBP" },
                  { label: "INR (₹)", value: "INR" },
                ]}
              />
            </div>
          </div>

          {/* Validity & Shipping */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">Logistics & Validity</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Validity (Days)"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
              />
              <Input
                label="Freight & Insurance ($)"
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Product Line Items */}
        <div className="p-8 border-b border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono">Product Line Items</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="w-3.5 h-3.5 text-[#D97706]" />}
            >
              Add Item
            </Button>
          </div>

          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111722] text-slate-400 font-medium border-b border-white/[0.06] text-[13px]">
                <tr>
                  <th className="p-3.5 w-1/3">Product Description</th>
                  <th className="p-3.5 w-28">SKU</th>
                  <th className="p-3.5 w-24">Quantity</th>
                  <th className="p-3.5 w-28">Unit Price ({currency})</th>
                  <th className="p-3.5 w-28 text-right">Total</th>
                  <th className="p-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] bg-[#0D1118]">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#151C28]/40 transition-colors">
                    <td className="p-3.5">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F5F7FA] focus:outline-none focus:border-[#6366F1]"
                      />
                    </td>
                    <td className="p-3.5">
                      <input
                        type="text"
                        value={item.sku || ""}
                        onChange={(e) => handleUpdateItem(idx, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-[#6366F1]"
                      />
                    </td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", Number(e.target.value))}
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm font-mono text-[#F5F7FA] focus:outline-none focus:border-[#6366F1]"
                      />
                    </td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, "unitPrice", Number(e.target.value))}
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm font-mono text-[#F5F7FA] focus:outline-none focus:border-[#6366F1]"
                      />
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[#10B981] text-sm tabular-nums">
                      ${(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-[#EF4444] p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commercial Terms & Financial Summary */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#111722]/30">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono block">Terms & Payment Conditions</label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0D1118] border border-white/[0.08] rounded-xl p-3.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-[#6366F1] leading-relaxed"
            />
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-[#111722] border border-white/[0.06] flex flex-col justify-between">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono text-[#F5F7FA] font-semibold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Freight & Insurance ({tradeTerm}):</span>
                <span className="font-mono text-[#F5F7FA]">${Number(shippingCost).toLocaleString()}</span>
              </div>
              <div className="pt-2.5 border-t border-white/[0.06] flex justify-between text-base font-semibold text-[#F5F7FA]">
                <span>Grand Total ({currency}):</span>
                <span className="font-mono text-lg text-[#10B981]">${grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Issued via EXPORT AI Commercial Tool</span>
              <span>Valid for {validDays} Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
