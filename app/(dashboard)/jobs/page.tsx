"use client";
import { useState, useEffect } from "react";
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

  const queues = [
    { name: "discovery.queue", label: "Buyer Discovery Crawler", status: "Active", rate: "12 msg/s", latency: "140ms" },
    { name: "validation.queue", label: "RFC-5322 Email Validator", status: "Active", rate: "45 msg/s", latency: "18ms" },
    { name: "ai.queue", label: "Gemini 1.5 Flash Scoring", status: "Active", rate: "8 msg/s", latency: "840ms" },
    { name: "email.queue", label: "Gmail Outreach Dispatch", status: "Active", rate: "3 msg/s", latency: "120ms" },
    { name: "export.jobs", label: "Transactional Outbox", status: "Active", rate: "Sync", latency: "5ms" },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="RabbitMQ Infrastructure & Outbox Telemetry"
        subtitle="Distributed worker fleet monitoring for background discovery, email verification, Gemini AI qualification, and Gmail dispatch."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                isLiveStreaming
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#0D1118] border-[rgba(255,255,255,0.08)] text-[#5F6B7A]"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? "animate-pulse" : ""}`} />
              <span>{isLiveStreaming ? "SSE Live Stream" : "Stream Paused"}</span>
            </button>
            <Button variant="outline" size="xs" onClick={fetchJobs} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Top Inline Stats Strip ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] grid grid-cols-2 sm:grid-cols-5">
        <MetricInline label="Queued Tasks" value={stats.QUEUED} />
        <MetricInline label="Running Now" value={stats.RUNNING} />
        <MetricInline label="Completed Jobs" value={stats.COMPLETED} />
        <MetricInline label="Retrying" value={stats.RETRYING} />
        <MetricInline label="Failed" value={stats.FAILED} />
      </div>

      {/* ── Queue Cluster Topologies ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Queue Cluster Topologies</h2>
            <p className="text-sm leading-6 text-slate-400">Direct exchange routing with dead-letter queue (DLQ) support</p>
          </div>
          <span className="text-xs text-[#10B981] flex items-center gap-1 font-semibold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Cluster Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {queues.map((q) => (
            <div key={q.name} className="p-4 rounded-lg bg-[#111722] border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm font-semibold text-[#F5F7FA]">{q.label}</span>
              </div>
              <p className="text-xs font-mono text-[#6366F1]">{q.name}</p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{q.latency}</span>
                <span>{q.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flat Real-Time Execution Log ── */}
      <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Real-Time Job Telemetry</h2>
            <p className="text-sm leading-6 text-slate-400">Execution traces and worker payloads</p>
          </div>
        </div>

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
                  No recent worker executions logged.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="h-[60px] border-b border-white/[0.06] hover:bg-white/[0.025] transition-colors duration-150">
                  <TableCell className="font-mono text-xs text-[#6366F1] font-medium">
                    {job.queue}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-[#F5F7FA]">
                    {job.type}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {job.correlationId?.slice(0, 12) || job.jobId?.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {job.durationMs ? `${job.durationMs}ms` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {job.attempts}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-400 font-mono">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
