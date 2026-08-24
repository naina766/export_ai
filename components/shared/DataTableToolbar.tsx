"use client";
import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  Columns,
  X,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button, cn } from "@/components/ui";

export interface FilterOption {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  selectedValue?: string;
  onSelect: (val: string) => void;
}

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  density,
  onDensityChange,
  onExport,
  activeFilterCount = 0,
  onClearFilters,
  className,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  density?: "comfortable" | "compact";
  onDensityChange?: (d: "comfortable" | "compact") => void;
  onExport?: () => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  className?: string;
}) {
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0F14] border border-white/[0.08] min-h-[44px] font-sans",
        className
      )}
    >
      {/* ── Left / Center: Search + Filter Chips ── */}
      <div className="flex items-center gap-2.5 flex-1 flex-wrap">
        {/* Compact Search Input */}
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 bg-[#07090D] border border-white/[0.08] rounded-lg text-sm text-[#F5F7FA] placeholder-[#667085] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#F5F7FA]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => {
            const isOpen = openFilterId === filter.id;
            const hasSelection = filter.selectedValue && filter.selectedValue !== "ALL";

            return (
              <div key={filter.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilterId(isOpen ? null : filter.id)}
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors",
                    hasSelection
                      ? "bg-[#6366F1]/10 text-[#818cf8] border-[#6366F1]/40 font-semibold"
                      : "bg-[#07090D] text-[#98A2B3] border-white/[0.08] hover:text-[#F5F7FA] hover:bg-white/[0.03]"
                  )}
                >
                  <span>{filter.label}</span>
                  {hasSelection && (
                    <span className="text-xs font-mono text-[#818cf8]">
                      : {filter.selectedValue}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                </button>

                {isOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setOpenFilterId(null)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#0D1117] border border-white/[0.12] rounded-lg shadow-xl p-1 z-40 space-y-0.5 animate-fade-in">
                      {filter.options.map((opt) => {
                        const isSelected = filter.selectedValue === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              filter.onSelect(opt.value);
                              setOpenFilterId(null);
                            }}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-md text-xs text-left flex items-center justify-between transition-colors",
                              isSelected
                                ? "bg-[#6366F1]/15 text-[#818cf8] font-semibold"
                                : "text-[#98A2B3] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                            )}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#6366F1]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {activeFilterCount > 0 && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-medium text-[#EF4444] hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Right Controls: Density & Export ── */}
      <div className="flex items-center gap-2 self-end lg:self-auto">
        {onDensityChange && (
          <div className="flex items-center p-0.5 rounded-lg bg-[#07090D] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => onDensityChange("comfortable")}
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                density === "comfortable"
                  ? "bg-[#151B23] text-[#F5F7FA]"
                  : "text-[#667085] hover:text-[#98A2B3]"
              )}
              title="Comfortable Density"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDensityChange("compact")}
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                density === "compact"
                  ? "bg-[#151B23] text-[#F5F7FA]"
                  : "text-[#667085] hover:text-[#98A2B3]"
              )}
              title="Compact Density"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
