"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Compass,
  Users,
  Sparkles,
  Kanban,
  Receipt,
  Send,
  Package,
  BarChart3,
  Cpu,
  Settings,
  ArrowRight,
  Plus,
  Zap,
  Globe2,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui";

interface CommandItem {
  id: string;
  title: string;
  category: "NAVIGATION" | "QUICK ACTIONS" | "RECENT" | "SEARCH";
  href: string;
  icon: any;
  shortcut?: string;
  description?: string;
}

const COMMANDS: CommandItem[] = [
  // NAVIGATION
  { id: "nav-dash", title: "Dashboard", category: "NAVIGATION", href: "/dashboard", icon: BarChart3, shortcut: "G D" },
  { id: "nav-disc", title: "Buyer Discovery", category: "NAVIGATION", href: "/discovery", icon: Compass, shortcut: "G B" },
  { id: "nav-leads", title: "Buyer Leads", category: "NAVIGATION", href: "/leads", icon: Users, shortcut: "G L" },
  { id: "nav-ai", title: "AI Insights", category: "NAVIGATION", href: "/ai-insights", icon: Sparkles },
  { id: "nav-prods", title: "Product Catalog", category: "NAVIGATION", href: "/products", icon: Package, shortcut: "G P" },
  { id: "nav-camps", title: "Campaigns", category: "NAVIGATION", href: "/campaigns", icon: Send, shortcut: "G C" },
  { id: "nav-pipe", title: "Sales Pipeline", category: "NAVIGATION", href: "/opportunities", icon: Kanban, shortcut: "G O" },
  { id: "nav-quotes", title: "Quotations", category: "NAVIGATION", href: "/quotations", icon: Receipt, shortcut: "G Q" },
  { id: "nav-analytics", title: "Analytics", category: "NAVIGATION", href: "/analytics", icon: BarChart3 },
  { id: "nav-jobs", title: "Background Jobs", category: "NAVIGATION", href: "/jobs", icon: Cpu },
  { id: "nav-settings", title: "Settings", category: "NAVIGATION", href: "/settings", icon: Settings, shortcut: "G S" },

  // QUICK ACTIONS
  { id: "act-camp", title: "New Campaign", category: "QUICK ACTIONS", href: "/campaigns/new", icon: Plus, shortcut: "N C", description: "Create 6-step AI campaign" },
  { id: "act-lead", title: "Add Buyer Lead", category: "QUICK ACTIONS", href: "/leads", icon: Plus, shortcut: "N L", description: "Manual lead entry" },
  { id: "act-disc", title: "Start Discovery", category: "QUICK ACTIONS", href: "/discovery", icon: Zap, description: "Initiate extraction pipeline" },
  { id: "act-quote", title: "Create Quotation", category: "QUICK ACTIONS", href: "/quotations/new", icon: Receipt, shortcut: "N Q", description: "Generate FOB/CIF proforma" },

  // RECENT
  { id: "rec-1", title: "Prana Sound Sanctuary (Germany)", category: "RECENT", href: "/leads?country=Germany", icon: Globe2, description: "High Fit (94/100) • Active negotiation" },
  { id: "rec-2", title: "Q3 Germany Sound Bowls Outreach", category: "RECENT", href: "/campaigns", icon: Send, description: "Active • 238 recipients" },
  { id: "rec-3", title: "Zen Living Wholesale (USA)", category: "RECENT", href: "/leads?country=USA", icon: Globe2, description: "High Fit (89/100) • Quoted $48,600" },

  // SEARCH
  { id: "search-buyers", title: "Search all Buyers in CRM", category: "SEARCH", href: "/leads", icon: Search, description: "Filter 2,481 discovered leads" },
  { id: "search-camps", title: "Search Campaigns & Sequences", category: "SEARCH", href: "/campaigns", icon: Search, description: "Review email outreach status" },
  { id: "search-quotes", title: "Search Commercial Quotations", category: "SEARCH", href: "/quotations", icon: Search, description: "Inspect open proforma invoices" },
];

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  // Group filtered by category
  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      {/* Palette Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="relative w-full max-w-xl bg-[#0F141D] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden z-10"
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search commands, buyers, campaigns..."
            className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-xs font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands or records found for &quot;{query}&quot;
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filtered.filter((item) => item.category === category);
              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-mono text-slate-500 tracking-wider">
                    {category}
                  </div>
                  {categoryItems.map((cmd) => {
                    const currentIndex = flatIndex++;
                    const isSelected = selectedIndex === currentIndex;
                    const Icon = cmd.icon;

                    return (
                      <div
                        key={cmd.id}
                        onClick={() => {
                          router.push(cmd.href);
                          onClose();
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                          isSelected
                            ? "bg-[#6366F1]/15 text-[#F8FAFC]"
                            : "text-slate-300 hover:bg-white/[0.04] hover:text-[#F8FAFC]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#818cf8]" : "text-slate-400")} />
                          <div className="truncate">
                            <span className="font-medium">{cmd.title}</span>
                            {cmd.description && (
                              <span className="text-xs text-slate-500 ml-2 hidden sm:inline truncate">
                                — {cmd.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {cmd.shortcut && (
                          <kbd className="text-xs font-mono text-slate-500 bg-[#0A0D13] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0 ml-2">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
