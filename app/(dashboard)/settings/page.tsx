"use client";
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  Lock,
  Sparkles,
  Server,
  User,
} from "lucide-react";
import {
  Button,
  Badge,
  PageHeader,
} from "@/components/ui";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [gmailStatus, setGmailStatus] = useState<{
    isConnected: boolean;
    account?: { email: string; provider: string; scopes: string[] } | null;
  }>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch("/api/gmail/status");
      const json = await res.json();
      if (json.success) setGmailStatus(json.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const handleConnectGmail = async () => {
    try {
      const res = await fetch("/api/gmail/connect", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        toast.error("Google OAuth credentials not configured in environment.");
      }
    } catch {
      toast.error("Network error initiating Google OAuth");
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("Gmail account disconnected");
        fetchGmailStatus();
      }
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="System Settings & Integration"
        subtitle="Manage Gmail OAuth dispatch authorization, Gemini LLM models, and queue cluster credentials."
      />

      <div className="space-y-6">
        {/* Gmail API Section */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444]/15 flex items-center justify-center text-[#EF4444]">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Gmail API Integration</h2>
                <p className="text-sm leading-6 text-slate-400">Direct authenticated dispatch for cold outreach campaigns</p>
              </div>
            </div>
            <Badge variant={gmailStatus.isConnected ? "success" : "neutral"} size="sm">
              {gmailStatus.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Connect your export sales Gmail account to dispatch personalized singing bowl quotations and receive replies directly into your CRM feed.
          </p>

          <div className="p-3.5 rounded-lg bg-[#111722] border border-white/[0.06] flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#10B981]" />
              <span className="text-[#F5F7FA]">Token Storage Security:</span>
            </div>
            <span className="font-mono text-xs text-[#10B981] font-semibold">AES-256-GCM Encrypted in DB</span>
          </div>

          {gmailStatus.isConnected && gmailStatus.account && (
            <div className="p-3.5 rounded-lg bg-[#111722] border border-white/[0.06] text-sm space-y-0.5">
              <p className="text-slate-400 text-xs">Connected Account:</p>
              <p className="font-mono font-medium text-[#F5F7FA]">{gmailStatus.account.email}</p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            {gmailStatus.isConnected ? (
              <Button variant="danger" size="md" onClick={handleDisconnectGmail}>
                Disconnect Account
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleConnectGmail}
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Authorize with Google
              </Button>
            )}
          </div>
        </div>

        {/* Gemini AI Section */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 flex items-center justify-center text-[#818cf8]">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">Gemini AI Intelligence Engine</h2>
                <p className="text-sm leading-6 text-slate-400">Automated lead qualification and outreach personalization</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">Active</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-[#111722] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block font-mono">LLM Model Tier</span>
              <span className="text-[#F5F7FA] font-mono font-semibold mt-1 block">gemini-1.5-flash</span>
            </div>
            <div className="p-4 rounded-lg bg-[#111722] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block font-mono">Hallucination Mitigation</span>
              <span className="text-[#10B981] font-medium mt-1 block">Strict Fact Grounding Enforced</span>
            </div>
          </div>
        </div>

        {/* Infrastructure Section */}
        <div className="rounded-xl bg-[#0F141D] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                <Server className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#F8FAFC]">RabbitMQ Cluster & Database</h2>
                <p className="text-sm leading-6 text-slate-400">Distributed workers and Neon PostgreSQL connection</p>
              </div>
            </div>
            <Badge variant="success" size="sm">Operational</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-[#111722] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block font-mono">Queue Broker</span>
              <span className="text-[#F5F7FA] font-mono font-semibold mt-1 block">RabbitMQ Direct Exchange</span>
            </div>
            <div className="p-4 rounded-lg bg-[#111722] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block font-mono">Database Engine</span>
              <span className="text-[#F5F7FA] font-mono font-semibold mt-1 block">Neon PostgreSQL + Prisma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}