// NOTE: This file is intentionally large and split across multiple parts due to message size limits.
// This is PART 1/3. Do not use alone.

"use client"



/* ============================================================
   HEDGED PROP CALCULATOR — PURE LOGIC (UNCHANGED)
   ============================================================ */



export interface CalculatorInputs {
  evalType: EvalType

  accountSize: number
  evalCost: number

  phase1Target: number
  phase2Target?: number

  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  failEvalProfit: number

  fundedSplit: number
  failFundedProfit: number
  payoutTarget: number
  fundedRiskPerDay: number
  fundedTradesPerDay: number
}

export interface PayoutScenario {
  index: number
  totalCost: number
  netAfterPayout: number
  netIfFailAfter: number
}

export interface CalculatorResult {
  evalType: EvalType
  accountSize: number
  evalCost: number
  phase1Target: number
  phase2Target?: number
  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  riskPerTradeEval: number
  maxEvalSLTrades: number
  perSLProfitEval: number
  evalFailGrossPersonal: number
  evalFailNet: number

  phase1RR: number
  phase1CostPersonal: number
  phase2RR?: number
  phase2CostPersonal?: number
  costEvalPersonal: number
  costToFunded: number

  fundedRiskPerDay: number
  fundedTradesPerDay: number
  riskPerTradeFunded: number
  maxFundedSLTrades: number
  perSLProfitFunded: number
  fundedFailGrossPersonal: number
  fundedFailNet: number

  payoutTarget: number
  fundedSplit: number
  payoutAmount: number
  payoutRRFunded: number
  hedgeLossPerPayout: number
  payoutScenarios: PayoutScenario[]
}



// PART 2 and PART 3 continue the UI and page layout
// NOTE: This file is intentionally large and split across multiple parts due to message size limits.
// This is PART 1/3. Do not use alone.




/* ============================================================
   HEDGED PROP CALCULATOR — PURE LOGIC (UNCHANGED)
   ============================================================ */



export interface CalculatorInputs {
  evalType: EvalType

  accountSize: number
  evalCost: number

  phase1Target: number
  phase2Target?: number

  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  failEvalProfit: number

  fundedSplit: number
  failFundedProfit: number
  payoutTarget: number
  fundedRiskPerDay: number
  fundedTradesPerDay: number
}

export interface PayoutScenario {
  index: number
  totalCost: number
  netAfterPayout: number
  netIfFailAfter: number
}

export interface CalculatorResult {
  evalType: EvalType
  accountSize: number
  evalCost: number
  phase1Target: number
  phase2Target?: number
  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  riskPerTradeEval: number
  maxEvalSLTrades: number
  perSLProfitEval: number
  evalFailGrossPersonal: number
  evalFailNet: number

  phase1RR: number
  phase1CostPersonal: number
  phase2RR?: number
  phase2CostPersonal?: number
  costEvalPersonal: number
  costToFunded: number

  fundedRiskPerDay: number
  fundedTradesPerDay: number
  riskPerTradeFunded: number
  maxFundedSLTrades: number
  perSLProfitFunded: number
  fundedFailGrossPersonal: number
  fundedFailNet: number

  payoutTarget: number
  fundedSplit: number
  payoutAmount: number
  payoutRRFunded: number
  hedgeLossPerPayout: number
  payoutScenarios: PayoutScenario[]
}



/* ============================================================
   SIMULATOR UI (UPDATED TO YOUR NEW REQUIREMENTS)
   ------------------------------------------------------------
   ✅ No hedge-per-% language in UI
   ✅ User inputs TWO goals:
      1) Profit if Eval fails
      2) Profit if Funded fails before any payouts
   ✅ Remove presets (only custom)
   ✅ Focus on per-phase costs + per-payout outcomes
   ============================================================ */



/* -------------------------
   Build core inputs (NEW)
   ------------------------- */


// PART 3 continues: Page component + ful

// NOTE: This file is intentionally large and split across multiple parts due to message size limits.
// This is PART 1/3. Do not use alone.



import React, { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  AlertTriangle,
  Calculator,
  ClipboardCopy,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from "lucide-react"

/* ============================================================
   HEDGED PROP CALCULATOR — PURE LOGIC (UNCHANGED)
   ============================================================ */

export type EvalType = "one-step" | "two-step"

export interface CalculatorInputs {
  evalType: EvalType

  accountSize: number
  evalCost: number

  phase1Target: number
  phase2Target?: number

  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  failEvalProfit: number

  fundedSplit: number
  failFundedProfit: number
  payoutTarget: number
  fundedRiskPerDay: number
  fundedTradesPerDay: number
}

export interface PayoutScenario {
  index: number
  totalCost: number
  netAfterPayout: number
  netIfFailAfter: number
}

export interface CalculatorResult {
  evalType: EvalType
  accountSize: number
  evalCost: number
  phase1Target: number
  phase2Target?: number
  dailyDD: number
  maxDD: number

  riskPerDayEval: number
  tradesPerDayEval: number
  riskPerTradeEval: number
  maxEvalSLTrades: number
  perSLProfitEval: number
  evalFailGrossPersonal: number
  evalFailNet: number

  phase1RR: number
  phase1CostPersonal: number
  phase2RR?: number
  phase2CostPersonal?: number
  costEvalPersonal: number
  costToFunded: number

  fundedRiskPerDay: number
  fundedTradesPerDay: number
  riskPerTradeFunded: number
  maxFundedSLTrades: number
  perSLProfitFunded: number
  fundedFailGrossPersonal: number
  fundedFailNet: number

  payoutTarget: number
  fundedSplit: number
  payoutAmount: number
  payoutRRFunded: number
  hedgeLossPerPayout: number
  payoutScenarios: PayoutScenario[]
}

export function calculateHedgedProp(inputs: CalculatorInputs): CalculatorResult | null {
  const {
    evalType,
    accountSize,
    evalCost,
    phase1Target,
    phase2Target,
    dailyDD,
    maxDD,
    riskPerDayEval,
    tradesPerDayEval,
    failEvalProfit,
    fundedSplit,
    failFundedProfit,
    payoutTarget,
    fundedRiskPerDay,
    fundedTradesPerDay,
  } = inputs

  if (!accountSize || !dailyDD || !maxDD) return null

  const safeRiskPerDayEval = Math.min(riskPerDayEval, dailyDD)
  const riskPerTradeEval = safeRiskPerDayEval / tradesPerDayEval

  const maxEvalSLTrades =
    riskPerTradeEval > 0 ? Math.floor(maxDD / riskPerTradeEval) : 0

  const hedgePerPercentEval =
    maxDD > 0 ? (evalCost + failEvalProfit) / maxDD : 0

  const perSLProfitEval = hedgePerPercentEval * riskPerTradeEval
  const evalFailGrossPersonal = perSLProfitEval * maxEvalSLTrades
  const evalFailNet = evalFailGrossPersonal - evalCost

  const phase1RR =
    riskPerTradeEval > 0 ? phase1Target / riskPerTradeEval : 0
  const phase1CostPersonal = perSLProfitEval * phase1RR

  let phase2RR: number | undefined
  let phase2CostPersonal: number | undefined

  if (evalType === "two-step" && phase2Target !== undefined) {
    phase2RR = riskPerTradeEval > 0 ? phase2Target / riskPerTradeEval : 0
    phase2CostPersonal = perSLProfitEval * phase2RR
  }

  const costEvalPersonal = phase1CostPersonal + (phase2CostPersonal ?? 0)
  const costToFunded = costEvalPersonal + evalCost

  const riskPerTradeFunded = fundedRiskPerDay / fundedTradesPerDay
  const maxFundedSLTrades =
    riskPerTradeFunded > 0 ? Math.floor(maxDD / riskPerTradeFunded) : 0

  const hedgePerPercentFunded =
    maxDD > 0 ? (costToFunded + failFundedProfit) / maxDD : 0

  const perSLProfitFunded = hedgePerPercentFunded * riskPerTradeFunded

  const fundedFailGrossPersonal = perSLProfitFunded * maxFundedSLTrades
  const fundedFailNet = fundedFailGrossPersonal - costToFunded

  const payoutAmount =
    accountSize * (payoutTarget / 100) * (fundedSplit / 100)

  const payoutRRFunded =
    riskPerTradeFunded > 0 ? payoutTarget / riskPerTradeFunded : 0

  const hedgeLossPerPayout = perSLProfitFunded * payoutRRFunded

  const payoutScenarios: PayoutScenario[] = []

  let carryCost = costToFunded
  let prevNetAfter: number | null = null
  let prevNetFail: number | null = null

  for (let i = 1; i <= 10; i++) {
    const totalCost = carryCost + hedgeLossPerPayout
    const netAfterPayout = payoutAmount - totalCost
    const netIfFailAfter = fundedFailGrossPersonal - carryCost

    payoutScenarios.push({ index: i, totalCost, netAfterPayout, netIfFailAfter })

    carryCost = netAfterPayout < 0 ? -netAfterPayout : 0

    if (
      prevNetAfter !== null &&
      prevNetFail !== null &&
      Math.abs(netAfterPayout - prevNetAfter) < 1 &&
      Math.abs(netIfFailAfter - prevNetFail) < 1 &&
      carryCost < 1
    ) break

    prevNetAfter = netAfterPayout
    prevNetFail = netIfFailAfter
  }

  return {
    evalType,
    accountSize,
    evalCost,
    phase1Target,
    phase2Target,
    dailyDD,
    maxDD,

    riskPerDayEval: safeRiskPerDayEval,
    tradesPerDayEval,
    riskPerTradeEval,
    maxEvalSLTrades,
    perSLProfitEval,
    evalFailGrossPersonal,
    evalFailNet,

    phase1RR,
    phase1CostPersonal,
    phase2RR,
    phase2CostPersonal,
    costEvalPersonal,
    costToFunded,

    fundedRiskPerDay,
    fundedTradesPerDay,
    riskPerTradeFunded,
    maxFundedSLTrades,
    perSLProfitFunded,
    fundedFailGrossPersonal,
    fundedFailNet,

    payoutTarget,
    fundedSplit,
    payoutAmount,
    payoutRRFunded,
    hedgeLossPerPayout,
    payoutScenarios,
  }
}

/* ============================================================
   SIMULATOR UI (UPDATED TO YOUR NEW REQUIREMENTS)
   ------------------------------------------------------------
   ✅ No hedge-per-% language in UI
   ✅ User inputs TWO goals:
      1) Profit if Eval fails
      2) Profit if Funded fails before any payouts
   ✅ Remove presets (only custom)
   ✅ Focus on per-phase costs + per-payout outcomes
   ============================================================ */

type SimulatorState = {
  // Step 1: prop rules
  evalType: EvalType
  accountSize: number
  evalCost: number
  dailyDD: number
  maxDD: number
  phase1Target: number
  phase2Target: number

  // Step 2: how you trade (CUSTOM ONLY)
  riskPerDayEval: number
  tradesPerDayEval: number
  fundedRiskPerDay: number
  fundedTradesPerDay: number

  // Step 3: hedge goals (NEW)
  profitIfEvalFails: number
  profitIfFundedFailsBeforePayout: number

  // Step 4: payouts
  fundedSplit: number
  payoutTarget: number

  // advanced
  showAdvanced: boolean
}

const DEFAULTS: SimulatorState = {
  evalType: "two-step",
  accountSize: 100000,
  evalCost: 499,
  dailyDD: 5,
  maxDD: 10,
  phase1Target: 10,
  phase2Target: 5,

  riskPerDayEval: 1,
  tradesPerDayEval: 3,
  fundedRiskPerDay: 0.75,
  fundedTradesPerDay: 2,

  profitIfEvalFails: 2000,
  profitIfFundedFailsBeforePayout: 1000,

  fundedSplit: 80,
  payoutTarget: 3,

  showAdvanced: false,
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function n(v: any) {
  const x = typeof v === "string" ? Number(v) : v
  return Number.isFinite(x) ? x : 0
}

function clamp(v: number, min: number, max = Number.POSITIVE_INFINITY) {
  const x = Number.isFinite(v) ? v : min
  return Math.max(min, Math.min(max, x))
}

function money(v: number, digits = 0) {
  const sign = v < 0 ? "-" : ""
  const abs = Math.abs(v)
  return `${sign}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function num(v: number, digits = 2) {
  return v.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function pct(v: number, digits = 2) {
  return `${num(v, digits)}%`
}

function tone(v: number) {
  if (v > 0) return "good"
  if (v < 0) return "bad"
  return "neutral"
}

function Pill({
  label,
  value,
  sub,
  tone: t = "neutral",
  icon,
}: {
  label: string
  value: string
  sub?: string
  tone?: "neutral" | "good" | "bad" | "warn"
  icon?: React.ReactNode
}) {
  const styles =
    t === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : t === "bad"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
      : t === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-white/5 text-white/80"

  return (
    <div className={cn("rounded-2xl border px-4 py-3", styles)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase opacity-80">
            {icon ? <span className="opacity-90">{icon}</span> : null}
            <span className="truncate">{label}</span>
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight">{value}</div>
          {sub ? <div className="mt-1 text-xs opacity-75">{sub}</div> : null}
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white">{title}</div>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-white/60 leading-snug">{subtitle}</div>
            ) : null}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
  right,
}: {
  label: string
  hint?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/70">
          {label}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
      {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
    </div>
  )
}

function Input({
  value,
  onChange,
  suffix,
  min,
  step,
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  step?: number
}) {
  return (
    <div className="relative">
      <input
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => onChange(n(e.target.value))}
        type="number"
        min={min}
        step={step ?? 1}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
          "text-sm text-white placeholder:text-white/30 outline-none",
          "focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
        )}
      />
      {suffix ? (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
          {suffix}
        </div>
      ) : null}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
        "text-sm text-white outline-none",
        "focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-black">
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost"
  disabled?: boolean
  title?: string
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition"
  const styles =
    variant === "primary"
      ? "bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500"
      : variant === "secondary"
      ? "border border-white/10 bg-white/5 text-white hover:bg-white/8 disabled:opacity-50"
      : "text-white/80 hover:bg-white/5 disabled:opacity-50"
  return (
    <button
      className={cn(base, styles)}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function TinyToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold",
        checked
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
      )}
    >
      <span
        className={cn(
          "h-4 w-7 rounded-full border transition",
          checked
            ? "border-emerald-500/30 bg-emerald-500/25"
            : "border-white/10 bg-white/5"
        )}
      >
        <span
          className={cn(
            "block h-3 w-3 translate-y-[1px] rounded-full bg-white transition",
            checked ? "translate-x-[13px]" : "translate-x-[1px]"
          )}
        />
      </span>
      {label}
    </button>
  )
}

function StepTabs({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  const items = [
    { k: 1, label: "Rules" },
    { k: 2, label: "Trading" },
    { k: 3, label: "Failure goals" },
    { k: 4, label: "Outcomes" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = step === it.k
        return (
          <button
            key={it.k}
            type="button"
            onClick={() => setStep(it.k)}
            className={cn(
              "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
              active
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
            )}
          >
            <span className="mr-2 opacity-70">{it.k}</span>
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function Timeline({
  title,
  items,
  tone: t,
}: {
  title: string
  tone: "good" | "bad" | "neutral" | "warn"
  items: Array<{ label: string; value: string; sub?: string }>
}) {
  const header =
    t === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : t === "bad"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
      : t === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-white/5 text-white/80"

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className={cn("border-b px-5 py-4", header)}>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs opacity-80">“If this happens → here’s what happens to your money”</div>
      </div>

      <div className="p-5">
        <ol className="space-y-3">
          {items.map((it, idx) => (
            <li key={idx} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">
                    Step {idx + 1}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">{it.label}</div>
                  {it.sub ? <div className="mt-1 text-xs text-white/55 leading-snug">{it.sub}</div> : null}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-semibold">{it.value}</div>
                </div>
              </div>
              {idx < items.length - 1 ? (
                <div className="mt-3 flex items-center justify-center text-white/25">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* -------------------------
   Build core inputs (NEW)
   ------------------------- */

function buildInputsFromSimulator(s: SimulatorState): CalculatorInputs | null {
  const accountSize = clamp(n(s.accountSize), 0)
  const evalCost = clamp(n(s.evalCost), 0)
  const dailyDD = clamp(n(s.dailyDD), 0)
  const maxDD = clamp(n(s.maxDD), 0)
  const phase1Target = clamp(n(s.phase1Target), 0)
  const phase2Target = s.evalType === "two-step" ? clamp(n(s.phase2Target), 0) : undefined

  const riskPerDayEval = clamp(n(s.riskPerDayEval), 0)
  const tradesPerDayEval = clamp(n(s.tradesPerDayEval), 1)
  const fundedRiskPerDay = clamp(n(s.fundedRiskPerDay), 0)
  const fundedTradesPerDay = clamp(n(s.fundedTradesPerDay), 1)

  const fundedSplit = clamp(n(s.fundedSplit), 0, 100)
  const payoutTarget = clamp(n(s.payoutTarget), 0)

  const profitIfEvalFails = clamp(n(s.profitIfEvalFails), 0)
  const profitIfFundedFailsBeforePayout = clamp(n(s.profitIfFundedFailsBeforePayout), 0)

  if (!accountSize || !dailyDD || !maxDD) return null

  return {
    evalType: s.evalType,
    accountSize,
    evalCost,
    phase1Target,
    phase2Target,
    dailyDD,
    maxDD,

    riskPerDayEval,
    tradesPerDayEval,

    failEvalProfit: profitIfEvalFails,

    fundedSplit,
    failFundedProfit: profitIfFundedFailsBeforePayout,
    payoutTarget,
    fundedRiskPerDay,
    fundedTradesPerDay,
  }
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Page() {
  const [s, setS] = useState<SimulatorState>(DEFAULTS)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<string | null>(null)

  const coreInputs = useMemo(() => buildInputsFromSimulator(s), [s])
  const result = useMemo(
    () => (coreInputs ? calculateHedgedProp(coreInputs) : null),
    [coreInputs]
  )

  const warnings = useMemo(() => {
    const w: string[] = []
    const daily = clamp(n(s.dailyDD), 0)
    const max = clamp(n(s.maxDD), 0)

    if (max > 0 && daily > max) w.push("Daily DD is higher than Max DD.")
    if (clamp(n(s.tradesPerDayEval), 0) < 1)
      w.push("Trades/day (eval) must be at least 1.")
    if (clamp(n(s.fundedTradesPerDay), 0) < 1)
      w.push("Trades/day (funded) must be at least 1.")

    if (s.evalType === "two-step" && clamp(n(s.phase2Target), 0) <= 0)
      w.push("Two-step selected but Phase 2 target is 0.")

    if (clamp(n(s.profitIfEvalFails), 0) <= 0)
      w.push("Profit if eval fails is 0. You’re not covering the evaluation fee.")

    if (clamp(n(s.profitIfFundedFailsBeforePayout), 0) <= 0)
      w.push("Profit if funded fails (before payouts) is 0.")

    if (clamp(n(s.fundedSplit), 0) <= 0)
      w.push("Funded split is 0%.")

    if (clamp(n(s.payoutTarget), 0) <= 0)
      w.push("Payout target is 0%.")

    return w
  }, [s])

  const hero = useMemo(() => {
    if (!result) return null

    const firstPayout = result.payoutScenarios[0]
    const breakEvenIdx =
      result.payoutScenarios.find((x) => x.netAfterPayout >= 0)?.index ?? null

    return {
      evalFailNet: result.evalFailNet,
      fundedFailNet: result.fundedFailNet,
      costToFunded: result.costToFunded,
      payoutAmount: result.payoutAmount,
      firstNetAfter: firstPayout?.netAfterPayout ?? 0,
      breakEvenIdx,
    }
  }, [result])

  async function copySummary() {
    try {
      if (!result) return
      const payload = { inputs: coreInputs, result }
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setToast("Copied simulator JSON.")
      setTimeout(() => setToast(null), 1700)
    } catch {
      setToast("Clipboard blocked by browser.")
      setTimeout(() => setToast(null), 1700)
    }
  }

  function reset() {
    setS(DEFAULTS)
    setStep(1)
  }

  const stepTitle = useMemo(() => {
    if (step === 1) return "Step 1 — Prop rules"
    if (step === 2) return "Step 2 — Trading behaviour"
    if (step === 3) return "Step 3 — Your failure goals"
    return "Step 4 — Outcomes & payouts"
  }, [step])

  const riskPerTradeEval = result?.riskPerTradeEval ?? 0
  const riskPerTradeFunded = result?.riskPerTradeFunded ?? 0

  const failEvalTimeline = useMemo(() => {
    if (!result) return []
    return [
      {
        label: `Prop hits Max DD (${pct(result.maxDD, 0)})`,
        value: "Fail eval",
        sub: "This is the stop-out we’re planning for.",
      },
      {
        label: "Your target profit if eval fails",
        value: money(s.profitIfEvalFails),
        sub: "This is what you said you want to walk away with (from the hedge side).",
      },
      {
        label: "Eval fee paid",
        value: `-${money(result.evalCost)}`,
        sub: "Upfront evaluation cost.",
      },
      {
        label: "Net result if eval fails",
        value: money(result.evalFailNet),
        sub: "Net outcome shown by the simulator after fees and hedge math.",
      },
    ]
  }, [result, s.profitIfEvalFails])

  const passEvalTimeline = useMemo(() => {
    if (!result) return []

    const items: Array<{ label: string; value: string; sub?: string }> = [
      {
        label: `Reach Phase 1 target (${pct(result.phase1Target, 0)})`,
        value: "Pass phase 1",
        sub: `At your settings: risk/trade ≈ ${pct(result.riskPerTradeEval)} and max SL trades ≈ ${result.maxEvalSLTrades}.`,
      },
    ]

    if (result.evalType === "two-step") {
      items.push({
        label: `Reach Phase 2 target (${pct(result.phase2Target ?? 0, 0)})`,
        value: "Pass phase 2",
        sub: "Two-step evaluations require a second profit target.",
      })
    }

    items.push({
      label: "Cost carried into funded",
      value: money(result.costToFunded),
      sub: "This is the amount your first payout must overcome to be net-positive.",
    })

    return items
  }, [result])

  const failFundedTimeline = useMemo(() => {
    if (!result) return []

    return [
      {
        label: "You reach funded",
        value: "Start funded",
        sub: `Carried cost: ${money(result.costToFunded)}. Risk/trade ≈ ${pct(result.riskPerTradeFunded)}.`,
      },
      {
        label: "Funded fails before any payout",
        value: `Hit Max DD (${pct(result.maxDD, 0)})`,
        sub: "We assume you fail before reaching your first payout checkpoint.",
      },
      {
        label: "Your target profit if funded fails (before payouts)",
        value: money(s.profitIfFundedFailsBeforePayout),
        sub: "This is what you said you want to walk away with from the hedge side.",
      },
      {
        label: "Net result if funded fails",
        value: money(result.fundedFailNet),
        sub: "Net outcome shown by the simulator after carried costs and hedge math.",
      },
    ]
  }, [result, s.profitIfFundedFailsBeforePayout])

  const payoutCards = useMemo(() => {
    if (!result) return []
    return result.payoutScenarios.slice(0, 6).map((p) => ({
      index: p.index,
      netAfter: p.netAfterPayout,
      totalCost: p.totalCost,
      netIfFailAfter: p.netIfFailAfter,
    }))
  }, [result])

  return (
    <div className="min-h-screen bg-[#070A0E] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <Shield className="h-4 w-4 text-emerald-300" />
              Prop vs Broker Hedging
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Failure-Goal Hedging Simulator
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60 leading-relaxed">
              You don’t think in “$ per %”. You think in outcomes. Set what you want to make if you fail, then see the
              costs per phase and how many payouts it takes to be net-positive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button variant="primary" onClick={copySummary} disabled={!result}>
              <ClipboardCopy className="h-4 w-4" />
              Copy JSON
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Pill
            label="Net if eval fails"
            value={hero ? money(hero.evalFailNet) : "—"}
            tone={hero ? (tone(hero.evalFailNet) as any) : "neutral"}
            icon={<TrendingDown className="h-4 w-4" />}
            sub="End result when evaluation hits Max DD."
          />
          <Pill
            label="Net if funded fails"
            value={hero ? money(hero.fundedFailNet) : "—"}
            tone={hero ? (tone(hero.fundedFailNet) as any) : "neutral"}
            icon={<TrendingDown className="h-4 w-4" />}
            sub="End result if funded hits Max DD before payouts."
          />
          <Pill
            label="Break-even after"
            value={
              hero
                ? hero.breakEvenIdx
                  ? `${hero.breakEvenIdx} payout${hero.breakEvenIdx === 1 ? "" : "s"}`
                  : "10+ payouts"
                : "—"
            }
            tone={hero ? (hero.breakEvenIdx && hero.breakEvenIdx <= 2 ? "good" : "warn") : "neutral"}
            icon={<Sparkles className="h-4 w-4" />}
            sub="First payout number where net-after-payout ≥ 0."
          />
          <Pill
            label="Payout size"
            value={hero ? money(hero.payoutAmount) : "—"}
            tone="neutral"
            icon={<TrendingUp className="h-4 w-4" />}
            sub={hero ? `Cost to funded: ${money(hero.costToFunded)}` : ""}
          />
        </div>

        {warnings.length ? (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="text-sm">
                <div className="font-semibold">Quick checks</div>
                <ul className="mt-1 list-disc pl-5 text-xs text-amber-100/80">
                  {warnings.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StepTabs step={step} setStep={setStep} />
          <div className="flex items-center gap-2">
            <TinyToggle
              checked={s.showAdvanced}
              onChange={(v) => setS((p) => ({ ...p, showAdvanced: v }))}
              label="Advanced math"
            />
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
              <Info className="h-4 w-4" />
              Guided mode keeps it simple.
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm font-semibold text-white/80">{stepTitle}</div>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    title="Prop firm rules"
                    subtitle="These are fixed constraints. They define the game."
                    icon={<Shield className="h-5 w-5 text-emerald-300" />}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Evaluation type">
                        <Select
                          value={s.evalType}
                          onChange={(v) =>
                            setS((p) => ({
                              ...p,
                              evalType: v as EvalType,
                              phase2Target:
                                v === "two-step" ? (p.phase2Target || 5) : p.phase2Target,
                            }))
                          }
                          options={[
                            { value: "one-step", label: "One-step" },
                            { value: "two-step", label: "Two-step" },
                          ]}
                        />
                      </Field>

                      <Field label="Account size" hint="Nominal prop account size.">
                        <Input
                          value={s.accountSize}
                          onChange={(v) => setS((p) => ({ ...p, accountSize: v }))}
                          suffix="$"
                          min={0}
                          step={1000}
                        />
                      </Field>

                      <Field label="Evaluation fee" hint="Upfront cost you pay.">
                        <Input
                          value={s.evalCost}
                          onChange={(v) => setS((p) => ({ ...p, evalCost: v }))}
                          suffix="$"
                          min={0}
                          step={1}
                        />
                      </Field>

                      <Field label="Daily drawdown" hint="Daily loss limit.">
                        <Input
                          value={s.dailyDD}
                          onChange={(v) => setS((p) => ({ ...p, dailyDD: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>

                      <Field label="Max drawdown" hint="Total loss limit.">
                        <Input
                          value={s.maxDD}
                          onChange={(v) => setS((p) => ({ ...p, maxDD: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>

                      <Field label="Phase 1 target" hint="Profit target (phase 1).">
                        <Input
                          value={s.phase1Target}
                          onChange={(v) => setS((p) => ({ ...p, phase1Target: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>

                      {s.evalType === "two-step" ? (
                        <Field label="Phase 2 target" hint="Profit target (phase 2).">
                          <Input
                            value={s.phase2Target}
                            onChange={(v) => setS((p) => ({ ...p, phase2Target: v }))}
                            suffix="%"
                            min={0}
                            step={0.25}
                          />
                        </Field>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                      Next, we define how you trade — your risk per trade is derived automatically.
                    </div>
                  </Card>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    title="Trading behaviour (custom only)"
                    subtitle="No presets. These are your real numbers."
                    icon={<Calculator className="h-5 w-5 text-emerald-300" />}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
                          Risk per trade (eval)
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {result ? pct(result.riskPerTradeEval) : "—"}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Derived from risk/day ÷ trades/day (capped by daily DD).
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
                          Risk per trade (funded)
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {result ? pct(result.riskPerTradeFunded) : "—"}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Derived from funded risk/day ÷ trades/day.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Risk per day (eval)" hint="Percent of account you risk per day.">
                        <Input
                          value={s.riskPerDayEval}
                          onChange={(v) => setS((p) => ({ ...p, riskPerDayEval: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>
                      <Field label="Trades per day (eval)" hint="How many attempts per day.">
                        <Input
                          value={s.tradesPerDayEval}
                          onChange={(v) => setS((p) => ({ ...p, tradesPerDayEval: v }))}
                          min={1}
                          step={1}
                        />
                      </Field>
                      <Field label="Risk per day (funded)" hint="Usually lower than evaluation.">
                        <Input
                          value={s.fundedRiskPerDay}
                          onChange={(v) => setS((p) => ({ ...p, fundedRiskPerDay: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>
                      <Field label="Trades per day (funded)" hint="Used to compute funded risk/trade.">
                        <Input
                          value={s.fundedTradesPerDay}
                          onChange={(v) => setS((p) => ({ ...p, fundedTradesPerDay: v }))}
                          min={1}
                          step={1}
                        />
                      </Field>
                    </div>

                    {s.showAdvanced && result ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Pill
                          label="Max SL trades (eval)"
                          value={String(result.maxEvalSLTrades)}
                          tone="neutral"
                          sub={`Max DD ${pct(result.maxDD, 0)} ÷ risk/trade ${pct(result.riskPerTradeEval)}`}
                        />
                        <Pill
                          label="Max SL trades (funded)"
                          value={String(result.maxFundedSLTrades)}
                          tone="neutral"
                          sub={`Max DD ${pct(result.maxDD, 0)} ÷ risk/trade ${pct(result.riskPerTradeFunded)}`}
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                      This step only controls how you hit targets and how fast you consume drawdown.
                    </div>
                  </Card>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    title="Your failure goals"
                    subtitle="Decide what you want to walk away with in each failure scenario."
                    icon={<Sparkles className="h-5 w-5 text-emerald-300" />}
                  >
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                      <div className="text-sm font-semibold">This is the new mental model</div>
                      <div className="mt-1 text-sm text-emerald-100/80 leading-relaxed">
                        Instead of guessing hedge rates, you tell the simulator your desired profit outcomes.
                        It then computes what the hedge side must accomplish.
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <Field
                        label="Profit if evaluation fails"
                        hint="This is the profit you want to make on the hedge side if eval hits Max DD."
                      >
                        <Input
                          value={s.profitIfEvalFails}
                          onChange={(v) => setS((p) => ({ ...p, profitIfEvalFails: v }))}
                          suffix="$"
                          min={0}
                          step={50}
                        />
                      </Field>

                      <Field
                        label="Profit if funded fails (before any payouts)"
                        hint="This is the profit you want to make on the hedge side if funded hits Max DD before payout."
                      >
                        <Input
                          value={s.profitIfFundedFailsBeforePayout}
                          onChange={(v) => setS((p) => ({ ...p, profitIfFundedFailsBeforePayout: v }))}
                          suffix="$"
                          min={0}
                          step={50}
                        />
                      </Field>
                    </div>

                    {result ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Pill
                          label="Net if eval fails"
                          value={money(result.evalFailNet)}
                          tone={tone(result.evalFailNet) as any}
                          sub="This is the simulator result after evaluation fee + hedge math."
                        />
                        <Pill
                          label="Net if funded fails"
                          value={money(result.fundedFailNet)}
                          tone={tone(result.fundedFailNet) as any}
                          sub="This is the simulator result after carried costs + hedge math."
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                      Next step: payouts. We show how many payouts you need to become net-positive.
                    </div>
                  </Card>
                </motion.div>
              ) : null}

              {step === 4 ? (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    title="Outcomes & payouts"
                    subtitle="Focus on per-phase and per-payout outcomes."
                    icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field label="Payout split (funded)" hint="Your percentage of the payout.">
                        <Input
                          value={s.fundedSplit}
                          onChange={(v) => setS((p) => ({ ...p, fundedSplit: v }))}
                          suffix="%"
                          min={0}
                          step={1}
                        />
                      </Field>
                      <Field label="Payout target" hint="How big each payout is (as % of account).">
                        <Input
                          value={s.payoutTarget}
                          onChange={(v) => setS((p) => ({ ...p, payoutTarget: v }))}
                          suffix="%"
                          min={0}
                          step={0.25}
                        />
                      </Field>
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4" />
                        <div className="text-sm">
                          <div className="font-semibold">Interpretation tip</div>
                          <div className="mt-1 text-amber-100/80">
                            “Cost to funded” is what payout #1 must beat. “Net after payout” tells you when the whole
                            plan becomes profitable.
                          </div>
                        </div>
                      </div>
                    </div>

                    {result ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Pill
                          label="Cost to funded"
                          value={money(result.costToFunded)}
                          tone="warn"
                          sub="Total carried cost after passing eval."
                        />
                        <Pill
                          label="Payout size"
                          value={money(result.payoutAmount)}
                          tone="neutral"
                          sub={`${pct(result.payoutTarget)} payout • ${pct(result.fundedSplit, 0)} split`}
                        />
                      </div>
                    ) : null}
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep((p) => Math.max(1, p - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep((p) => Math.min(4, p + 1))}
                disabled={step === 4}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <Card
              title="Execution summary"
              subtitle="A single, execution-focused view."
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            >
              {!result ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  Enter account size + drawdown rules to calculate.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Pill
                    label="Risk per trade (eval)"
                    value={pct(riskPerTradeEval)}
                    tone="neutral"
                    sub={`Risk/day ${pct(result.riskPerDayEval)} • Trades/day ${result.tradesPerDayEval}`}
                  />
                  <Pill
                    label="Risk per trade (funded)"
                    value={pct(riskPerTradeFunded)}
                    tone="neutral"
                    sub={`Risk/day ${pct(result.fundedRiskPerDay)} • Trades/day ${result.fundedTradesPerDay}`}
                  />
                  <Pill
                    label="Goal profit if eval fails"
                    value={money(s.profitIfEvalFails)}
                    tone="warn"
                    sub="Your chosen outcome for eval failure."
                  />
                  <Pill
                    label="Goal profit if funded fails"
                    value={money(s.profitIfFundedFailsBeforePayout)}
                    tone="warn"
                    sub="Your chosen outcome for funded failure before payout."
                  />
                </div>
              )}

              {result ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  <div className="font-semibold text-white">Your plan (plain English)</div>
                  <ul className="mt-2 list-disc pl-5 text-white/65 space-y-1">
                    <li>
                      Eval risk per trade ≈ <span className="text-white font-semibold">{pct(result.riskPerTradeEval)}</span>.
                    </li>
                    <li>
                      If eval fails, you want to net <span className="text-white font-semibold">{money(s.profitIfEvalFails)}</span> from the hedge side.
                    </li>
                    <li>
                      If funded fails before payouts, you want to net <span className="text-white font-semibold">{money(s.profitIfFundedFailsBeforePayout)}</span> from the hedge side.
                    </li>
                    <li>
                      Each payout is about <span className="text-white font-semibold">{money(result.payoutAmount)}</span>.
                    </li>
                  </ul>
                </div>
              ) : null}
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Timeline title="If you FAIL evaluation" tone="bad" items={failEvalTimeline} />
                <Timeline title="If you PASS evaluation" tone="good" items={passEvalTimeline} />
              </div>

              <Timeline title="If you FAIL funded (before payouts)" tone="bad" items={failFundedTimeline} />

              <Card
                title="Payout checkpoints"
                subtitle="How many payouts until the strategy is net-positive?"
                icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
                right={
                  result ? <div className="text-xs text-white/55">Showing {payoutCards.length} scenarios</div> : null
                }
              >
                {!result ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                    Calculate first to see payout checkpoints.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {payoutCards.map((p) => {
                      const ok = p.netAfter >= 0
                      return (
                        <div
                          key={p.index}
                          className={cn(
                            "rounded-2xl border p-4",
                            ok
                              ? "border-emerald-500/20 bg-emerald-500/10"
                              : "border-rose-500/20 bg-rose-500/10"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
                                Payout #{p.index}
                              </div>
                              <div className="mt-1 text-lg font-semibold">
                                Net after payout:{" "}
                                <span className={ok ? "text-emerald-100" : "text-rose-100"}>
                                  {money(p.netAfter)}
                                </span>
                              </div>
                              <div className="mt-2 text-xs opacity-75">
                                Total cost paid by this point: {money(p.totalCost)}
                              </div>
                            </div>
                            <div className="mt-1">
                              {ok ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-200" />
                              )}
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                            If you fail after this (hit max DD), net would be:{" "}
                            <span className={p.netIfFailAfter >= 0 ? "text-emerald-100" : "text-rose-100"}>
                              {money(p.netIfFailAfter)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {result ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                    The simulator “carries” deficits forward. If payout #1 is negative, it assumes you’re still in the
                    hole and shows what payout #2 would look like.
                  </div>
                ) : null}
              </Card>

              {s.showAdvanced && result ? (
                <Card
                  title="Advanced (power users)"
                  subtitle="Extra numbers if you want the full math view."
                  icon={<Info className="h-5 w-5 text-emerald-300" />}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Pill
                      label="Phase 1 RR"
                      value={num(result.phase1RR, 1) + "R"}
                      tone="neutral"
                      sub="Target % divided by risk per trade (eval)."
                    />
                    {result.evalType === "two-step" ? (
                      <Pill
                        label="Phase 2 RR"
                        value={num(result.phase2RR ?? 0, 1) + "R"}
                        tone="neutral"
                        sub="Second target in R terms."
                      />
                    ) : (
                      <Pill label="Phase 2" value="—" tone="neutral" sub="One-step evaluation." />
                    )}
                    <Pill
                      label="Cost eval (hedge bleed)"
                      value={money(result.costEvalPersonal)}
                      tone="warn"
                      sub="Personal cost from hedge while reaching targets."
                    />
                    <Pill
                      label="Hedge loss per payout"
                      value={money(result.hedgeLossPerPayout)}
                      tone="warn"
                      sub={`At payout RR ≈ ${num(result.payoutRRFunded, 1)}R`}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                    Reminder: You control the “profit if fail” inputs. The calculator derives hedge economics from that.
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/80 px-4 py-2 text-sm text-white/80 backdrop-blur"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
