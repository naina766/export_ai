"use client";
import { useState, useEffect, useCallback } from "react";

export interface RealtimeMetrics {
  activeJobs: number;
  qualifiedBuyers: number;
  runningCampaigns: number;
  totalPipeline: number;
}

export interface RealtimeEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  category: "AI" | "SALES" | "DISCOVERY" | "CAMPAIGNS" | "SYSTEM";
  link?: string;
  read?: boolean;
}

export interface RealtimeJobLog {
  id: string;
  jobId: string;
  queue: string;
  type: string;
  status: string;
  attempts: number;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export type ConnectionState = "LIVE" | "CONNECTING" | "OFFLINE";

export function useRealtimeStream() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("CONNECTING");
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeJobs: 3,
    qualifiedBuyers: 86,
    runningCampaigns: 2,
    totalPipeline: 48600,
  });
  const [events, setEvents] = useState<RealtimeEvent[]>([
    {
      id: "ev-init-1",
      type: "AI_QUALIFIED",
      title: "AI Qualified Buyer",
      description: "Sound Immersion LLC scored 94/100 (High Intent)",
      timestamp: "Just now",
      category: "AI",
      link: "/leads",
      read: false,
    },
    {
      id: "ev-init-2",
      title: "Buyer Replied",
      type: "BUYER_REPLIED",
      description: "Klangschalen Zentrum München requested CIF Hamburg quotation",
      timestamp: "12m ago",
      category: "SALES",
      link: "/quotations",
      read: false,
    },
    {
      id: "ev-init-3",
      title: "Discovery Batch Completed",
      type: "DISCOVERY_COMPLETED",
      description: "124 singing bowls buyers normalized & verified",
      timestamp: "35m ago",
      category: "DISCOVERY",
      link: "/discovery",
      read: true,
    },
  ]);
  const [jobLogs, setJobLogs] = useState<RealtimeJobLog[]>([]);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        es = new EventSource("/api/jobs/stream");

        es.onopen = () => {
          setConnectionState("LIVE");
        };

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.metrics) setMetrics(data.metrics);
            if (data.jobs) setJobLogs(data.jobs);
            if (data.recentEvents) {
              setEvents((prev) => {
                // Merge unique events
                const map = new Map<string, RealtimeEvent>();
                data.recentEvents.forEach((ev: RealtimeEvent) => map.set(ev.id, ev));
                prev.forEach((ev) => {
                  if (map.has(ev.id)) {
                    map.set(ev.id, { ...map.get(ev.id)!, read: ev.read });
                  } else {
                    map.set(ev.id, ev);
                  }
                });
                return Array.from(map.values());
              });
            }
          } catch (err) {
            console.error("[Realtime] Parse error:", err);
          }
        };

        es.onerror = () => {
          setConnectionState("OFFLINE");
          if (es) {
            es.close();
            es = null;
          }
          // Reconnect with backoff
          reconnectTimeout = setTimeout(() => {
            setConnectionState("CONNECTING");
            connect();
          }, 5000);
        };
      } catch {
        setConnectionState("OFFLINE");
      }
    };

    connect();

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((prev) => prev.map((ev) => ({ ...ev, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, read: true } : ev)));
  }, []);

  const unreadCount = events.filter((ev) => !ev.read).length;

  return {
    connectionState,
    metrics,
    events,
    jobLogs,
    unreadCount,
    markAllRead,
    markAsRead,
  };
}
