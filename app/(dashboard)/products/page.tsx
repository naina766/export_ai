"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageSearch,
  Plus,
  Tag,
  Layers,
  CheckCircle2,
  Globe,
  Receipt,
  Search,
} from "lucide-react";
import {
  Button,
  Badge,
  PageHeader,
  EmptyState,
  SearchInput,
  cn,
} from "@/components/ui";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  material: string;
  frequency: string | null;
  diameter: string | null;
  priceMin: number;
  priceMax: number | null;
  moq: number;
  stockQuantity: number;
  thumbnailUrl: string | null;
  availableForExport: boolean;
  exportMarkets: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data.items || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Singing Bowls Export Catalog"
        subtitle="Manage master hand-hammered, 7-chakra sets, full moon bowls, and temple gongs available for international wholesale export."
        actions={
          <Link href="/products/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Product
            </Button>
          </Link>
        }
      />

      {/* ── Search & Category Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products by title or SKU..."
          className="max-w-md"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "SINGING_BOWLS", "MEDITATION_SETS", "TEMPLE_GONGS", "ACCESSORIES"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded-md border transition-all whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-[#6366F1]/10 text-[#818cf8] border-[#6366F1]/40"
                  : "bg-[#0A0D13] text-[#64748B] border-[rgba(148,163,184,0.12)] hover:text-[#F8FAFC]"
              )}
            >
              {cat === "ALL" ? "All Products" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-xl animate-pulse bg-[#0F141D] border border-[rgba(148,163,184,0.12)]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No export products found"
          description="Add your first Himalayan singing bowl or artisan sound therapy product to start generating wholesale export quotations."
          action={
            <Link href="/products/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Product
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)] overflow-hidden flex flex-col justify-between hover:border-[rgba(148,163,184,0.24)] transition-all interactive-item group"
            >
              <div>
                {/* Product Thumbnail Banner */}
                <div className="h-44 w-full bg-[#0A0D13] relative overflow-hidden border-b border-[rgba(148,163,184,0.12)]">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#64748B] text-xs font-mono">
                      No Image Uploaded
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#05070B]/90 backdrop-blur-xs text-xs font-mono text-[#D97706] border border-[#D97706]/30 font-medium">
                      {p.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#05070B]/90 text-xs font-mono font-medium text-[#F8FAFC] border border-white/[0.12]">
                      SKU: {p.sku}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="text-base font-semibold text-[#F8FAFC] line-clamp-1">{p.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || "Master artisan Himalayan meditation bowl crafted with multi-metal alloy."}
                    </p>
                  </div>

                  {/* Specs Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-3.5 rounded-lg bg-[#0A0D13] border border-white/[0.08] font-mono">
                    <div>
                      <span className="text-xs text-slate-400 uppercase block">Material</span>
                      <span className="text-[#F8FAFC] font-medium truncate block mt-0.5">{p.material}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase block">Frequency</span>
                      <span className="text-[#6366F1] font-medium truncate block mt-0.5">{p.frequency || "432 Hz"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase block">MOQ</span>
                      <span className="text-[#F8FAFC] tabular-nums mt-0.5 block">{p.moq} units</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase block">FOB Price</span>
                      <span className="text-[#10B981] font-semibold tabular-nums mt-0.5 block">
                        ${Number(p.priceMin).toFixed(2)}
                        {p.priceMax ? ` - $${Number(p.priceMax).toFixed(2)}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Export Markets */}
                  {p.exportMarkets && p.exportMarkets.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate pt-1 font-mono">
                      <Globe className="w-3.5 h-3.5 text-[#22D3EE] flex-shrink-0" />
                      <span>Markets: {p.exportMarkets.slice(0, 4).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-white/[0.08] bg-[#0A0D13]/40">
                <Link href={`/quotations/new?productId=${p.id}`} className="w-full block">
                  <Button variant="bronze" size="sm" className="w-full" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                    Quote This Product
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
