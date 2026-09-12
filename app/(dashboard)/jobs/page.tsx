"use client";
import React, { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Activity,
  Layers,
  Radio,
  RotateCcw,
  Server,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  MetricInline,
  Button,
  Badge,
  StatusBadge,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  cn,
} from "@/components/ui";

interface JobLog {
  id: string;
  jobId: string;
  correlationId: string;
  queue: string;
  type: string;
  status: string;
  attempts: number;
  error: string | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Stats {
  QUEUED: number;
  RUNNING: number;
  COMPLETED: number;
  FAILED: number;
  RETRYING: number;
}

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    QUEUED: 0,
    RUNNING: 0,
    COMPLETED: 0,
    FAILED: 0,
    RETRYING: 0,
  });
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (json.success) {
        setJobs(json.data.items || []);
        if (json.data.stats) setStats(json.data.stats);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    if (!isLiveStreaming) return;

    const eventSource = new EventSource("/api/jobs/stream");
    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.stats) setStats(payload.stats);
        if (payload.latestJob) {
          setJobs((prev) => [payload.latestJob, ...prev.slice(0, 49)]);
        }
      } catch {}
    };

    return () => {
      eventSource.close();
    };
  }, [isLiveStreaming]);

  // Derive real system health status without fabricating metrics
  const getSystemHealth = () => {
    if (stats.RUNNING > 0) {
      return { status: "Processing", color: "text-[#6366F1]", bg: "bg-[#6366F1]", border: "border-[#6366F1]/30", desc: "Worker fleet actively processing tasks" };
    }
    if (stats.FAILED > 5) {
      return { status: "Degraded", color: "text-[#EF4444]", bg: "bg-[#EF4444]", border: "border-[#EF4444]/30", desc: "Dead-letter queue has accumulated failures" };
    }
    if (stats.RETRYING > 0) {
      return { status: "Retrying", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]", border: "border-[#F59E0B]/30", desc: "Transient worker retries in progress" };
    }
    return { status: "Healthy", color: "text-[#10B981]", bg: "bg-[#10B981]", border: "border-[#10B981]/30", desc: "Outbox relay & worker queues idle and responsive" };
  };

  const health = getSystemHealth();

  // Distinct known queue topology definitions
  const queueTopologies = [
    { name: "discovery.queue", label: "Buyer Discovery", exchange: "export.direct", type: "Async Crawler" },
    { name: "validation.queue", label: "RFC-5322 Validator", exchange: "export.direct", type: "MX Verification" },
    { name: "ai.queue", label: "Gemini AI Scoring", exchange: "export.direct", type: "LLM Qualification" },
    { name: "email.queue", label: "Gmail Outreach", exchange: "export.direct", type: "Rate-limited Dispatch" },
    { name: "export.dlq", label: "Dead Letter Queue", exchange: "export.dlx", type: "Poison Message Quarantine" },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Background Jobs & Outbox Telemetry"
        subtitle="Distributed worker fleet monitoring for background discovery, email verification, Gemini AI scoring, and Gmail dispatch."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer",
                isLiveStreaming
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#0D1118] border-white/[0.08] text-slate-400"
              )}
            >
              <Radio className={cn("w-3.5 h-3.5", isLiveStreaming && "animate-pulse")} />
              <span>{isLiveStreaming ? "SSE Live Stream Active" : "Stream Paused"}</span>
            </button>
            <Button variant="outline" size="sm" onClick={fetchJobs} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          1. WORKER FLEET HEALTH BANNER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className={cn("rounded-xl bg-[#0B0F14] border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4", health.border)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={cn("w-3 h-3 rounded-full block", health.bg)} />
            <span className={cn("w-3 h-3 rounded-full block absolute inset-0 animate-ping opacity-75", health.bg)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F8FAFC]">Worker Status:</span>
              <span className={cn("text-sm font-bold font-mono", health.color)}>● {health.status}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{health.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Transactional Outbox: <strong className="text-[#10B981]">Active</strong></span>
          <span>•</span>
          <span>Total Recorded Jobs: <strong className="text-white">{jobs.length}</strong></span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. REAL QUEUE METRICS STRIP (Database Counts)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] grid grid-cols-2 sm:grid-cols-5">
        <MetricInline label="Queued Tasks" value={stats.QUEUED} />
        <MetricInline label="Processing Now" value={stats.RUNNING} />
        <MetricInline label="Completed Tasks" value={stats.COMPLETED} />
        <MetricInline label="Retries Active" value={stats.RETRYING} />
        <MetricInline label="Dead Letter Failures" value={stats.FAILED} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. QUEUE CLUSTER TOPOLOGIES (Architecture Grounding)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">Direct Exchange Queue Topologies</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configured RabbitMQ bindings with dead-letter exchange (DLX) fallback</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Broker: amqp://rabbitmq</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {queueTopologies.map((q) => {
            const queueJobCount = jobs.filter((j) => j.queue === q.name).length;
            return (
              <div key={q.name} className="p-4 rounded-lg bg-[#0A0D13] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F8FAFC] truncate">{q.label}</span>
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                </div>
                <p className="text-[11px] font-mono text-[#818cf8] truncate">{q.name}</p>
                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{q.type}</span>
                  <span className="text-slate-300">{queueJobCount} logged</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. RECENT JOBS TABLE WITH EXPANDABLE TRACE DETAILS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">Recorded Execution Traces</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any row to inspect execution payload, duration, and error traces</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{jobs.length} latest events</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No background worker executions logged yet. Run a Buyer Discovery or Outreach Campaign to see job telemetry.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  return (
                    <React.Fragment key={job.id}>
                      <TableRow
                        onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        className={cn(
                          "h-[56px] border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer",
                          isExpanded && "bg-white/[0.04]"
                        )}
                      >
                        <TableCell className="font-mono text-xs text-[#818cf8] font-medium">
                          {job.queue}
                        </TableCell>
                        <TableCell className="font-medium text-sm text-[#F8FAFC]">
                          {job.type}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">
                          {job.correlationId ? `${job.correlationId.slice(0, 14)}...` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {job.durationMs ? `${job.durationMs}ms` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {job.attempts}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={job.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-400 font-mono">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>

                      {/* Expandable Trace Details */}
                      {isExpanded && (
                        <TableRow className="bg-[#05070B] border-b border-white/[0.08]">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-2 text-xs font-mono">
                              <div className="flex items-center justify-between text-slate-400 border-b border-white/[0.06] pb-2">
                                <span>Execution ID: {job.id}</span>
                                <span>Job ID: {job.jobId}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
                                <div>
                                  <span className="text-slate-500 block mb-0.5">Started At:</span>
                                  <span>{job.startedAt ? new Date(job.startedAt).toISOString() : "Not recorded"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block mb-0.5">Completed At:</span>
                                  <span>{job.completedAt ? new Date(job.completedAt).toISOString() : "In progress / Pending"}</span>
                                </div>
                              </div>
                              {job.error && (
                                <div className="p-3 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] space-y-1">
                                  <span className="font-bold">Error Trace:</span>
                                  <p>{job.error}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
