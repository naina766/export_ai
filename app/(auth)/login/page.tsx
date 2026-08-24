"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Metric Count-up Animation Component ──
function MetricCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Welcome to EXPORT AI");
        router.push(redirectPath);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch {
      toast.error("Network error during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    toast.success(`Demo credentials loaded (${demoEmail})`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-md w-full mx-auto my-auto py-8 space-y-6"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
          Sign in to your workspace
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          Access AI-powered buyer discovery, qualification, outreach, and export sales intelligence.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-3.5 h-3.5" />}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-[#94A3B8] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[#1C2533] bg-[#080B12] text-[#6366F1] focus:ring-0"
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => toast("Please contact system admin to reset credentials.", { icon: "🔒" })}
            className="text-[#64748B] hover:text-[#94A3B8] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign in
        </Button>
      </form>

      {/* ── Collapsible Demo Accounts (Hidden by Default) ── */}
      <div className="pt-2 border-t border-[#1C2533]">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="w-full flex items-center justify-between py-2 text-xs font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Try demo accounts</span>
          </span>
          {showDemoAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showDemoAccounts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2 pt-2"
            >
              <div
                onClick={() => handleFillDemo("admin@exportai.com", "Admin@123456")}
                className="p-3 rounded-lg bg-[#0D121C] border border-white/[0.08] hover:border-[#6366F1]/50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-[#F8FAFC]">Admin Account</p>
                  <p className="text-xs text-slate-400 font-mono">admin@exportai.com</p>
                </div>
                <span className="text-xs font-mono text-[#6366F1] bg-[#6366F1]/10 px-2.5 py-0.5 rounded font-medium">
                  Autofill
                </span>
              </div>

              <div
                onClick={() => handleFillDemo("agent@exportai.com", "Agent@123456")}
                className="p-3 rounded-lg bg-[#0D121C] border border-white/[0.08] hover:border-white/[0.2] cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-[#F8FAFC]">Sales Agent</p>
                  <p className="text-xs text-slate-400 font-mono">agent@exportai.com</p>
                </div>
                <span className="text-xs font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded font-medium">
                  Autofill
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-2 text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#6366F1] hover:underline font-medium">
          Create account
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#05070B] text-[#F8FAFC] flex flex-col lg:flex-row overflow-x-hidden font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT SIDE: Authentication (50% Desktop / 60% Tablet / 100% Mobile)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16 z-10">
        <div>
          <Link href="/login" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white shadow-xs">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#F8FAFC] block">EXPORT AI</span>
              <span className="text-xs text-slate-400 font-mono tracking-tight block">Export Sales Intelligence</span>
            </div>
          </Link>
        </div>

        <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Loading workspace...</div>}>
          <LoginForm />
        </Suspense>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/[0.08] font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> AES-256 Encrypted
          </span>
          <span>© 2026 EXPORT AI Inc.</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT SIDE: Interactive AI Export Intelligence Panel (50% Desktop)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 bg-[#080B12] border-t lg:border-t-0 lg:border-l border-white/[0.08] p-6 sm:p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle geometric dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#F8FAFC 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Intelligence Status Header */}
        <div className="flex items-center justify-between z-10 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-medium text-[#10B981]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span>AI Discovery Engine Live</span>
          </div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#22D3EE]" /> Gemini-powered intelligence
          </span>
        </div>

        {/* ── Active Export Corridors Vector Network ── */}
        <div className="my-auto py-6 z-10 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Active Export Corridors
            </span>
            <span className="text-xs font-mono text-[#22D3EE] font-medium">6 Target Markets</span>
          </div>

          {/* Abstract Interactive SVG Visualization with Animated Particles */}
          <div className="relative w-full h-60 rounded-xl bg-[#0D121C] border border-white/[0.08] p-4 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 460 220" className="w-full h-full">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              {/* Connection Lines from Kathmandu Origin (50, 110) */}
              <path id="route-usa" d="M 50,110 Q 150,40 260,35" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path id="route-de" d="M 50,110 Q 170,75 320,70" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path id="route-uk" d="M 50,110 Q 190,110 380,105" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path id="route-ca" d="M 50,110 Q 180,150 330,155" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path id="route-au" d="M 50,110 Q 160,185 270,195" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,4" />

              {/* Kathmandu Hub */}
              <circle cx="50" cy="110" r="7" fill="#6366F1" />
              <circle cx="50" cy="110" r="14" fill="#6366F1" opacity="0.25" className="animate-ping" />
              <text x="50" y="136" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="monospace" fontWeight="bold">Kathmandu (Origin)</text>

              {/* USA Node */}
              <circle cx="260" cy="35" r="5" fill="#22D3EE" />
              <text x="272" y="38" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif">USA 🇺🇸 (21.4%)</text>

              {/* Germany Node */}
              <circle cx="320" cy="70" r="5" fill="#22D3EE" />
              <text x="332" y="73" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif">Germany 🇩🇪 (24.2%)</text>

              {/* UK Node */}
              <circle cx="380" cy="105" r="5" fill="#22D3EE" />
              <text x="392" y="108" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif">UK 🇬🇧 (18.5%)</text>

              {/* Canada Node */}
              <circle cx="330" cy="155" r="5" fill="#22D3EE" />
              <text x="342" y="158" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif">Canada 🇨🇦 (16.8%)</text>

              {/* Australia & France Node */}
              <circle cx="270" cy="195" r="5" fill="#22D3EE" />
              <text x="282" y="198" fill="#F8FAFC" fontSize="10" fontFamily="sans-serif">Australia 🇦🇺 / France 🇫🇷</text>
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#F8FAFC] tracking-tight">
              Connect Himalayan craftsmanship with the world&apos;s best buyers.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered buyer discovery, qualification, outreach, and export sales intelligence.
            </p>
          </div>
        </div>

        {/* ── Three Telemetry Count-Up Metrics ── */}
        <div className="grid grid-cols-3 gap-3 z-10 pt-4 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] space-y-0.5">
            <div className="text-lg sm:text-xl font-bold font-mono text-[#F8FAFC]">
              <MetricCounter target={84} suffix="+" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono block">Qualified Buyers</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] space-y-0.5">
            <div className="text-lg sm:text-xl font-bold font-mono text-[#10B981]">
              24.2%
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono block">Best Reply Rate</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D121C] border border-white/[0.08] space-y-0.5">
            <div className="text-lg sm:text-xl font-bold font-mono text-[#22D3EE]">
              $48.6K
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono block">Active Pipeline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
