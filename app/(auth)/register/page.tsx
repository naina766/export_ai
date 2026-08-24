"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Account created successfully");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Network error during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05070B] text-[#F8FAFC] flex flex-col lg:flex-row overflow-x-hidden">
      {/* ── LEFT: Register Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10">
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full mx-auto my-auto py-10 space-y-6"
        >
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Create your workspace
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Start discovering qualified international wholesale buyers and automated export pipelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              leftIcon={<User className="w-3.5 h-3.5" />}
              required
            />

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              required
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-3.5 h-3.5" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#6366F1] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </motion.div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/[0.08] font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> AES-256 Encrypted
          </span>
          <span>© 2026 EXPORT AI Inc.</span>
        </div>
      </div>

      {/* ── RIGHT: Visual Panel ── */}
      <div className="w-full lg:w-1/2 bg-[#080B12] border-t lg:border-t-0 lg:border-l border-white/[0.08] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between z-10 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-medium text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>AI Discovery Engine Ready</span>
          </div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#22D3EE]" /> Gemini 1.5 Flash Grounded
          </span>
        </div>

        <div className="my-auto py-8 z-10 space-y-4">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#F8FAFC] tracking-tight">
            Accelerate your Himalayan artisan export sales with AI.
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
            Automatically discover wholesale distributors, yoga centers, and meditation studios across 20+ export markets with personalized email sequences.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121C] border border-white/[0.08] text-xs text-slate-400 z-10">
          Integrated with RabbitMQ transactional outbox and Gmail OAuth API for enterprise deliverability.
        </div>
      </div>
    </div>
  );
}
