"use client";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Sparkles,
  Loader2,
  X,
  Check,
  ChevronRight,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════════════
// BUTTON SYSTEM (Primary, Secondary, Ghost, Outline, AI, Bronze, Danger)
// ═══════════════════════════════════════════════════════════════════════

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none text-sm",
  {
    variants: {
      variant: {
        primary:
          "bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-xs",
        secondary:
          "bg-[#131925] text-[#F8FAFC] border border-[rgba(148,163,184,0.12)] hover:bg-[#18202F] hover:border-[rgba(148,163,184,0.24)]",
        outline:
          "bg-transparent text-[#94A3B8] border border-[rgba(148,163,184,0.12)] hover:text-[#F8FAFC] hover:border-[rgba(148,163,184,0.24)] hover:bg-white/[0.02]",
        ghost:
          "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.03]",
        ai:
          "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-xs",
        bronze:
          "bg-[#D97706] text-white hover:bg-[#B45309] shadow-xs",
        success:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-xs",
        danger:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-xs",
      },
      size: {
        xs: "h-8 px-3 text-xs gap-1.5",
        sm: "h-9 px-3.5 text-sm gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-11 px-5 text-[15px] gap-2.5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export const PrimaryButton = (props: ButtonProps) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props: ButtonProps) => <Button variant="secondary" {...props} />;
export const BronzeButton = (props: ButtonProps) => <Button variant="bronze" {...props} />;
export const AIButton = (props: ButtonProps) => <Button variant="ai" {...props} />;

// ═══════════════════════════════════════════════════════════════════════
// BADGE SYSTEM
// ═══════════════════════════════════════════════════════════════════════

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-md tracking-tight uppercase select-none text-xs",
  {
    variants: {
      variant: {
        primary: "bg-[#6366F1]/10 text-[#818cf8] border border-[#6366F1]/20",
        ai: "bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20",
        bronze: "bg-[#D97706]/10 text-[#f59e0b] border border-[#D97706]/20",
        success: "bg-[#10B981]/10 text-[#34d399] border border-[#10B981]/20",
        cyan: "bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20",
        warning: "bg-[#F59E0B]/10 text-[#fbbf24] border border-[#F59E0B]/20",
        danger: "bg-[#EF4444]/10 text-[#f87171] border border-[#EF4444]/20",
        neutral: "bg-white/[0.04] text-[#94A3B8] border border-[rgba(148,163,184,0.12)]",
      },
      size: {
        xs: "text-xs px-2 py-0.5 font-mono",
        sm: "text-xs px-2.5 py-0.5",
        md: "text-xs px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "xs",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />}
      {children}
    </span>
  );
}

export * from "./status-badge";
export * from "./tabs";
export * from "./metric-tooltip";
export * from "./BulkActionBar";
export * from "./Breadcrumbs";

export function ScoreBadge({ score }: { score: number }) {
  if (score >= 85) return <Badge variant="success">{score}/100 High Fit</Badge>;
  if (score >= 65) return <Badge variant="ai">{score}/100 Strong</Badge>;
  if (score >= 40) return <Badge variant="cyan">{score}/100 Moderate</Badge>;
  return <Badge variant="neutral">{score}/100 Low</Badge>;
}

export function CountryBadge({ country }: { country: string }) {
  const flags: Record<string, string> = {
    USA: "🇺🇸",
    "United States": "🇺🇸",
    Germany: "🇩🇪",
    UK: "🇬🇧",
    "United Kingdom": "🇬🇧",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    France: "🇫🇷",
    Japan: "🇯🇵",
    Netherlands: "🇳🇱",
    Switzerland: "🇨🇭",
    Austria: "🇦🇹",
  };
  const flag = flags[country] || "🌐";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium">
      <span>{flag}</span>
      <span className="text-[#F8FAFC]">{country}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INPUTS & FORMS
// ═══════════════════════════════════════════════════════════════════════

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-300 block select-none mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#64748B] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] transition-all focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#64748B] pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#64748B] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] pl-10 pr-9 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] transition-all focus:outline-none focus:border-[#6366F1]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-3 text-[#64748B] hover:text-[#94A3B8]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  error,
  className,
  id,
  name,
  disabled,
  ...props
}: {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string | number }[];
  error?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300 block mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full h-11 rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1] cursor-pointer disabled:opacity-50",
          error && "border-[#EF4444]",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0F141D] text-[#F8FAFC]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="text-sm font-medium text-slate-300 block">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full min-h-[120px] rounded-lg bg-[#0A0D13] border border-[rgba(148,163,184,0.12)] p-3.5 text-sm leading-6 text-[#F8FAFC] placeholder-[#64748B] transition-all focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]",
            error && "border-[#EF4444]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn("rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)] p-6 interactive-item", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1 pb-4 border-b border-[rgba(148,163,184,0.08)]", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-[#F8FAFC]", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm leading-6 text-slate-400", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("pt-4 border-t border-[rgba(148,163,184,0.08)] flex items-center justify-between", className)}>{children}</div>;
}

export function AIInsightCard({
  title,
  description,
  confidence,
  action,
  icon,
}: {
  title: string;
  description: string;
  confidence?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#0F141D] border border-[#7C3AED]/30 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon || <Sparkles className="w-4 h-4 text-[#7C3AED]" />}
          <h4 className="text-sm font-semibold text-[#F8FAFC]">{title}</h4>
        </div>
        {confidence && (
          <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
            {confidence}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// METRIC CARD / KPI PRIMITIVE
// ═══════════════════════════════════════════════════════════════════════

export function MetricInline({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  trend?: string | { value: string; isPositive?: boolean };
  icon?: React.ReactNode;
}) {
  const trendText = typeof trend === "object" ? trend.value : trend;
  const isPositive = typeof trend === "object" ? trend.isPositive ?? true : true;

  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0F141D] border border-[rgba(148,163,184,0.12)]">
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-[#64748B]">{icon}</div>}
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider block font-mono">{label}</span>
          <span className="text-2xl font-semibold text-[#F8FAFC] font-mono tabular-nums">{value}</span>
        </div>
      </div>
      {trendText && (
        <span className={cn("text-sm font-mono font-medium", isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
          {trendText}
        </span>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  trend,
  subtext,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  trend?: { value: string; isPositive: boolean };
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl bg-[#0F141D] border border-[rgba(148,163,184,0.12)] interactive-item space-y-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        {icon && <div className="text-[#64748B]">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="text-2xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "text-sm font-mono font-medium flex items-center gap-0.5",
              trend.isPositive ? "text-[#10B981]" : "text-[#EF4444]"
            )}
          >
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TABLE SYSTEM (Sticky Headers, Subtle Separators, Usable Rows)
// ═══════════════════════════════════════════════════════════════════════

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-left text-sm border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={cn("bg-[#0B0F14]/95 backdrop-blur text-slate-400 border-b border-white/[0.08] text-[13px] font-medium sticky top-0 z-20", className)}>{children}</thead>;
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-white/[0.06]", className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "h-[60px] border-b border-white/[0.06] hover:bg-white/[0.025] transition-colors duration-150",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("py-3.5 px-4 text-[13px] font-medium text-slate-400 select-none", className)}>{children}</th>;
}

export function TableCell({
  children,
  className,
  colSpan,
  rowSpan,
  onClick,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      onClick={onClick}
      className={cn("py-3.5 px-4 text-sm text-slate-300 align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DETAIL DRAWER (Slide-in Right Side Sheet)
// ═══════════════════════════════════════════════════════════════════════

export function DetailSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[560px] bg-[#0F141D] border-l border-white/[0.08] h-full overflow-y-auto p-6 sm:p-7 z-10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div>
          <div className="flex items-start justify-between pb-5 border-b border-white/[0.08]">
            <div>
              <h2 className="text-xl font-semibold text-[#F8FAFC] tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-6 space-y-6 text-sm text-slate-300 leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL DIALOG
// ═══════════════════════════════════════════════════════════════════════

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className={cn(
          "relative w-full bg-[#0F141D] border border-white/[0.08] rounded-xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200",
          maxWidths[size]
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SEGMENTED TABS
// ═══════════════════════════════════════════════════════════════════════

export function Tabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0D13] border border-white/[0.08] w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            activeTab === tab.id
              ? "bg-[#131925] text-[#F8FAFC] shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY TIMELINE
// ═══════════════════════════════════════════════════════════════════════

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type?: string;
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/[0.08]">
      {items.map((it) => (
        <div key={it.id} className="relative group">
          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#05070B] border border-[#6366F1] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F8FAFC]">{it.title}</span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(it.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-6">{it.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SKELETONS & EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-11 rounded-lg bg-white/[0.03]" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode | React.ElementType;
}) {
  const renderedIcon =
    icon && (React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType<{ className?: string }>, { className: "w-5 h-5 text-[#64748B]" }));

  return (
    <div className="p-12 text-center rounded-xl bg-[#0F141D] border border-white/[0.08] space-y-4">
      {renderedIcon && (
        <div className="mx-auto w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-[#64748B]">
          {renderedIcon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-medium text-[#F8FAFC]">{title}</h3>
        <p className="text-sm leading-6 text-slate-400 max-w-sm mx-auto">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export * from "./NextBestAction";

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-5", className)}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">{title}</h2>
        {description && <p className="text-sm leading-5 text-slate-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 rounded-xl bg-[#0B0F14] border border-white/[0.08] divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function MetricStripItem({
  label,
  value,
  trend,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  trend?: { value: string; isPositive: boolean };
  subtext?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-5 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="uppercase tracking-wider truncate">{label}</span>
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums font-mono">
        {value}
      </div>
      {trend && (
        <div className={cn("text-xs font-mono flex items-center gap-1", trend.isPositive ? "text-[#22C55E]" : "text-[#EF4444]")}>
          <span>{trend.isPositive ? "↑" : "↓"} {trend.value}</span>
        </div>
      )}
      {subtext && !trend && <p className="text-xs text-slate-500 font-mono truncate">{subtext}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-white/[0.08]">
      <div className="space-y-1.5 max-w-3xl">
        {breadcrumb && <p className="text-xs font-mono text-slate-400 mb-1">{breadcrumb}</p>}
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#F8FAFC] tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-[15px] leading-6 text-slate-400">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
