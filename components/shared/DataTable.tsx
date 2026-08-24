"use client";
import React from "react";
import { cn } from "@/components/ui";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTable<T extends { id: string; leadScore?: number }>({
  columns,
  data,
  density = "comfortable",
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  isLoading = false,
  emptyState,
  className,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  density?: "comfortable" | "compact";
  selectedIds?: string[];
  onSelectRow?: (id: string, e: React.MouseEvent) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}) {
  if (data.length === 0 && !isLoading && emptyState) {
    return <div className="p-4">{emptyState}</div>;
  }

  const isCompact = density === "compact";

  return (
    <div
      className={cn(
        "rounded-xl bg-[#0B0F14] border border-[rgba(255,255,255,0.07)] overflow-hidden font-sans",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="bg-[#07090D] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-10">
            <tr>
              {onSelectAll && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-[rgba(255,255,255,0.2)] bg-[#07090D] text-[#6366F1] focus:ring-0 w-3.5 h-3.5"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "text-xs font-semibold font-mono uppercase tracking-wider text-[#667085]",
                    isCompact ? "py-3 px-3.5" : "py-3.5 px-4",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {data.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              const isHighPriority = typeof row.leadScore === "number" && row.leadScore >= 90;

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "group transition-colors duration-150 relative cursor-pointer",
                    "hover:bg-white/[0.025]",
                    isSelected && "bg-[#6366F1]/5",
                    isHighPriority && "border-l-2 border-l-[#10B981]"
                  )}
                >
                  {onSelectRow && (
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRow(row.id, e);
                      }}
                      className="w-10 px-3.5 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-[rgba(255,255,255,0.2)] bg-[#07090D] text-[#6366F1] focus:ring-0 w-4 h-4"
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => {
                    const content = col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "")
                      : null;

                    return (
                      <td
                        key={idx}
                        className={cn(
                          "text-sm text-[#98A2B3] transition-colors leading-relaxed",
                          isCompact ? "py-3 px-3.5" : "py-4 px-4",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
