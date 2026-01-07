"use client"


import useSWR, { mutate } from "swr"
import { RiskHeader } from "@/components/fundamentals/RiskHeader"

import type { FundamentalsSnapshot } from "@/lib/fundamentals/types"


import React, { useEffect, useMemo, useRef, useState } from "react"
function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}
import type { MarketEvent } from "@/lib/fundamentals/types"


import { ArrowRightLeft } from "lucide-react"
import { RotateCcw } from "lucide-react"

import { AnimatePresence, motion } from "framer-motion"
import clsx from "clsx"
import {
  Activity,
  AlarmClock,
  AlignLeft,
  Aperture,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  CandlestickChart,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  Command,
  Compass,
  Cpu,
  Crosshair,
  Database,
  FileText,
  Filter,
  Flame,
  Globe,
  Gauge,
  GitBranch,
  Hash,
  HeartPulse,
  HelpCircle,
  History,
  Landmark,
  Layers,
  LineChart,
  Link as LinkIcon,
  List,
  Loader2,
  Lock,
  MessageSquareText,
  Moon,
  Newspaper,
  Percent,
  PieChart,
  Radar,
  RefreshCcw,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  SplitSquareVertical,
  Star,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  Wand2,
  X,
  Zap,
} from "lucide-react"


/* -------------------------------------------------------------------------- */
/*                          Small Utilities + Types                            */
/* -------------------------------------------------------------------------- */
import type {
  CalendarEvent as BaseCalendarEvent,
} from "@/lib/fundamentals/types"

type UICalendarEvent = BaseCalendarEvent & {
  region: string
  type: "Economic" | "Holiday" | "CentralBank" | string

  watch: string[]
  notes: string

  expected?: string | number
  prior?: string | number
  consensusRange?: string
  guidance?: string
}


type Tone = "good" | "bad" | "neutral" | "warn" | "info"

type AssetClass = "FX" | "Indices" | "Rates" | "Commodities" | "Metals" | "Crypto"
type MarketRegime = "Risk-On" | "Risk-Off" | "Inflation" | "Disinflation" | "Growth" | "Recession"

type SentimentLabel =
  | "Bullish"
  | "Bearish"
  | "Neutral"
  | "Risk-On"
  | "Risk-Off"
  | "Inflationary"
  | "Deflationary"

type Impact = "Low" | "Medium" | "High" | "Extreme"

type SourceKind = "News" | "Macro" | "CentralBank" | "Flow" | "Earnings" | "Onchain" | "Social"



type CrossMarketRow = {
  symbol: string
  assetClass: AssetClass
  bias: "Long" | "Short" | "Neutral"
  confidence: number
  catalysts: string[]
  correlationNotes: string
  playbook: string
  keyLevels: { label: string; value: number }[]
  spark: number[] // 0..100 line
}



type CBComm = {
  id: string
  ts: number
  bank: "Fed" | "ECB" | "BoE" | "BoJ" | "PBoC" | "RBA" | "BoC"
  speaker: string
  title: string
  hawkDove: number // -100..100 (dovish..hawkish)
  keyQuotes: readonly string[]
  summary: string
  watchlistImpacts: readonly string[]
}

type MacroSnapshot = {
  regime: MarketRegime
  headline: string
  marketPricing: {
    fedCutsNext12m: string
    terminalRate: string
    inflationBreakevens: string
    growthNowcast: string
    riskPremium: string
  }
  positioning: {
    usd: "Crowded Long" | "Neutral" | "Crowded Short"
    equities: "Overweight" | "Neutral" | "Underweight"
    bonds: "Long Duration" | "Neutral" | "Short Duration"
    gold: "Accumulation" | "Neutral" | "Distribution"
  }
  narrative: string
  reactionRules: { if: string; then: string; confidence: number }[]
  watch: string[]
}

type UserPrefs = {
  theme: "dark" | "darker"
  focusAssetClass: AssetClass | "All"
  impactFilter: Impact | "All"
  sourceFilter: SourceKind | "All"
  compactMode: boolean
  showExplain: boolean
}


/* -------------------------------------------------------------------------- */
/*                                Mock Data                                   */
/* -------------------------------------------------------------------------- */

// tiny deterministic-ish pseudo-random helper

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
function fmtDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

type RiskMode = "Normal" | "Cautious" | "Defensive"

function riskModePill(mode: RiskMode) {
  if (mode === "Defensive") return "ring-red-500/30 bg-red-500/10 text-red-200"
  if (mode === "Cautious") return "ring-yellow-500/30 bg-yellow-500/10 text-yellow-200"
  return "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
}

function riskModeDot(mode: RiskMode) {
  if (mode === "Defensive") return "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.25)]"
  if (mode === "Cautious") return "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.18)]"
  return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.25)]"
}


function impactBadge(impact: Impact) {
  if (impact === "Extreme") return "ring-red-500/40 bg-red-500/10 text-red-200"
  if (impact === "High") return "ring-orange-500/40 bg-orange-500/10 text-orange-200"
  if (impact === "Medium") return "ring-yellow-500/40 bg-yellow-500/10 text-yellow-200"
  return "ring-white/10 bg-white/5 text-text-muted"
}
function sourceBadge(source: SourceKind) {
  if (source === "CentralBank") return "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  if (source === "Macro") return "ring-sky-500/30 bg-sky-500/10 text-sky-200"
  if (source === "Flow") return "ring-violet-500/30 bg-violet-500/10 text-violet-200"
  if (source === "Earnings") return "ring-pink-500/30 bg-pink-500/10 text-pink-200"
  if (source === "Onchain") return "ring-amber-500/30 bg-amber-500/10 text-amber-200"
  if (source === "Social") return "ring-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200"
  return "ring-white/10 bg-white/5 text-text-muted"
}
function sentimentBadge(s: SentimentLabel) {
  if (s === "Bullish" || s === "Risk-On") return "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  if (s === "Bearish" || s === "Risk-Off") return "ring-red-500/30 bg-red-500/10 text-red-200"
  if (s === "Inflationary") return "ring-orange-500/30 bg-orange-500/10 text-orange-200"
  if (s === "Deflationary") return "ring-sky-500/30 bg-sky-500/10 text-sky-200"
  return "ring-white/10 bg-white/5 text-text-muted"
}
function confPill(conf: number) {
  const p = Math.round(conf * 100)
  if (p >= 80) return "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  if (p >= 60) return "ring-sky-500/30 bg-sky-500/10 text-sky-200"
  if (p >= 45) return "ring-yellow-500/30 bg-yellow-500/10 text-yellow-200"
  return "ring-red-500/30 bg-red-500/10 text-red-200"
}





/* -------------------------------------------------------------------------- */
/*                             Persistence Helpers                              */
/* -------------------------------------------------------------------------- */

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback
    const p = JSON.parse(raw)
    return p ?? fallback
  } catch {
    return fallback
  }
}
function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) {
        setState(JSON.parse(stored))
      }
    } catch {}
  }, [key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state])

  return [state, setState] as const
}


const fetcher = (url: string) => fetch(url).then((r) => r.json())


/* -------------------------------------------------------------------------- */
/*                                   UI Bits                                   */
/* -------------------------------------------------------------------------- */
// Add near the bottom of your page.tsx (or wherever you keep UI helpers)
import type { AIEventInsight } from "@/lib/fundamentals/ai/types"

function AIInsightView({ data }: { data: AIEventInsight }) {
  const impactPill = (v: "Bullish" | "Bearish" | "Neutral") =>
    v === "Bullish"
      ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : v === "Bearish"
      ? "ring-red-500/30 bg-red-500/10 text-red-200"
      : "ring-white/10 bg-white/5 text-white/70"

  const riskPill =
    data.riskLevel === "High"
      ? "ring-orange-500/30 bg-orange-500/10 text-orange-200"
      : data.riskLevel === "Medium"
      ? "ring-sky-500/30 bg-sky-500/10 text-sky-200"
      : "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Simple summary</p>
          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full px-2.5 py-1 text-[11px] ring-1", riskPill)}>
              Risk: {data.riskLevel}
            </span>
            <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2.5 py-1 text-[11px] text-white/75">
              {Math.round(data.confidence)}% confidence
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/85 leading-relaxed">{data.simpleSummary}</p>
      </div>

      <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
        {/* WHY IT MATTERS */}
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
          

          {/* Case 1: AI returned a string */}
          {typeof data.whyItMatters === "string" && (
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              {data.whyItMatters}
            </p>
          )}

          {/* Case 2: AI returned structured insight */}
          {typeof data.whyItMatters === "object" && data.whyItMatters && (
            <>
              <p className="mt-2 text-xs uppercase tracking-wide text-white/50">

                {data.whyItMatters.headline}
              </p>

              <ul className="mt-3 space-y-2">
                {data.whyItMatters.bullets.map((b: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>


      </div>

      <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
        <p className="text-sm font-semibold text-white">Typical market impact</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.affectedSymbols?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.affectedSymbols.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-black/30 ring-1 ring-white/10 px-3 py-1.5 text-xs text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {data.scenarios?.length ? (
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
            <p className="text-sm font-semibold text-white">Scenario outcomes</p>

            <div className="mt-3 space-y-3">
              {data.scenarios.map((s, i) => (
                <div key={i} className="rounded-2xl bg-black/25 ring-1 ring-white/10 p-4">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="mt-1 text-sm text-white/70">{s.description}</p>
                  <ul className="mt-2 text-xs text-white/60">
                    {s.likelyMoves.map((m, j) => (
                      <li key={j}>• {m}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}


          {[
            ["Equities", data.marketImpact.equities],
            ["FX", data.marketImpact.fx],
            ["Rates", data.marketImpact.rates],
            ["Metals", data.marketImpact.metals ?? "Neutral"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-black/25 ring-1 ring-white/10 p-4">
              <p className="text-[11px] text-text-muted">{k}</p>
              <span className={clsx("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] ring-1", impactPill(v as any))}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
          <p className="text-sm font-semibold text-white">How to interpret</p>
          <ul className="mt-3 space-y-2">
            {data.howToInterpret?.slice(0, 8).map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
          <p className="text-sm font-semibold text-white">How to trade this type</p>
          <ul className="mt-3 space-y-2">
            {data.howToTrade?.slice(0, 8).map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.keyLevelsOrTriggers?.length ? (
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
          <p className="text-sm font-semibold text-white">Key triggers to watch</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.keyLevelsOrTriggers.slice(0, 6).map((x, i) => (
              <span
                key={i}
                className="rounded-full bg-black/30 ring-1 ring-white/10 px-3 py-1.5 text-xs text-white/80"
              >
                {x}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-black/25 ring-1 ring-white/10 p-5">
        <p className="text-xs text-text-muted">Note</p>
        <p className="mt-2 text-sm text-white/75 leading-relaxed">
          {data.disclaimer ?? "Educational only. Not financial advice."}
        </p>
      </div>
    </div>
  )
}



function LiveMetricIcon({
  icon,
  score,
  tone = "emerald",
}: {
  icon: React.ReactNode
  score: number // 0–100
  tone?: "emerald" | "sky" | "yellow" | "red"
}) {
  const intensity =
    score >= 75 ? 1 :
    score >= 50 ? 0.7 :
    score >= 30 ? 0.45 :
    0.25

  return (
    <motion.div
      className={`
        relative rounded-2xl p-3
        bg-black/40 ring-1 ring-white/10
        shadow-[0_0_0_0_rgba(0,0,0,0)]
      `}
      animate={{
        boxShadow: [
          `0 0 0px rgba(0,0,0,0)`,
          `0 0 ${12 + score * 0.15}px rgba(16,185,129,${0.25 * intensity})`,
          `0 0 0px rgba(0,0,0,0)`,
        ],
      }}
      transition={{
        duration: 2.8,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {/* soft halo */}
      <motion.div
        className={`
          absolute inset-0 rounded-2xl blur-xl
          bg-${tone}-400/20
        `}
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* icon */}
      <div className="relative z-10 text-white/90">
        {icon}
      </div>
    </motion.div>
  )
}

function SignalCard({
  title,
  value,
  score,
  hint,
  icon,
}: {
  title: string
  value: string
  score: number // 0..100
  hint?: string
  icon: React.ReactNode
}) {
  const s = Math.max(0, Math.min(100, Math.round(score)))
  const tone =
    s >= 75 ? "bg-emerald-500" : s >= 55 ? "bg-sky-500" : s >= 35 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="group relative rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 overflow-hidden">
      {/* Hover glow (same interaction as top KPI cards) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-sky-500/10 blur-2xl" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">{title}</p>
          <p className="mt-2 text-lg font-semibold text-white/90">{value}</p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        <LiveMetricIcon
          icon={icon}
          score={score}
          tone={
            score >= 70 ? "emerald" :
            score >= 50 ? "sky" :
            score >= 35 ? "yellow" :
            "red"
          }
        />

      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={clsx("h-full rounded-full", tone)}
          initial={{ width: 1 }}
          animate={{ width: `${s}%` }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        />

      </div>

      <div className="mt-2 text-[11px] text-white/50">{s}/100</div>
    </div>
  )
}

function Pill({
  children,
  className,
  icon,
  onClick,
  title,
}: {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  onClick?: () => void
  title?: string
}) {
  const common =
    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ring-white/10 bg-white/5 text-text-muted transition hover:bg-white/10"
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(common, onClick ? "cursor-pointer" : "cursor-default", className)}
    >
      {icon ? <span className="opacity-80">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  )
}

function ToneDot({ tone }: { tone: Tone }) {
  const c =
    tone === "good"
      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
      : tone === "bad"
      ? "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.25)]"
      : tone === "warn"
      ? "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.25)]"
      : tone === "info"
      ? "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
      : "bg-white/30"
  return <span className={clsx("h-2.5 w-2.5 rounded-full", c)} />
}

function startOfWeek(ts: number) {
  const d = new Date(ts)
  const day = d.getDay() || 7 // Sunday = 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day + 1)
  return d.getTime()
}

function endOfWeek(ts: number) {
  const d = new Date(startOfWeek(ts))
  d.setDate(d.getDate() + 7)
  return d.getTime()
}


function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white/5 ring-1 ring-white/10 p-2">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

function Divider({ className }: { className?: string }) {
  return <div className={clsx("h-px w-full bg-white/10", className)} />
}

function Stat({
  label,
  value,
  icon,
  hint,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  hint?: string
  tone?: Tone
}) {
  return (
    <div className="group relative rounded-2xl bg-black/30 ring-1 ring-white/10 p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {tone ? <ToneDot tone={tone} /> : <span className="h-2.5 w-2.5 rounded-full bg-white/20" />}
            <p className="text-xs text-text-muted">{label}</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 text-white/90">{icon}</div>
      </div>
    </div>
  )
}

function ProgressBar({
  value,
  label,
  left,
  right,
  tone,
}: {
  value: number // 0..100
  label: string
  left?: string
  right?: string
  tone?: Tone
}) {
  const v = clamp(value, 0, 100)
  const bar =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "bad"
      ? "bg-red-500"
      : tone === "warn"
      ? "bg-orange-500"
      : tone === "info"
      ? "bg-sky-500"
      : "bg-white/60"
  return (
    <div className="rounded-2xl bg-black/25 ring-1 ring-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">{label}</p>
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          {left ? <span>{left}</span> : null}
          <span className="rounded-full bg-white/5 ring-1 ring-white/10 px-2 py-0.5 text-white/80">{v}%</span>
          {right ? <span>{right}</span> : null}
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const w = 120
  const h = 34
  const pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - pad * 2) + pad
      const y = h - ((v - min) / span) * (h - pad * 2) - pad
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
    </svg>
  )
}

function IconButton({
  icon,
  label,
  onClick,
  className,
  disabled,
  title,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  className?: string
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function PrimaryButton({
  icon,
  children,
  onClick,
  className,
  title,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  className?: string
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition",
        "bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200",
        "shadow-[0_10px_40px_rgba(16,185,129,0.18)]",
        className
      )}
    >
      {icon ? <span className="opacity-90">{icon}</span> : null}
      {children}
    </button>
  )
}

function GhostButton({
  icon,
  children,
  onClick,
  className,
  title,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  className?: string
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-white/90 transition",
        "bg-white/5 hover:bg-white/10 ring-1 ring-white/10",
        className
      )}
    >
      {icon ? <span className="opacity-80">{icon}</span> : null}
      {children}
    </button>
  )
}



export function MinimalModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "max-w-4xl",
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  widthClass?: string
}) {
  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={onClose} // 👈 click outside closes
        >
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL */}
          <motion.div
            className={clsx(
              "relative w-full overflow-hidden rounded-3xl",
              "bg-[#0f0f0f]/95 text-white",
              "shadow-[0_40px_120px_rgba(0,0,0,0.65)]",
              "ring-1 ring-white/10",
              widthClass
            )}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onPointerDown={(e) => e.stopPropagation()} // 👈 prevent close inside
          >
            {(title || subtitle) && (
              <div className="border-b border-white/10 px-6 py-5">
                {title && (
                  <h3 className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-white/50">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


/* -------------------------------------------------------------------------- */
/*                             Fundamentals Page                               */
/* -------------------------------------------------------------------------- */

type TabKey =
  | "Overview"
  | "Sentiment"
  | "Calendar"
  | "Central Banks"


const DEFAULT_PREFS: UserPrefs = {
  theme: "dark",
  focusAssetClass: "All",
  impactFilter: "All",
  sourceFilter: "All",
  compactMode: false,
  showExplain: true,
}





export default function FundamentalsPage() {
  // 1️⃣ ALWAYS call hooks
  const hydrated = useHydrated()

  

  const [now, setNow] = useState<number>(0)
  const [liveNow, setLiveNow] = useState<number>(0)

  useEffect(() => {
    const t = Date.now()
    setNow(t)
    setLiveNow(t)
  }, [])


  // Add inside FundamentalsPage() component (near onRefresh etc.)
  async function openCachedAIInsight(kind: "event" | "calendar" | "central_bank", sourceId: string, payload: any) {
    console.log("🔥 openCachedAIInsight CALLED", kind, sourceId)
    setAiLoading(true)
    setAiExplanation(null as any) // we’ll store AIEventInsight in this state, see step 6C


    try {
      const res = await fetch("/api/fundamentals/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, sourceId, payload }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to generate insight")

      setAiTitle(payload?.title ?? "Insight")
      setAiSubtitle(payload?.subtitle ?? "")
      setAiExplanation(json.insight) // store AIEventInsight
    } catch (e: any) {
      setAiTitle("Insight unavailable")
      setAiSubtitle("")
      setAiExplanation({
        simpleSummary: "Could not generate an insight right now.",
        whyItMatters: e?.message ?? "Unknown error",
        marketImpact: { equities: "Neutral", fx: "Neutral", rates: "Neutral", metals: "Neutral", crypto: "Neutral" },
        howToInterpret: ["Try again in a moment.", "Check server logs for provider errors."],
        howToTrade: ["Reduce risk until context is clear."],
        keyLevelsOrTriggers: [],
        riskLevel: "Low",
        confidence: 30,
        disclaimer: "Educational only. Not financial advice.",
      })
    } finally {
      setAiLoading(false)
    }
  }








  
  const [prefs, setPrefs] = useLocalStorageState<UserPrefs>("fundamentals:prefs:v1", DEFAULT_PREFS)
  const [tab, setTab] = useLocalStorageState<TabKey>("fundamentals:tab:v1", "Overview")

  // simulate real-time refresh
  const [tick, setTick] = useState(0)
  const [isLive, setIsLive] = useState(true)
  // filters
  const [search, setSearch] = useState("")




  const { data: snap, error: snapErr, isLoading: snapLoading } =
  useSWR<FundamentalsSnapshot>(
    `/api/fundamentals/snapshot`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      shouldRetryOnError: false,
      keepPreviousData: true, // ⭐ IMPORTANT
    }
  )





  
  

  // SAFE macro (never undefined)
  const safeMacro: MacroSnapshot = snap?.macro ?? {
    regime: "Risk-On",
    headline: "Loading live macro regime…",
    marketPricing: {
      fedCutsNext12m: "-",
      terminalRate: "-",
      inflationBreakevens: "-",
      growthNowcast: "-",
      riskPremium: "-",
    },
    positioning: {
      usd: "Neutral",
      equities: "Neutral",
      bonds: "Neutral",
      gold: "Neutral",
    },
    narrative: "Fetching live fundamentals and market structure.",
    reactionRules: [],
    watch: [],
  }

  // derived collections (always safe)
  const marketEvents = snap?.events ?? []
  const rawCalendar = snap?.calendar ?? []

  const uiCalendar: UICalendarEvent[] = rawCalendar.map((c) => ({
    ...c,
    region: (c as any).region ?? "Global",
    type: (c as any).type ?? "Economic",
    watch: (c as any).watch ?? [],
    notes: (c as any).notes ?? "",
    expected: (c as any).expected,
    prior: (c as any).prior,
    consensusRange: (c as any).consensusRange,
    guidance: (c as any).guidance,
  }))

  const cross = snap?.crossMarket ?? []
  const anomalies = snap?.anomalies ?? []
  const cb = snap?.centralBanks ?? []
  

  const [loadingPulse, setLoadingPulse] = useState(false)

  useEffect(() => {
    if (!isLive) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 3500)
    return () => window.clearInterval(id)
  }, [isLive])

  
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<MarketEvent | null>(null)


  const [aiFocusSymbol, setAiFocusSymbol] = useState<string>("NAS100")
  const [aiTitle, setAiTitle] = useState<string>("")
  const [aiSubtitle, setAiSubtitle] = useState<string>("")

  const [aiExplanation, setAiExplanation] = useState<AIEventInsight | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [cbDetail, setCbDetail] = useState<CBComm | null>(null)
  const [cbModalOpen, setCbModalOpen] = useState(false)

  const [watchlist, setWatchlist] = useLocalStorageState<string[]>("fundamentals:watchlist:v1", [
    "EURUSD",
    "USDJPY",
    "XAUUSD",
    "NAS100",
    "SPX500",
  ])

  // compact mode influences density
  const density = prefs.compactMode ? "py-2" : "py-3"

  // highlight/search matcher
  const q = search.trim().toLowerCase()
  const match = (s: string) => (q ? s.toLowerCase().includes(q) : true)

  const filteredEvents = useMemo(() => {
    return marketEvents.filter((e) => {
      if (prefs.sourceFilter !== "All" && e.source !== prefs.sourceFilter) return false
      if (prefs.impactFilter !== "All" && e.impact !== prefs.impactFilter) return false
      
      if (!match(e.title) && !match(e.summary) && !e.tags.some((t) => match(t))) return false
      return true
    })
  }, [marketEvents, prefs.sourceFilter, prefs.impactFilter, q])

  const filteredCross = useMemo(() => {
    return cross.filter((r) => {
      if (prefs.focusAssetClass !== "All" && r.assetClass !== prefs.focusAssetClass) return false
      
      if (!match(r.symbol) && !match(r.assetClass) && !r.catalysts.some((c) => match(c))) return false
      return true
    })
  }, [cross, prefs.focusAssetClass, q])

  const filteredCalendar = useMemo(() => {
    function calendarTouchesFocusSymbols(
      c: UICalendarEvent,
      selectedSymbols: string[]
    ) {
      if (!selectedSymbols.length) return false
      return c.watch.some((w) => selectedSymbols.includes(w))
    }

    return uiCalendar.filter((c) => {
      // ❗ Calendar is GLOBAL truth — never hard-filter by symbols
      if (prefs.impactFilter !== "All" && c.impact !== prefs.impactFilter) return false

      // Search only
      if (
        !match(c.title) &&
        !match(c.notes) &&
        !c.watch.some((w) => match(w))
      ) {
        return false
      }

      return true
    })
  }, [uiCalendar, prefs.impactFilter, q])

  const overviewRef = useRef<HTMLDivElement | null>(null)
  const sentimentRef = useRef<HTMLDivElement | null>(null)
  const calendarRef = useRef<HTMLDivElement | null>(null)
  const centralBanksRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    const map: Record<string, React.RefObject<HTMLDivElement | null>> = {
      Overview: overviewRef,
      Sentiment: sentimentRef,
      Calendar: calendarRef,
      "Central Banks": centralBanksRef,
    }

    const ref = map[tab]
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [tab])

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      
      if (!match(a.name) && !match(a.symbol) && !match(a.category)) return false
      return true
    })
  }, [anomalies,q])

  const filteredCB = useMemo(() => {
    return cb.filter((x) => {
      if (!match(x.bank) && !match(x.speaker) && !match(x.title) && !x.keyQuotes.some((k) => match(k))) return false
      
      return true
    })
  }, [cb, q])

  const nowTs = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  // 1️⃣ High-impact events next 24h
  const highImpactNext24h = useMemo(() => {
    return uiCalendar.filter(
      c =>
        (c.impact === "High" || c.impact === "Extreme") &&
        c.ts >= nowTs &&
        c.ts <= nowTs + DAY
    ).length
  }, [uiCalendar])

  // 2️⃣ Central bank risk next 48h
  const cbNext48h = useMemo(() => {
    return uiCalendar.filter(
      c =>
        c.type === "CentralBank" &&
        c.ts >= nowTs &&
        c.ts <= nowTs + 2 * DAY
    ).length
  }, [uiCalendar])

  // 3️⃣ Volatility state (cheap version)
  const volatilityState = useMemo<"Low" | "Normal" | "High">(() => {
    const recent = anomalies.filter(a => a.ts >= nowTs - DAY)
    if (recent.length >= 3) return "High"
    if (recent.length === 2) return "Normal"
    return "Low"
  }, [anomalies])

  // 4️⃣ Trend alignment (mock but deterministic)
  const trendAlignment = useMemo(() => {
    const tracked = ["NAS100", "SPX500", "DXY", "US10Y"]
    const aligned = cross.filter(r => tracked.includes(r.symbol) && r.bias !== "Neutral")
    return {
      aligned: aligned.length,
      total: tracked.length,
    }
  }, [cross])

  const risk = useMemo(() => {
    const now = Date.now()

    const hasHighImpactNext24h = filteredCalendar.some(
      (e) => (e.impact === "High" || e.impact === "Extreme") && e.ts > now && e.ts < now + 24 * 60 * 60 * 1000
    )

    const hasVolatilityAnomaly = filteredAnomalies.some(
      (a) => a.category === "Volatility" && a.severity >= 60
    )

    const hasLiquidityAnomaly = filteredAnomalies.some(
      (a) => a.category === "Liquidity" && a.severity >= 55
    )

    let mode: RiskMode = "Normal"
    if (hasHighImpactNext24h || hasVolatilityAnomaly) mode = "Defensive"
    else if (hasLiquidityAnomaly) mode = "Cautious"

    const reasons: string[] = []
    if (hasHighImpactNext24h) reasons.push("High-impact economic event within 24h")
    if (hasVolatilityAnomaly) reasons.push("Short-term volatility expansion detected")
    if (hasLiquidityAnomaly) reasons.push("Abrupt price jump / thin liquidity detected")

    const desc =
      mode === "Normal"
        ? "Market conditions are stable. No elevated event or volatility risk detected."
        : mode === "Cautious"
        ? "Minor instability detected. Liquidity irregularities may impact execution."
        : "Elevated market risk detected. High-impact events or volatility expansion active."

    const playbook =
      mode === "Normal"
        ? ["Trade standard size", "Normal stop placement", "No execution restrictions"]
        : mode === "Cautious"
        ? ["Reduce position size", "Prefer pullbacks over breakouts", "Use limit orders where possible"]
        : ["Reduce size aggressively", "Avoid market orders", "Avoid trading into news", "Prioritise capital preservation"]

    return { mode, reasons, desc, playbook }
  }, [filteredCalendar, filteredAnomalies])


  function openCentralBankModal(comm: CBComm) {
    setCbDetail(comm)
    setCbModalOpen(true)
  }


  function openEvent(e: MarketEvent) {
    setDetail(e)
    setDetailOpen(true)
  }



  function onRefresh() {
    setLoadingPulse(true)

    mutate(
      `/api/fundamentals/snapshot`,
      undefined,
      { revalidate: true }
    )

    window.setTimeout(() => setLoadingPulse(false), 600)
  }





  function toggleWatch(sym: string) {
    setWatchlist((prev) => {
      if (prev.includes(sym)) return prev.filter((x) => x !== sym)
      return [...prev, sym]
    })
  }



    // 2️⃣ THEN you may conditionally render
  if (!hydrated) {
    return (
      <div className="flex-1 p-6">
        <div className="h-8 w-48 rounded-xl bg-white/5" />
        <div className="mt-6 space-y-4">
          <div className="h-24 rounded-3xl bg-white/5" />
          <div className="h-24 rounded-3xl bg-white/5" />
          <div className="h-24 rounded-3xl bg-white/5" />
        </div>
      </div>
    )
  }



  return (
    <div className="relative flex-1 overflow-x-hidden">
            {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      {/* Top header */}
      <div className="relative border-b border-white/5">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4">

          {/* GRID HEADER */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">

            {/* LEFT: Title + Tabs */}
            <div className="space-y-3 min-w-0">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 p-2 text-emerald-200">
                  <Brain className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                    Fundamentals
                    <span className="ml-2 hidden sm:inline text-xs font-semibold text-emerald-200/90">
                      made so easy even technical traders can use it
                    </span>
                  </h1>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Shows you what the market expects and how to react — in real time.
                  </p>
                </div>
              </div>

              {/* Tabs — now visually tied to title */}
              <div className="flex flex-wrap gap-2">
                <TabButton active={tab === "Overview"} onClick={() => setTab("Overview")} icon={<Compass className="h-4 w-4" />}>
                  Overview
                </TabButton>
                <TabButton active={tab === "Sentiment"} onClick={() => setTab("Sentiment")} icon={<Flame className="h-4 w-4" />}>
                  Sentiment
                </TabButton>
                <TabButton active={tab === "Calendar"} onClick={() => setTab("Calendar")} icon={<CalendarClock className="h-4 w-4" />}>
                  Economic Calendar
                </TabButton>
                <TabButton active={tab === "Central Banks"} onClick={() => setTab("Central Banks")} icon={<Landmark className="h-4 w-4" />}>
                  Central Banks
                </TabButton>
              </div>
            </div>

            {/* RIGHT: Utilities */}
            <div className="flex items-start lg:items-center gap-2 justify-start lg:justify-end">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search: events, symbols, themes…"
                  className="w-[260px] rounded-xl bg-white/5 ring-1 ring-white/10 pl-9 pr-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <IconButton
                icon={loadingPulse ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                label="Refresh"
                onClick={onRefresh}
              />

              <IconButton
                icon={isLive ? <Zap className="h-4 w-4 text-emerald-200" /> : <CircleDashed className="h-4 w-4" />}
                label={isLive ? "Live" : "Paused"}
                onClick={() => setIsLive((v) => !v)}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Main body */}
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6">
        {/* Hero KPIs */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-5 sm:p-6 overflow-hidden relative">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
              </div>

              <div className="relative">
                <SectionTitle
                  icon={<Wand2 className="h-5 w-5 text-emerald-200" />}
                  title="Market Expectation Snapshot"
                  subtitle="Institutional-grade consolidation → one screen, one narrative, one reaction plan."
                  right={
                    <div className="flex items-center gap-2">
                      <Pill className="text-white/80" icon={<Clock className="h-3.5 w-3.5" />}>
                        Updated {fmtTime(liveNow)}
                      </Pill>
                      <Pill className="text-emerald-200" icon={<Activity className="h-3.5 w-3.5" />}>
                        Regime: {safeMacro.regime}
                      </Pill>
                    </div>
                  }
                />

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    label="High-Impact Events (24h)"
                    value={String(highImpactNext24h)}
                    hint="Scheduled economic risk"
                    icon={<TriangleAlert className="h-5 w-5" />}
                    tone={highImpactNext24h > 0 ? "warn" : "good"}
                  />

                  <Stat
                    label="Central Bank Risk (48h)"
                    value={cbNext48h === 0 ? "None" : `${cbNext48h} speaker`}
                    hint="Policy communication risk"
                    icon={<Landmark className="h-5 w-5" />}
                    tone={cbNext48h > 0 ? "warn" : "good"}
                  />

                  <Stat
                    label="Volatility State"
                    value={volatilityState}
                    hint="Based on anomaly activity"
                    icon={<Activity className="h-5 w-5" />}
                    tone={
                      volatilityState === "High"
                        ? "warn"
                        : volatilityState === "Low"
                        ? "good"
                        : "neutral"
                    }
                  />

                  <Stat
                    label="Trend Alignment"
                    value={`${trendAlignment.aligned}/${trendAlignment.total}`}
                    hint="Key markets aligned"
                    icon={<TrendingUp className="h-5 w-5" />}
                    tone={trendAlignment.aligned >= 3 ? "good" : "neutral"}
                  />

                </div>

                <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="text-sm text-white/90 font-semibold">{safeMacro.headline}</p>
                  <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 space-y-1">
                    <p className="text-sm font-semibold text-white">Market State</p>
                    <p className="text-sm text-text-muted">
                      • Events today: {highImpactNext24h}
                    </p>
                    <p className="text-sm text-text-muted">
                      • Central banks next 48h: {cbNext48h}
                    </p>
                    <p className="text-sm text-text-muted">
                      • Volatility: {volatilityState}
                    </p>
                    <p className="text-sm text-text-muted">
                      • Trend alignment: {trendAlignment.aligned}/{trendAlignment.total}
                    </p>
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <ProgressBar
                    label="Event Density"
                    value={Math.min(100, highImpactNext24h * 25)}
                    left="Quiet"
                    right="Crowded"
                    tone={highImpactNext24h > 1 ? "warn" : "neutral"}
                  />

                  <ProgressBar
                    label="Market Instability"
                    value={Math.min(100, anomalies.length * 20)}
                    left="Stable"
                    right="Unstable"
                    tone={volatilityState === "High" ? "warn" : "neutral"}
                  />

                </div>
              <Divider className="my-5" />
                <div className="flex items-start gap-4">
                {/* LEFT: title + description */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    Market Risk Mode
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {risk.desc}
                  </p>
                </div>

                {/* RIGHT: risk pill */}
                <button
                  type="button"
                  className={clsx(
                    "shrink-0 ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                    "text-xs font-semibold ring-1 transition-all",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    riskModePill(risk.mode)
                  )}
                  title="Overall posture for sizing and execution today"
                >
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      riskModeDot(risk.mode)
                    )}
                  />
                  {risk.mode}
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Right column quick panels */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-3">
              <MiniPanel
                title="What’s moving markets"
                subtitle="Real-time sentiment feed"
                icon={<Newspaper className="h-5 w-5 text-emerald-200" />}
                right={
                  <Pill
                    icon={<Zap className="h-3.5 w-3.5" />}
                    className={clsx(isLive ? "text-emerald-200" : "text-white/70")}
                  >
                    {isLive ? "Streaming" : "Paused"}
                  </Pill>
                }
              >
                <div className={clsx("space-y-2", prefs.compactMode ? "" : "mt-1")}>
                  {filteredEvents.slice(0, 5).map((e) => (
                    <EventRowCompact key={e.id} e={e} onOpen={() => openEvent(e)} compact={prefs.compactMode} />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <GhostButton
                    icon={<AlignLeft className="h-4 w-4" />}
                    onClick={() => {
                      setTab("Sentiment")

                      requestAnimationFrame(() => {
                        document
                          .getElementById("sentiment-feed")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      })
                    }}
                  >
                    View feed
                  </GhostButton>

                  <GhostButton
                    icon={<Bot className="h-4 w-4" />}
                    className="opacity-50 pointer-events-none cursor-not-allowed"
                  >
                    Summarise
                  </GhostButton>


                </div>
              </MiniPanel>

              <MiniPanel
                title="Upcoming high-impact"
                subtitle="Economic + central bank risk"
                icon={<CalendarClock className="h-5 w-5 text-emerald-200" />}
                right={<Pill icon={<AlarmClock className="h-3.5 w-3.5" />}>{uiCalendar.length} events</Pill>}
              >
                <div className="space-y-2">
                  {filteredCalendar.slice(0, 4).map((c) => (
                    <CalendarRowCompact key={c.id} c={c} />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <GhostButton icon={<CalendarClock className="h-4 w-4" />} onClick={() => setTab("Calendar")}>
                    Open calendar
                  </GhostButton>
                  <GhostButton icon={<Landmark className="h-4 w-4" />} onClick={() => setTab("Central Banks")}>
                    Central banks
                  </GhostButton>
                </div>
              </MiniPanel>

              
            </div>
          </div>
        </div>

        {/* Tab bodies */}
        <div className="mt-6" id="sentiment-feed">
          {tab === "Overview" && (
            <div ref={overviewRef} className="scroll-anchor">
              <OverviewTab
                      snap={snap}
                      prefs={prefs}
                      setPrefs={setPrefs}
                      macro={snap?.macro ?? safeMacro}
                      events={filteredEvents}
                      calendar={filteredCalendar}
                      watchlist={watchlist}
                      toggleWatch={toggleWatch}
                      openEvent={openEvent}
                    />
            </div>
          )}

          {tab === "Sentiment" && (
            <div ref={sentimentRef} className="scroll-anchor">
              <SentimentTab
                      prefs={prefs}
                      setPrefs={setPrefs}
                      events={filteredEvents}
                      openEvent={openEvent}
                    />
            </div>
          )}

          {tab === "Calendar" && (
            <div ref={calendarRef} className="scroll-anchor">
              <CalendarTab
                    calendar={filteredCalendar}
                    prefs={prefs}
                    openCachedAIInsight={openCachedAIInsight}
                  />
            </div>
          )}

          {tab === "Central Banks" && (
            <div ref={centralBanksRef} className="scroll-anchor">
              <CentralBanksTab
                      comms={filteredCB}
                      prefs={prefs}
                      onOpen={openCentralBankModal}
                    />
            </div>
          )}

        </div>
      </div>

      
      {/* Event modal */}
      <MinimalModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.title ?? "Event"}
        subtitle={detail ? `${detail.source} • ${detail.impact} • ${fmtTime(detail.ts)}` : undefined}
        widthClass="max-w-5xl"
      >
        {detail ? (
          <EventDetail
            e={detail}
            onToggleWatch={toggleWatch}
            watchlist={watchlist}
          />


        ) : null}
      </MinimalModal>

      <MinimalModal
        open={cbModalOpen}
        onClose={() => setCbModalOpen(false)}
        widthClass="max-w-4xl"
      >
        {cbDetail && <CentralBankEventAI comm={cbDetail} />}
      </MinimalModal>

    </div>
  )
}

function CentralBankEventAI({ comm }: { comm: CBComm }) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<any>(null)

  async function runAI() {
    setLoading(true)

    const res = await fetch("/api/fundamentals/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "central_bank",
        sourceId: comm.id,
        payload: {
          title: comm.title,
          bank: comm.bank,
          speaker: comm.speaker,
          ts: comm.ts,
          hawkDove: comm.hawkDove,
          summary: comm.summary,
          keyQuotes: comm.keyQuotes,
          watchlistImpacts: comm.watchlistImpacts,
          isHoliday: false,
          hasPolicyDecision: false,
        },
      }),
    })

    const json = await res.json()
    setInsight(json.insight)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* SAME RISK HEADER */}
      <RiskHeader
        level={
          comm.hawkDove >= 35
            ? "High"
            : comm.hawkDove <= -35
            ? "Medium"
            : "Low"
        }
        subtitle={`${comm.bank} • ${comm.speaker}`}
      />

      {/* AI — IDENTICAL TO CALENDAR */}
      <div className="rounded-3xl bg-black/25 ring-1 ring-white/10 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Edge AI Insight</p>

          <PrimaryButton
            icon={<Bot className={clsx("h-4 w-4", loading && "animate-spin")} />}
            onClick={runAI}
          >
            {insight ? "Refresh Insight" : "Ask Edge AI"}
          </PrimaryButton>
        </div>

        <div className="mt-4 space-y-4 text-sm text-white/90">
          {loading && <p className="text-white/60">Generating insight…</p>}

          {insight && (
            <>
              <Section title="Summary" text={insight.simpleSummary} />

              <Section
                title="Why it matters"
                bullets={insight.whyItMatters?.bullets}
              />

              <Section
                title="How to trade it"
                bullets={insight.howToTrade}
              />

              {/* TEXT MARKET REACTION */}
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
                <p className="text-sm font-semibold text-white">
                  Typical market reaction
                </p>

                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  {buildMarketReactionText(insight.marketImpact)}
                </p>

                <ul className="mt-3 space-y-2">
                  {buildMarketReactionBullets(insight.marketImpact).map(
                    (b: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-white/75"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Tabs + Views                                 */
/* -------------------------------------------------------------------------- */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs transition ring-1",
        active
          ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/25"
          : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
      )}
    >
      <span className={clsx(active ? "text-emerald-200" : "text-white/70")}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
    </button>
  )
}

function FilterChip({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  icon: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as any)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/10 transition"
      >
        <span className="text-white/70">{icon}</span>
        <span className="text-white/80">{label}:</span>
        <span className="font-semibold">{value}</span>
        <ChevronDown className="h-4 w-4 text-white/60" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#070A0F] ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden z-50"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
          >
            <div className="p-2">
              {options.map((opt) => {
                const active = opt === value
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt)
                      setOpen(false)
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition",
                      active ? "bg-emerald-500/10 text-emerald-200" : "text-white/80 hover:bg-white/5"
                    )}
                  >
                    <span className="font-semibold">{opt}</span>
                    {active ? <Check className="h-4 w-4" /> : null}
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function MiniPanel({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string
  subtitle?: string
  icon: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-5 overflow-hidden">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} right={right} />
      <div className="mt-4">{children}</div>
    </div>
  )
}



function EventRowCompact({ e, onOpen, compact }: { e: MarketEvent; onOpen: () => void; compact: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        "w-full rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition text-left",
        compact ? "p-3" : "p-3.5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", sourceBadge(e.source))}>{e.source}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", impactBadge(e.impact))}>{e.impact}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", sentimentBadge(e.sentiment))}>
              {e.sentiment}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white/90 line-clamp-2">{e.title}</p>
          <p className="mt-1 text-xs text-text-muted line-clamp-2">{e.summary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-white/60">{fmtTime(e.ts)}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            {e.assets.slice(0, 2).map((a) => (
              <span key={a} className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/75">
                {a}
              </span>
            ))}
            {e.assets.length > 2 ? (
              <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/60">
                +{e.assets.length - 2}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function CalendarRowCompact({ c }: { c: UICalendarEvent }) {
  const badge =
    c.type === "CB" ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : c.type === "Speech" ? "ring-sky-500/30 bg-sky-500/10 text-sky-200"
    : c.type === "Auction" ? "ring-violet-500/30 bg-violet-500/10 text-violet-200"
    : c.type === "Holiday" ? "ring-amber-500/30 bg-amber-500/10 text-amber-200"
    : "ring-white/10 bg-white/5 text-white/70"

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", badge)}>{c.type}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", impactBadge(c.impact))}>{c.impact}</span>
            <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
              {c.region}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white/90 line-clamp-1">{c.title}</p>
          <p className="mt-1 text-xs text-text-muted line-clamp-1">{c.notes}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-white/60">{fmtTime(c.ts)}</p>
          {c.expected ? (
            <p className="mt-2 text-[11px] text-white/70">
              Exp: <span className="font-semibold text-white/85">{c.expected}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}



function severityPill(sev: number) {
  if (sev >= 80) return "ring-red-500/30 bg-red-500/10 text-red-200"
  if (sev >= 70) return "ring-orange-500/30 bg-orange-500/10 text-orange-200"
  if (sev >= 60) return "ring-sky-500/30 bg-sky-500/10 text-sky-200"
  return "ring-white/10 bg-white/5 text-white/70"
}

/* -------------------------------------------------------------------------- */
/*                                   Overview                                  */
/* -------------------------------------------------------------------------- */

function OverviewTab({
  snap,
  prefs,
  setPrefs,
  macro,
  events,
  calendar,
  watchlist,
  toggleWatch,
  openEvent,
}: {
  snap: any
  prefs: UserPrefs
  setPrefs: React.Dispatch<React.SetStateAction<UserPrefs>>
  macro: MacroSnapshot
  events: MarketEvent[]
  calendar: UICalendarEvent[]
  watchlist: string[]
  toggleWatch: (sym: string) => void
  openEvent: (e: MarketEvent) => void
}) {


  const topEvents = events.slice(0, 8)


  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-4">
        <Panel>
        <SectionTitle
          icon={<Gauge className="h-5 w-5 text-emerald-200" />}
          title="Market State Engine"
          subtitle="Simple rule-based signals from live prices + anomalies + calendar."
          right={
            <Pill
              icon={prefs.showExplain ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
              className={prefs.showExplain ? "text-emerald-200" : "text-white/70"}
              onClick={() => setPrefs((p) => ({ ...p, showExplain: !p.showExplain }))}
              title="Toggle explain text"
            >
              Explain
            </Pill>
          }
        />

        {/* ✅ 4 simple signals */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SignalCard
            title="Risk Appetite"
            value={`${macro.regime}`}
            score={macro.regime === "Risk-On" ? 70 : macro.regime === "Risk-Off" ? 35 : 55}
            hint={prefs.showExplain ? "Combines equity/BTC momentum + volatility regime." : undefined}
            icon={<Flame className="h-5 w-5" />}
          />

          <SignalCard
            title="Volatility Regime"
            value={(snap as any)?.marketState?.volatility?.regime ?? "Low"}
            score={(snap as any)?.marketState?.volatility?.score ?? 15}
            hint={prefs.showExplain ? "From anomaly severity (volatility + liquidity signals)." : undefined}
            icon={<Activity className="h-5 w-5" />}
          />

          <SignalCard
            title="Rates Pressure"
            value={
              ((snap as any)?.marketState?.ratesPressure ?? 35) >= 65 ? "High" :
              ((snap as any)?.marketState?.ratesPressure ?? 35) >= 45 ? "Normal" : "Low"
            }
            score={(snap as any)?.marketState?.ratesPressure ?? 35}
            hint={prefs.showExplain ? "Proxy from equity/gold moves + vol + oil impulse." : undefined}
            icon={<Percent className="h-5 w-5" />}
          />

          <SignalCard
            title="Positioning Stress"
            value={
              ((snap as any)?.marketState?.positioningStress ?? 25) >= 70 ? "Stretched" :
              ((snap as any)?.marketState?.positioningStress ?? 25) >= 45 ? "Normal" : "Relaxed"
            }
            score={(snap as any)?.marketState?.positioningStress ?? 25}
            hint={prefs.showExplain ? "How stretched markets look (move size + volatility)." : undefined}
            icon={<Target className="h-5 w-5" />}
          />
        </div>

        {/* ✅ mini bullets */}
        <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <p className="text-sm text-white/90 font-semibold">
            {(snap as any)?.marketState?.headline ?? "Loading market state…"}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-text-muted">
            {(((snap as any)?.marketState?.bullets ?? []) as string[]).slice(0, 3).map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>


        <Panel>
          <SectionTitle
            icon={<Sparkles className="h-5 w-5 text-emerald-200" />}
            title="Market-moving Events"
            subtitle="Real-time sentiment analysis detects catalysts early — click any event for reaction plan."
            right={<Pill icon={<Newspaper className="h-3.5 w-3.5" />}>{topEvents.length} shown</Pill>}
          />

          <div className="mt-4 grid grid-cols-1 gap-3">
            {topEvents.map((e) => (
              <EventRow key={e.id} e={e} onOpen={() => openEvent(e)} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-4 space-y-4">



        <Panel>
          <SectionTitle
            icon={<CalendarClock className="h-5 w-5 text-emerald-200" />}
            title="Economic risk (next)"
            subtitle="Automated monitoring of global economic events."
            right={<Pill icon={<AlarmClock className="h-3.5 w-3.5" />}>{calendar.length}</Pill>}
          />
          <div className="mt-4 space-y-3">
            {calendar.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", impactBadge(c.impact))}>
                        {c.impact}
                      </span>
                      <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        {c.region}
                      </span>
                      <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        {c.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white/90 line-clamp-1">{c.title}</p>
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">{c.notes}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-white/60">{fmtTime(c.ts)}</p>
                    {c.expected ? <p className="mt-2 text-[11px] text-white/70">Exp: {c.expected}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-5 sm:p-6 overflow-hidden">{children}</div>
}

function ExpectationCard({
  title,
  icon,
  points,
  hint,
}: {
  title: string
  icon: React.ReactNode
  points: [string, string][]
  hint?: string
}) {
  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 text-white/85">{icon}</div>
      </div>
      <div className="mt-4 space-y-2">
        {points.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 ring-1 ring-white/10 px-3 py-2">
            <p className="text-xs text-white/75">{k}</p>
            <p className="text-xs font-semibold text-white/90">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventRow({ e, onOpen }: { e: MarketEvent; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 hover:bg-white/10 transition text-left"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", sourceBadge(e.source))}>{e.source}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", impactBadge(e.impact))}>{e.impact}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", sentimentBadge(e.sentiment))}>
              {e.sentiment}
            </span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", confPill(e.confidence))}>
              {Math.round(e.confidence * 100)}% conf
            </span>
          </div>

          <p className="mt-2 text-base font-semibold text-white/90 leading-snug">{e.title}</p>
          <p className="mt-1 text-sm text-text-muted leading-relaxed line-clamp-2">{e.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {e.assets.map((a) => (
              <span key={a} className="rounded-full bg-black/30 ring-1 ring-white/10 px-2.5 py-1 text-xs text-white/80">
                {a}
              </span>
            ))}
            {e.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-white/5 ring-1 ring-white/10 px-2.5 py-1 text-xs text-white/60">
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
          <p className="text-xs text-white/60">{fmtTime(e.ts)}</p>
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 px-3 py-2 text-xs text-emerald-200">
            <ArrowRight className="h-4 w-4" />
            Reaction plan
          </span>
        </div>
      </div>
    </button>
  )
}

function CrossRowMini({
  row,
  watchlist,
  toggleWatch,
}: {
  row: CrossMarketRow
  watchlist: string[]
  toggleWatch: (sym: string) => void
}) {
  const up = row.bias === "Long"
  const down = row.bias === "Short"
  const biasPill = up
    ? "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : down
    ? "ring-red-500/30 bg-red-500/10 text-red-200"
    : "ring-white/10 bg-white/5 text-white/70"

  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{row.symbol}</span>
            <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", biasPill)}>{row.bias}</span>
            <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
              {row.assetClass}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-muted line-clamp-2">{row.playbook}</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleWatch(row.symbol)}
            className={clsx(
              "rounded-xl p-2 ring-1 transition",
              watchlist.includes(row.symbol)
                ? "bg-amber-500/10 ring-amber-500/25 text-amber-200"
                : "bg-black/30 ring-white/10 text-white/70 hover:bg-white/5"
            )}
            title={watchlist.includes(row.symbol) ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Star className={clsx("h-4 w-4", watchlist.includes(row.symbol) ? "fill-current" : "")} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className={clsx("rounded-full px-2 py-0.5 text-[11px] ring-1", confPill(row.confidence))}>
            {Math.round(row.confidence * 100)}% conf
          </span>
          <span className="text-white/50">•</span>
          <span className="truncate">{row.catalysts[0]}</span>
        </div>
        <div className="text-white/70">
          <Sparkline data={row.spark} />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Sentiment                                   */
/* -------------------------------------------------------------------------- */
function impactWeight(impact: string) {
  // weights tuned to "feel" right (0..100 output after scaling)
  if (impact === "Extreme") return 38
  if (impact === "High") return 26
  if (impact === "Medium") return 14
  return 6 // Low
}

function riskLabel(score: number) {
  if (score >= 75) return "Extreme"
  if (score >= 55) return "Elevated"
  if (score >= 35) return "Moderate"
  return "Low"
}

function riskTone(score: number): Tone {
  if (score >= 75) return "bad"
  if (score >= 55) return "warn"
  if (score >= 35) return "info"
  return "good"
}

/**
 * Single gauge that answers: "How dangerous is the tape right now?"
 * Uses last 24h events + time decay (more recent = heavier).
 */
function EventRiskGauge({ events }: { events: MarketEvent[] }) {
  const now = Date.now()

  const computed = useMemo(() => {
    const windowMs = 24 * 60 * 60 * 1000
    const cutoff = now - windowMs

    const recent = events.filter((e) => e.ts >= cutoff)

    // time decay: 1.0 now -> ~0.2 at 24h
    const decay = (ts: number) => {
      const age = now - ts
      const t = clamp(age / windowMs, 0, 1)
      return 1 - 0.8 * t
    }

    let raw = 0
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Extreme: 0 }

    for (const e of recent) {
      counts[e.impact] = (counts[e.impact] ?? 0) + 1
      raw += impactWeight(e.impact) * decay(e.ts) * clamp(e.confidence ?? 0.65, 0.4, 0.95)
    }

    // scale raw into 0..100 (cap for sanity)
    const score = clamp(Math.round(raw / 4.2), 0, 100)

    return {
      score,
      label: riskLabel(score),
      tone: riskTone(score),
      counts,
      total: recent.length,
    }
  }, [events, now])

  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Event Risk Gauge</p>
          <p className="mt-1 text-xs text-text-muted">
            Last 24h • weighted by impact, confidence, and recency
          </p>
        </div>

        <span
          className={clsx(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1",
            computed.tone === "bad"
              ? "ring-red-500/30 bg-red-500/10 text-red-200"
              : computed.tone === "warn"
              ? "ring-orange-500/30 bg-orange-500/10 text-orange-200"
              : computed.tone === "info"
              ? "ring-sky-500/30 bg-sky-500/10 text-sky-200"
              : "ring-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          )}
        >
          {computed.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-semibold tracking-tight text-white">{computed.score}</p>
          <p className="mt-1 text-xs text-text-muted">Risk score (0–100)</p>
        </div>
        <div className="text-right text-[11px] text-white/60">
          <div>{computed.total} events</div>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar
          label="Risk load"
          value={computed.score}
          left="Quiet"
          right="Danger"
          tone={computed.tone}
        />
      </div>

      {/* tiny breakdown so it doesn't feel “made up” */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["Extreme", "High", "Medium", "Low"] as const).map((k) => (
          <div key={k} className="rounded-2xl bg-black/25 ring-1 ring-white/10 px-3 py-2">
            <p className="text-[11px] text-text-muted">{k}</p>
            <p className="mt-1 text-sm font-semibold text-white/90">{computed.counts[k] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentimentTab({
  prefs,
  setPrefs,
  events,
  openEvent,
}: {
  prefs: UserPrefs
  setPrefs: React.Dispatch<React.SetStateAction<UserPrefs>>
  events: MarketEvent[]
  openEvent: (e: MarketEvent) => void
}) {
  const impactCounts = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Extreme: 0 }
    events.forEach((e) => (counts[e.impact] = (counts[e.impact] ?? 0) + 1))
    return counts
  }, [events])

  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => (counts[e.sentiment] = (counts[e.sentiment] ?? 0) + 1))
    return counts
  }, [events])

  const total = events.length || 1

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-4">
        <Panel>
          <SectionTitle
            icon={<Flame className="h-5 w-5 text-emerald-200" />}
            title="Sentiment Dashboard"
            subtitle="Detect market-moving events early — fast, simple, actionable."
            right={
              <Pill icon={<List className="h-3.5 w-3.5" />}>
                {events.length} events
              </Pill>
            }
          />

          <div className="mt-4">
            <EventRiskGauge events={events} />
          </div>

        </Panel>

      </div>

      <div className="lg:col-span-8">
        <Panel>
          <SectionTitle
            icon={<Newspaper className="h-5 w-5 text-emerald-200" />}
            title="Event Stream"
            subtitle="Click any event → reaction plan, expected pricing, and why it matters."
            right={
              <div className="flex items-center gap-2">
                <Pill icon={<History className="h-3.5 w-3.5" />}>Last 24h</Pill>
                <Pill icon={<Activity className="h-3.5 w-3.5" />}>Live</Pill>
              </div>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3">
            {events.map((e) => (
              <EventRow key={e.id} e={e} onOpen={() => openEvent(e)} />
            ))}
            {!events.length ? (
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
                <p className="text-sm font-semibold text-white">No events found</p>
                <p className="mt-2 text-sm text-text-muted">Try changing filters or adding focus symbols.</p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
  icon,
}: {
  label: string
  desc?: string
  value: boolean
  onChange: () => void
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-2 text-white/80">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          {desc ? <p className="mt-1 text-xs text-text-muted">{desc}</p> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={clsx(
          "shrink-0 inline-flex h-10 w-16 items-center rounded-full ring-1 transition p-1",
          value
            ? "bg-emerald-500/20 ring-emerald-500/25"
            : "bg-black/30 ring-white/10"
        )}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={clsx(
            "h-8 w-8 rounded-full bg-white/90 transition-transform",
            value ? "translate-x-6" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
}
/* -------------------------------------------------------------------------- */
/*                                  Calendar                                   */
/* -------------------------------------------------------------------------- */
function startOfWeekUTC(ts: number) {
  const d = new Date(ts)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = d.getUTCDate() - day
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
  return start.getTime()
}


function CalendarTab({
  calendar,
  prefs,
  openCachedAIInsight,
}: {
  calendar: UICalendarEvent[]
  prefs: UserPrefs
  openCachedAIInsight: (
    kind: "event" | "calendar" | "central_bank",
    sourceId: string,
    payload: any
  ) => Promise<void> | void
}) {

const [selectedEvent, setSelectedEvent] = useState<UICalendarEvent | null>(null)

const now = Date.now()

const thisWeekStart = startOfWeekUTC(now)
const nextWeekStart = thisWeekStart + 7 * 24 * 60 * 60 * 1000
const nextWeekEnd = nextWeekStart + 7 * 24 * 60 * 60 * 1000

const thisWeek = calendar.filter(
  (c) => c.ts >= thisWeekStart && c.ts < nextWeekStart
)

const nextWeek = calendar.filter(
  (c) => c.ts >= nextWeekStart && c.ts < nextWeekEnd
)

function groupByDay(items: UICalendarEvent[]) {
  const map: Record<string, UICalendarEvent[]> = {}

  items.forEach((c) => {
    const day = fmtDate(c.ts)
    if (!map[day]) map[day] = []
    map[day].push(c)
  })

  return Object.entries(map)
    .map(([day, items]) => ({
      day,
      items: items.sort((a, b) => a.ts - b.ts),
    }))
}
const thisWeekDays = groupByDay(thisWeek)
const nextWeekDays = groupByDay(nextWeek)
console.log({
  now: new Date(now).toUTCString(),
  thisWeekStart: new Date(thisWeekStart).toUTCString(),
  nextWeekStart: new Date(nextWeekStart).toUTCString(),
  sampleEvent: calendar[0] && new Date(calendar[0].ts).toUTCString(),
})


  return (
    <div className="space-y-4">
      {thisWeekDays.length || nextWeekDays.length ? (
        <div className="space-y-6">
          {/* THIS WEEK */}
          {thisWeekDays.length > 0 && (
            <Panel>
              <SectionTitle
                icon={<CalendarClock className="h-5 w-5 text-emerald-200" />}
                title="This week"
                subtitle="High-impact events traders are watching now"
                right={<Pill>{thisWeek.length} events</Pill>}
              />
              <div className="mt-4 space-y-4">
                {thisWeekDays.map((d) => (
                  <div key={d.day}>
                    <p className="mb-2 text-xs font-semibold text-white/60 uppercase">
                      {d.day}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {d.items.map((c) => (
                        <CalendarRowFull
                          key={c.id}
                          c={c}
                          onOpen={() => setSelectedEvent(c)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </Panel>
            )}
              {/* NEXT WEEK */}
              {nextWeekDays.length > 0 && (
                <Panel>
                  <SectionTitle
                    icon={<CalendarClock className="h-5 w-5 text-sky-200" />}
                    title="Next week"
                    subtitle="Forward-looking risk to plan around"
                    right={<Pill>{nextWeek.length} events</Pill>}
                  />

                  <div className="mt-4 space-y-4 opacity-80">
                    {nextWeekDays.map((d) => (
                      <div key={d.day}>
                        <p className="mb-2 text-xs font-semibold text-white/50 uppercase">
                          {d.day}
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3">
                          {d.items.map((c) => (
                            <CalendarRowFull
                              key={c.id}
                              c={c}
                              onOpen={() => setSelectedEvent(c)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
            ) : (
              <Panel>
                <EmptyState
                  icon={<CalendarClock className="h-6 w-6" />}
                  title="No upcoming events"
                  subtitle="Nothing scheduled in the selected time range."
                />
              </Panel>
              )}
              {selectedEvent && (
                <MinimalModal
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                
                
              >
                <CalendarEventAI
                  event={selectedEvent}
                  openCachedAIInsight={openCachedAIInsight}
                />
              </MinimalModal>
              )}
            </div>
          )
        }

function buildMarketReactionText(impact: any): string {
  const parts: string[] = []

  if (impact.fx && impact.fx !== "Neutral") {
    parts.push(`FX markets may react ${impact.fx.toLowerCase()}ly.`)
  } else {
    parts.push("FX markets typically show muted or mixed reactions.")
  }

  if (impact.rates && impact.rates !== "Neutral") {
    parts.push(`Rates may move ${impact.rates.toLowerCase()} as expectations adjust.`)
  } else {
    parts.push("Rates usually remain stable unless expectations change.")
  }

  if (impact.equities && impact.equities !== "Neutral") {
    parts.push(`Equities can respond ${impact.equities.toLowerCase()} depending on risk appetite.`)
  } else {
    parts.push("Equities tend to absorb the event with limited follow-through.")
  }

  return parts.join(" ")
}

function buildMarketReactionBullets(impact: any): string[] {
  const bullets: string[] = []

  if (impact.fx !== "Neutral") {
    bullets.push("Currency pairs linked to the release may see short-lived volatility.")
  }

  if (impact.rates !== "Neutral") {
    bullets.push("Bond yields can adjust as traders reprice expectations.")
  }

  if (impact.equities !== "Neutral") {
    bullets.push("Equity indices may react if the event shifts risk sentiment.")
  }

  if (bullets.length === 0) {
    bullets.push("Markets usually digest this event without sustained directional moves.")
  }

  return bullets
}


function CalendarEventAI({
  event,
  openCachedAIInsight,
}: {
  event: UICalendarEvent
  openCachedAIInsight: (
    kind: "event" | "calendar" | "central_bank",
    sourceId: string,
    payload: any
  ) => Promise<void> | void
}) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<AIEventInsight | null>(null)


  async function runAI() {
    setLoading(true)

    const res = await fetch("/api/fundamentals/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "calendar",
        sourceId: event.id,
        payload: {
          title: event.title,
          region: event.region,
          impact: event.impact,
          ts: event.ts,
          type: event.type,
          notes: event.notes,
          assets: event.watch ?? [],
          isHoliday: false,
          hasPolicyDecision: false,
        },
      }),
    })

    const json = await res.json()
    setInsight(json.insight)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <RiskHeader
        level={event.impact}
        subtitle={`${event.region} ${event.type ? `• ${event.type}` : ""}`.trim()}
      />

      {event.notes ? (
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
          <p className="text-sm text-white/80 leading-relaxed">{event.notes}</p>
        </div>
      ) : null}

      {/* AI */}
      <div className="rounded-3xl bg-black/25 ring-1 ring-white/10 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Edge AI Insight</p>

          <PrimaryButton
            icon={<Bot className={clsx("h-4 w-4", loading && "animate-spin")} />}
            onClick={runAI}
          >
            {insight ? "Refresh Insight" : "Ask Edge AI"}
          </PrimaryButton>
        </div>

        <div className="mt-4 space-y-4 text-sm text-white/90">
          {loading && <p className="text-white/60">Generating insight…</p>}

          {insight && (
            <>
              <Section title="Summary" text={insight.simpleSummary} />

              <Section
                title="Why it matters"
                bullets={insight.whyItMatters?.bullets}
              />

              <Section
                title="How to trade it"
                bullets={insight.howToTrade}
              />

              {/* TYPICAL MARKET REACTION (TEXT) */}
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
                <p className="text-sm font-semibold text-white">
                  Typical market reaction
                </p>

                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  {buildMarketReactionText(insight.marketImpact)}
                </p>

                <ul className="mt-3 space-y-2">
                  {buildMarketReactionBullets(insight.marketImpact).map(
                    (b: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-white/75"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
function Section({
  title,
  text,
  bullets,
}: {
  title: string
  text?: string
  bullets?: string[]
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>

      {text && (
        <p className="mt-2 text-sm text-white/80 leading-relaxed">
          {text}
        </p>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-white/80"
            >
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
function MarketImpactGrid({
  data,
}: {
  data?: {
    equities?: string
    fx?: string
    rates?: string
    metals?: string
    crypto?: string
  }
}) {
  if (!data) return null

  return (
    <div>
      <p className="text-sm font-semibold text-white">Typical market reaction</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(data).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2"
          >
            <span className="uppercase text-white/60">{k}</span>
            <span className="font-semibold text-white">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


function CalendarRowFull({
  c,
  onOpen,
}: {
  c: UICalendarEvent
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 hover:bg-white/10 transition"
    >
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Impact */}
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] ring-1",
            impactBadge(c.impact)
          )}
        >
          {c.impact}
        </span>

        {/* Region */}
        <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
          {c.region}
        </span>

        {/* Type */}
        <span className="rounded-full bg-black/30 ring-1 ring-white/10 px-2 py-0.5 text-[11px] text-white/70">
          {c.type}
        </span>

        {/* Time */}
        <span className="text-[11px] text-emerald-300/80 font-mono">
          {fmtTime(c.ts)}
        </span>
      </div>

      {/* Title */}
      <p className="mt-3 text-base font-semibold text-white/90">
        {c.title}
      </p>

      {/* Notes / summary */}
      {c.notes ? (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {c.notes}
        </p>
      ) : (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          Scheduled economic release.
        </p>
      )}

      {/* Affected markets */}
      {c.watch?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.watch.map((w) => (
            <span
              key={w}
              className="rounded-full bg-black/30 ring-1 ring-white/10 px-2.5 py-1 text-xs text-white/75"
            >
              {w}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 text-xs font-semibold text-emerald-200">
        View analysis →
      </div>
    </div>
  )
}



/* -------------------------------------------------------------------------- */
/*                               Central Banks                                 */
/* -------------------------------------------------------------------------- */
function CentralBanksTab({
  comms,
  prefs,
  onOpen,
}: {
  comms: CBComm[]
  prefs: UserPrefs
  onOpen: (comm: CBComm) => void
}) {
  return (
    <div className="space-y-4">
      {comms.length ? (
        <Panel>
          <SectionTitle
            icon={<MessageSquareText className="h-5 w-5 text-emerald-200" />}
            title="Latest communications"
            subtitle="Central bank signals and policy tone."
            right={
              <Pill icon={<History className="h-3.5 w-3.5" />}>
                Recent
              </Pill>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3">
            {comms.map((x) => {
              const tone =
                x.hawkDove >= 35
                  ? {
                      label: "Hawkish",
                      cls: "bg-orange-500/10 text-orange-200 ring-orange-500/30",
                    }
                  : x.hawkDove <= -35
                  ? {
                      label: "Dovish",
                      cls: "bg-sky-500/10 text-sky-200 ring-sky-500/30",
                    }
                  : {
                      label: "Neutral",
                      cls: "bg-white/5 text-white/70 ring-white/10",
                    }

              return (
                <div
                  key={x.id}
                  onClick={() => onOpen(x)}
                  className={clsx(
                    "group cursor-pointer rounded-3xl p-5",
                    "bg-white/5 ring-1 ring-white/10",
                    "hover:bg-white/10 hover:ring-emerald-500/30",
                    "transition-all duration-200"
                  )}
                >
                  {/* RISK / CONTEXT HEADER */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          tone.cls
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {tone.label}
                      </span>

                      <span className="text-xs text-white/60">
                        {x.bank}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-white/40">
                      {fmtTime(x.ts)}
                    </span>
                  </div>

                  {/* TITLE */}
                  <p className="mt-3 text-base font-semibold text-white/90">
                    {x.title}
                  </p>

                  {/* SUMMARY */}
                  <p className="mt-1 text-sm text-white/70 leading-relaxed line-clamp-2">
                    {x.summary}
                  </p>

                  {/* MARKETS (SOFT, SECONDARY) */}
                  {x.watchlistImpacts?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {x.watchlistImpacts.map((w) => (
                        <span
                          key={w}
                          className="rounded-full bg-black/30 ring-1 ring-white/10 px-2.5 py-1 text-xs text-white/65"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* CTA */}
                  <div className="mt-4 text-xs font-semibold text-emerald-200 opacity-80 group-hover:opacity-100 transition">
                    View AI analysis →
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            icon={<Landmark className="h-6 w-6" />}
            title="No communications"
            subtitle="Nothing published in the selected time range."
          />
        </Panel>
      )}
    </div>
  )
}





/* -------------------------------------------------------------------------- */
/*                             Event Detail Modal                              */
/* -------------------------------------------------------------------------- */

function EventDetail({
  e,
  onToggleWatch,
  watchlist,
}: {
  e: MarketEvent
  onToggleWatch: (sym: string) => void
  watchlist: string[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function askAI() {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/fundamentals/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "event",
          sourceId: e.id,
          payload: {
            title: e.title,
            source: e.source,
            impact: e.impact,
            ts: e.ts,
            summary: e.summary,
            assets: e.assets,
            tags: e.tags,
          },
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to generate insight")

      setInsight(json.insight)
    } catch (err: any) {
      setError(err.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const confidencePct =
    insight?.confidence != null
      ? Math.round(
          insight.confidence <= 1
            ? insight.confidence * 100
            : insight.confidence
        )
      : null

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-black/25 ring-1 ring-white/10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Edge AI Insight</p>

          <PrimaryButton
            icon={<Bot className={clsx("h-4 w-4", loading && "animate-spin")} />}
            onClick={askAI}
            title="Generate AI explanation"
          >
            {insight ? "Refresh Insight" : "Ask Edge AI"}
          </PrimaryButton>
        </div>

        {/* Body */}
        {open && (
          <div className="mt-4 space-y-4 text-sm text-white/90">
            {loading && (
              <p className="text-white/60">Generating insight…</p>
            )}

            {error && (
              <p className="text-red-300 text-sm">{error}</p>
            )}

            {!loading && insight && (
              <>
                <div>
                  <p className="font-semibold">Summary</p>
                  <p className="text-text-muted">
                    {insight.simpleSummary ?? insight.summary}
                  </p>
                </div>

                <div>
       

                  <p className="mt-1 text-sm font-medium text-white/90">
                    {insight.whyItMatters?.headline}
                  </p>

                  <ul className="mt-2 space-y-1.5 text-sm text-text-muted">
                    {insight.whyItMatters?.bullets?.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



/* -------------------------------------------------------------------------- */
/*                                  Empty State                                */
/* -------------------------------------------------------------------------- */

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
      <div className="mx-auto w-fit rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 text-white/80">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
    </div>
  )
}







