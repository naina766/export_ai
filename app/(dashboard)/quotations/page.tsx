"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ReceiptText,
  Plus,
  Receipt,
  Eye,
  Send,
  Download,
  Filter,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Badge,
  StatusBadge,
  CountryBadge,
  PageHeader,
  MetricCard,
  SearchInput,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  LoadingSkeleton,
  cn,
} from "@/components/ui";
import { QuotationPreviewDrawer, QuotationItem } from "@/components/quotations/QuotationPreviewDrawer";
import toast from "react-hot-toast";

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  tradeTerm: string;
  validUntil: string;
  lead: {
    companyName: string;
    country: string;
    contactName?: string;
    contactEmail?: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  createdAt: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeQuotation, setActiveQuotation] = useState<QuotationItem | null>(null);

  useEffect(() => {
    fetch("/api/quotations")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuotations(res.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      q.lead.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalValue = quotations.reduce((acc, q) => acc + Number(q.total || 0), 0);

  const handleOpenPreview = (q: Quotation) => {
    const firstItem = q.items && q.items.length > 0 ? q.items[0] : null;
    const item: QuotationItem = {
      id: q.id,
      quotationNumber: q.quotationNumber,
      buyerName: q.lead.contactName || "Purchasing Director",
      companyName: q.lead.companyName,
      country: q.lead.country,
      contactEmail: q.lead.contactEmail || `procurement@${q.lead.companyName.toLowerCase().replace(/\s+/g, "")}.com`,
      productName: firstItem?.productName || "Hand-Hammered 7-Chakra Meditation Singing Bowls Set",
      sku: "HB-7SET-432",
      quantity: firstItem?.quantity || 15,
      unitPrice: firstItem?.unitPrice || 480,
      shippingFee: q.shippingCost || 320,
      taxRate: 0,
      totalAmount: Number(q.total) || 7520,
      incoterm: q.tradeTerm || "CIF_HAMBURG",
      currency: q.currency || "USD",
      paymentTerms: "100% Wire Transfer Against Airway Bill",
      status: q.status as any,
      createdAt: new Date(q.createdAt).toLocaleDateString(),
      expiresAt: new Date(q.validUntil).toLocaleDateString(),
      notes: "Direct consignment via Himalayan Air Cargo. Acoustic frequency test certificates included.",
    };
    setActiveQuotation(item);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Commercial Quotations"
        subtitle="Manage export proforma invoices, FOB/CIF terms, container pricing, and track acceptance."
        actions={
          <Link href="/quotations/new">
            <Button variant="bronze" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Quotation
            </Button>
          </Link>
        }
      />

      {/* ── Top Metrics Bar (Single row, tabular-nums) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Issued"
          value={quotations.length}
          trend={{ value: "+3 this week", isPositive: true }}
          icon={<ReceiptText className="w-4 h-4 text-[#D97706]" />}
        />
        <MetricCard
          label="Commercial Pipeline"
          value={`$${totalValue.toLocaleString()}`}
          trend={{ value: "Active quotes", isPositive: true }}
          icon={<DollarSign className="w-4 h-4 text-[#10B981]" />}
        />
        <MetricCard
          label="Accepted / Closed"
          value={quotations.filter((q) => q.status === "ACCEPTED").length}
          trend={{ value: "Confirmed orders", isPositive: true }}
          icon={<Receipt className="w-4 h-4 text-[#6366F1]" />}
        />
        <MetricCard
          label="Avg Order Value"
          value={quotations.length > 0 ? `$${Math.round(totalValue / quotations.length).toLocaleString()}` : "$0"}
          trend={{ value: "FOB/CIF terms", isPositive: true }}
          icon={<Calendar className="w-4 h-4 text-[#22D3EE]" />}
        />
      </div>

      {/* ── Search & Status Filters Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#0F141D] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by quotation #, buyer company, or country..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "DRAFT", "SENT", "VIEWED", "ACCEPTED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap",
                selectedStatus === st
                  ? "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/40 font-medium"
                  : "bg-[#0A0D13] text-slate-400 border-white/[0.08] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
              )}
            >
              {st === "ALL" ? "All Quotations" : st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Enterprise Quotations Table ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No commercial quotations found"
            description="Generate professional proforma quotations with FOB/CIF shipping calculations and trade terms."
            icon={ReceiptText}
            action={
              <Link href="/quotations/new">
                <Button variant="bronze" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Quotation
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Consignee / Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Incoterm</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow
                  key={q.id}
                  onClick={() => handleOpenPreview(q)}
                  className="cursor-pointer h-[60px] border-b border-white/[0.06] hover:bg-white/[0.025] transition-colors duration-150"
                >
                  <TableCell className="font-mono font-semibold text-[#D97706] text-sm">
                    {q.quotationNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-base text-[#F8FAFC]">
                    {q.lead.companyName}
                  </TableCell>
                  <TableCell>
                    <CountryBadge country={q.lead.country} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-[#22D3EE] font-medium">{q.tradeTerm}</span>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-[15px] text-[#10B981] tabular-nums">
                    ${Number(q.total).toLocaleString()} {q.currency}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(q.validUntil).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPreview(q);
                      }}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Quotation Document Preview Drawer ── */}
      <QuotationPreviewDrawer
        isOpen={Boolean(activeQuotation)}
        onClose={() => setActiveQuotation(null)}
        quotation={activeQuotation}
      />
    </div>
  );
}
