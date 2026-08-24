"use client";
import React from "react";
import {
  X,
  Printer,
  Download,
  Send,
  Receipt,
  Globe2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Button, Badge, DetailSheet, cn } from "@/components/ui";
import toast from "react-hot-toast";

export interface QuotationItem {
  id: string;
  quotationNumber: string;
  buyerName: string;
  companyName: string;
  country: string;
  contactEmail: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  taxRate: number;
  totalAmount: number;
  incoterm: "FOB_KOLKATA" | "CIF_HAMBURG" | "CIF_NEWYORK" | "EXW_KATHMANDU" | string;
  currency: string;
  paymentTerms: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  notes?: string;
}

export function QuotationPreviewDrawer({
  isOpen,
  onClose,
  quotation,
}: {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationItem | null;
}) {
  if (!quotation) return null;

  const subtotal = quotation.quantity * quotation.unitPrice;
  const taxAmount = (subtotal * quotation.taxRate) / 100;
  const grandTotal = subtotal + quotation.shippingFee + taxAmount;

  return (
    <DetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Commercial Quotation — ${quotation.quotationNumber}`}
      subtitle={`Export proforma invoice issued to ${quotation.companyName}`}
    >
      <div className="space-y-6 font-sans">
        {/* Top Status Banner & Actions */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-mono">Status:</span>
            <Badge variant={quotation.status === "ACCEPTED" ? "success" : quotation.status === "SENT" ? "primary" : "neutral"} size="xs">
              {quotation.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Printer className="w-3 h-3" />}
              onClick={() => window.print()}
            >
              Print / PDF
            </Button>
            <Button
              variant="bronze"
              size="xs"
              leftIcon={<Send className="w-3 h-3" />}
              onClick={() => {
                toast.success(`Quotation ${quotation.quotationNumber} dispatched to ${quotation.contactEmail}`);
                onClose();
              }}
            >
              Send Quote
            </Button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 rounded-xl bg-[#05070B] border border-white/[0.08] space-y-6 text-sm font-mono">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-base font-bold text-[#F8FAFC] tracking-tight block">EXPORT AI</span>
              <span className="text-xs text-slate-400 block">Himalayan Artisan Export OS • Kathmandu, Nepal</span>
              <span className="text-xs text-slate-400 block">GST / Export Reg: NP-KTM-2026-8819</span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-[#D97706] block">{quotation.quotationNumber}</span>
              <span className="text-xs text-slate-400 block">Issue: {quotation.createdAt}</span>
              <span className="text-xs text-slate-400 block">Valid Until: {quotation.expiresAt}</span>
            </div>
          </div>

          {/* Buyer & Shipment Details */}
          <div className="grid grid-cols-2 gap-4 border-b border-white/[0.08] pb-4 text-xs">
            <div>
              <span className="text-xs text-slate-400 uppercase block font-semibold">CONSIGNEE / BUYER</span>
              <span className="font-bold text-[#F8FAFC] text-sm block mt-1">{quotation.companyName}</span>
              <span className="text-slate-300 block">{quotation.buyerName}</span>
              <span className="text-slate-300 block">{quotation.country}</span>
              <span className="text-slate-400 text-xs block">{quotation.contactEmail}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase block font-semibold">INCOTERMS & TERMS</span>
              <span className="font-bold text-[#22D3EE] text-sm block mt-1">{quotation.incoterm.replace(/_/g, " ")}</span>
              <span className="text-slate-300 block">Payment: {quotation.paymentTerms}</span>
              <span className="text-slate-300 block">Currency: {quotation.currency}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 uppercase block font-semibold">PRODUCT LINE ITEMS</span>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <tr>
                  <td className="py-3 font-medium text-[#F8FAFC] text-sm">{quotation.productName}</td>
                  <td className="py-3 text-slate-400 text-xs">{quotation.sku}</td>
                  <td className="py-3 text-right text-[#F8FAFC] tabular-nums text-sm">{quotation.quantity}</td>
                  <td className="py-3 text-right text-slate-300 tabular-nums text-sm">${quotation.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-bold text-[#F8FAFC] tabular-nums text-sm">${subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="border-t border-white/[0.08] pt-3 space-y-1.5 text-right text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="tabular-nums font-bold text-sm text-[#F8FAFC]">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Freight & Insurance ({quotation.incoterm}):</span>
              <span className="tabular-nums">${quotation.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Export Handling / Taxes ({quotation.taxRate}%):</span>
              <span className="tabular-nums">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#F8FAFC] pt-2 border-t border-white/[0.08]">
              <span>Grand Total ({quotation.currency}):</span>
              <span className="text-[#10B981] tabular-nums font-mono text-base">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] text-xs text-slate-300 leading-relaxed">
              <span className="text-xs text-slate-400 uppercase block mb-1 font-semibold">TERMS & SPECIAL CONDITIONS</span>
              {quotation.notes}
            </div>
          )}
        </div>
      </div>
    </DetailSheet>
  );
}
