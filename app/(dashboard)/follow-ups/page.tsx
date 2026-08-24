"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Send,
  ArrowRight,
  Receipt,
  FileText,
  Filter,
  Check,
} from "lucide-react";
import {
  Button,
  Badge,
  CountryBadge,
  PageHeader,
  MetricCard,
  Modal,
  Input,
  Select,
  Textarea,
  cn,
} from "@/components/ui";
import toast from "react-hot-toast";

interface FollowUpItem {
  id: string;
  buyer: string;
  country: string;
  task: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED";
  dealValue?: string;
  quotationNumber?: string;
}

const INITIAL_FOLLOWUPS: FollowUpItem[] = [
  {
    id: "f-1",
    buyer: "Sound Immersion LLC",
    country: "USA",
    task: "Send 432Hz acoustic frequency testing certificate for 7-chakra set",
    dueDate: "Today, 17:00 EST",
    priority: "HIGH",
    status: "TODAY",
    dealValue: "$8,200",
  },
  {
    id: "f-2",
    buyer: "Klangschalen Zentrum München",
    country: "Germany",
    task: "Follow up on CIF Hamburg proforma quotation validity expiry",
    dueDate: "Today, 14:00 CET",
    priority: "HIGH",
    status: "TODAY",
    dealValue: "$14,200",
    quotationNumber: "EXP-2026-000001",
  },
  {
    id: "f-3",
    buyer: "Prana Wellness Guild",
    country: "UK",
    task: "Check courier dispatch tracking for 2x sample master bowls",
    dueDate: "Tomorrow, 11:00 GMT",
    priority: "MEDIUM",
    status: "UPCOMING",
    dealValue: "$6,400",
  },
  {
    id: "f-4",
    buyer: "Nordic Sound Healing Center",
    country: "Sweden",
    task: "Re-engage inquiry on full moon energized singing bowls MOQ",
    dueDate: "2 days overdue",
    priority: "HIGH",
    status: "OVERDUE",
    dealValue: "$5,100",
  },
  {
    id: "f-5",
    buyer: "Melbourne Holistic Spa",
    country: "Australia",
    task: "Commercial CIF Melbourne invoice signed & payment receipt received",
    dueDate: "Yesterday",
    priority: "LOW",
    status: "COMPLETED",
    dealValue: "$15,000",
  },
];

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpItem[]>(INITIAL_FOLLOWUPS);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");

  const handleToggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: it.status === "COMPLETED" ? "TODAY" : "COMPLETED" }
          : it
      )
    );
    toast.success("Follow-up status updated");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuyer || !newTask) return;

    const newItem: FollowUpItem = {
      id: `f-${Date.now()}`,
      buyer: newBuyer,
      country: "USA",
      task: newTask,
      dueDate: "Today, 18:00",
      priority: newPriority,
      status: "TODAY",
    };

    setItems([newItem, ...items]);
    setIsModalOpen(false);
    setNewBuyer("");
    setNewTask("");
    toast.success("Scheduled new follow-up");
  };

  const filteredItems = items.filter((it) => {
    if (activeFilter === "ALL") return true;
    return it.status === activeFilter;
  });

  const getPriorityBadge = (p: string) => {
    if (p === "HIGH") return <span className="text-xs font-mono font-medium text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-0.5 rounded border border-[#EF4444]/20">High Priority</span>;
    if (p === "MEDIUM") return <span className="text-xs font-mono font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded border border-[#F59E0B]/20">Medium</span>;
    return <span className="text-xs font-mono font-medium text-slate-400 bg-white/[0.04] px-2.5 py-0.5 rounded">Low</span>;
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 font-sans">
      {/* ── TOP HEADER ── */}
      <PageHeader
        title="Buyer Follow-up Cadence"
        subtitle="Schedule and track high-intent buyer touches, sample couriers, and quotation expiry milestones."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Follow-up
          </Button>
        }
      />

      {/* ── TOP METRICS (4 MetricCards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Due Today"
          value={items.filter((i) => i.status === "TODAY").length}
          trend={{ value: "Priority", isPositive: true }}
          icon={<Clock className="w-4 h-4 text-[#22D3EE]" />}
        />
        <MetricCard
          label="Upcoming Waves"
          value={items.filter((i) => i.status === "UPCOMING").length}
          trend={{ value: "On schedule", isPositive: true }}
          icon={<CalendarCheck className="w-4 h-4 text-[#6366F1]" />}
        />
        <MetricCard
          label="Overdue Reminders"
          value={items.filter((i) => i.status === "OVERDUE").length}
          trend={{ value: "Action Required", isPositive: false }}
          icon={<AlertCircle className="w-4 h-4 text-[#EF4444]" />}
        />
        <MetricCard
          label="Closed / Completed"
          value={items.filter((i) => i.status === "COMPLETED").length}
          trend={{ value: "Completed", isPositive: true }}
          icon={<CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
        />
      </div>

      {/* ── SEGMENTED FILTER PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(["ALL", "TODAY", "UPCOMING", "OVERDUE", "COMPLETED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors whitespace-nowrap",
              activeFilter === f
                ? "bg-[#6366F1]/10 text-[#818cf8] border-[#6366F1]/40"
                : "bg-[#0F141D] text-slate-400 border-white/[0.08] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
            )}
          >
            {f === "ALL" ? "All Tasks" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ── TASKS WORKSPACE ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No follow-ups matching active filter.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.025] transition-colors"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(item.id)}
                  className={cn(
                    "w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors flex-shrink-0",
                    item.status === "COMPLETED"
                      ? "bg-[#10B981] border-[#10B981] text-white"
                      : "border-white/[0.2] bg-[#0A0D13] hover:border-[#6366F1]"
                  )}
                >
                  {item.status === "COMPLETED" && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base text-[#F8FAFC]">{item.buyer}</span>
                    <CountryBadge country={item.country} />
                    {item.dealValue && (
                      <span className="text-xs font-mono text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded font-medium">
                        Deal: {item.dealValue}
                      </span>
                    )}
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className={cn("text-sm leading-relaxed", item.status === "COMPLETED" ? "line-through text-slate-500" : "text-slate-300")}>
                    {item.task}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono text-slate-400 pl-8 sm:pl-0">
                <span className={cn(item.status === "OVERDUE" ? "text-[#EF4444] font-medium" : item.status === "TODAY" ? "text-[#22D3EE] font-medium" : "text-slate-400")}>
                  {item.dueDate}
                </span>

                <div className="flex items-center gap-2">
                  <Link href="/leads">
                    <Button variant="outline" size="sm">
                      Buyer CRM
                    </Button>
                  </Link>
                  <Link href="/quotations/new">
                    <Button variant="bronze" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                      Quote
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── New Follow-up Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Buyer Follow-up"
        description="Set a targeted task milestone for an active wholesale export negotiation."
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Buyer / Company Name"
            value={newBuyer}
            onChange={(e) => setNewBuyer(e.target.value)}
            placeholder="e.g. Klangschalen Zentrum München"
            required
          />

          <Select
            label="Priority Level"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            options={[
              { label: "High Priority (Critical Order)", value: "HIGH" },
              { label: "Medium (Standard Follow-up)", value: "MEDIUM" },
              { label: "Low (General Check-in)", value: "LOW" },
            ]}
          />

          <Textarea
            label="Task Description & Action"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="e.g. Send FOB Kolkata proforma invoice with 40x 7-chakra sets..."
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
