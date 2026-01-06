// app/app/backtester/page.tsx
"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useBacktestSessionStore } from "@/lib/stores/useBacktestSessionStore"
import { SaveBacktestModal } from "@/components/backtests/SaveBacktestModal"
import { saveBacktest } from "@/lib/services/backtests"
import { buildSnapshotV1 } from "@/lib/services/backtests"
import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import BacktestShelf from "@/components/backtests/BacktestShelf"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Backtester Page (Minimal, Unique, Trader-Native)
 * ✅ Smooth equity curve (no step curve)
 * ✅ Inputs auto-apply to NEW trades (no "apply" button)
 * ✅ Advanced tab: Fees only (with modern toggle)
 * ✅ Breakeven trades kept and shown
 * ✅ Trade history: scrollable, compact, aesthetic rows
 * ✅ Removed Time column
 * ✅ Scrollbar hidden (but scroll still works)
 * ✅ Responsive: no overflow, cards/rows wrap on small screens
 *
 * Notes:
 * - Existing trades are NOT recalculated when inputs change (intentional)
 * - Save stores to localStorage (lightweight persistence)
 */

type Mode = "percent" | "dollar"
type TradeResult = "win" | "loss" | "breakeven"

type Trade = {
  id: number
  ts: number
  result: TradeResult

  // applied inputs at the time the trade was logged
  mode: Mode
  riskInput: number
  rewardInput: number
  multiplier: number

  // fees applied
  feesEnabled: boolean
  feeInput: number
  feePctApplied: number

  // computed
  rMultiple: number
  grossReturnPct: number
  netReturnPct: number
  feeAmount: number
  pnl: number
  equityBefore: number
  equityAfter: number
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x)
}

function safeNum(x: any, fallback = 0): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : fallback
}

function fmtNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—"
  return n.toFixed(digits)
}

function fmtMoney(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—"
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  return `${sign}$${abs.toFixed(digits)}`
}

function fmtPct(p: number, digits = 2) {
  if (!Number.isFinite(p)) return "—"
  return `${(p * 100).toFixed(digits)}%`
}

function computeMaxDrawdown(equity: number[]) {
  let peak = -Infinity
  let maxDd = 0
  for (const v of equity) {
    peak = Math.max(peak, v)
    if (peak > 0) maxDd = Math.max(maxDd, (peak - v) / peak)
  }
  return maxDd
}

function computeConsecutive(trades: Trade[]) {
  let maxWins = 0,
    maxLoss = 0
  let w = 0,
    l = 0
  for (const t of trades) {
    if (t.result === "win") {
      w++
      l = 0
      maxWins = Math.max(maxWins, w)
    } else if (t.result === "loss") {
      l++
      w = 0
      maxLoss = Math.max(maxLoss, l)
    } else {
      w = 0
      l = 0
    }
  }
  return { maxWins, maxLoss }
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

/* -------------------------------- UI bits -------------------------------- */

function Card({
  title,
  right,
  children,
  className,
  noPad,
}: {
  title?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPad?: boolean
}) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-white/10 bg-white/5", className)}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 min-w-0">
          <div className="min-w-0 text-sm font-semibold text-white/85 truncate">{title}</div>
          <div className="shrink-0">{right}</div>
        </div>
      )}
      <div className={cn(noPad ? "" : "p-4")}>{children}</div>
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = "ghost",
  className,
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "ghost" | "win" | "loss" | "neutral"
  className?: string
  title?: string
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition border disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
  const styles =
    variant === "primary"
      ? "bg-emerald-500/90 hover:bg-emerald-500 border-emerald-400/30 text-white"
      : variant === "win"
      ? "bg-emerald-500/85 hover:bg-emerald-500 border-emerald-400/30 text-white"
      : variant === "loss"
      ? "bg-rose-500/85 hover:bg-rose-500 border-rose-400/30 text-white"
      : variant === "neutral"
      ? "bg-white/8 hover:bg-white/12 border-white/10 text-white/85"
      : "bg-white/5 hover:bg-white/10 border-white/10 text-white/80"

  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cn(base, styles, className)}>
      {children}
    </button>
  )
}

function Pill({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-xl text-xs font-semibold transition border active:scale-[0.98]",
        active
          ? "bg-white/12 border-white/15 text-white"
          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70",
        className
      )}
    >
      {children}
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-white/45">{children}</div>
}

function Input({
  value,
  onChange,
  placeholder,
  rightText,
  className,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rightText?: string
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode ?? "decimal"}
        className={cn(
          "w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 outline-none",
          "placeholder:text-white/25 focus:border-white/20"
        )}
      />
      {rightText ? (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/35">
          {rightText}
        </div>
      ) : null}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-white/10" />
}

function StatCell({
  label,
  value,
  valueClass,
  sub,
}: {
  label: string
  value: React.ReactNode
  valueClass?: string
  sub?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className={cn("text-sm font-semibold text-white/90", valueClass)}>{value}</div>
      {sub ? <div className="text-[11px] text-white/45">{sub}</div> : null}
    </div>
  )
}

function PnLStat({
  pnlPct,
  pnlAbs,
}: {
  pnlPct: number
  pnlAbs: number
}) {
  const color = pnlPct >= 0 ? "text-emerald-300" : "text-rose-300"
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-1">
      <div className="text-[11px] text-white/45">PnL</div>
      <div className={cn("text-sm font-semibold", color)}>{fmtPct(pnlPct, 2)}</div>
      <div className="text-[11px] text-white/45">{fmtMoney(pnlAbs, 2)}</div>
    </div>
  )
}

function ResultBadge({ r }: { r: TradeResult }) {
  const cls =
    r === "win"
      ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-200"
      : r === "loss"
      ? "bg-rose-400/10 border-rose-400/20 text-rose-200"
      : "bg-white/6 border-white/10 text-white/75"
  const label = r === "win" ? "Win" : r === "loss" ? "Loss" : "BE"
  return (
    <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold border", cls)}>
      {label}
    </span>
  )
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: () => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-xs text-white/60">{label}</span> : null}
      <button
        type="button"
        onClick={onChange}
        aria-pressed={value}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors border",
          value ? "bg-emerald-500/80 border-emerald-400/20" : "bg-white/10 border-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            value ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
}

/* --------------------------- Smooth chart (SVG) ---------------------------- */

type Point = { x: number; y: number }

/**
 * Catmull-Rom to Bezier conversion for smooth curve.
 * Returns SVG path string.
 */
function catmullRomToBezier(points: Point[]) {
  if (points.length < 2) return ""

  const p = points
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`

  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] ?? p2

    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(
      2
    )} ${p2.y.toFixed(2)}`
  }
  return d
}

function SmoothEquityChart({ values }: { values: number[] }) {
  const padL = 34
  const padR = 14
  const padT = 18
  const padB = 28
  const w = 1100
  const h = 460

  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const span = Math.max(1e-9, maxV - minV)

  const x = (i: number) => {
    const n = Math.max(1, values.length - 1)
    const t = i / n
    return padL + t * (w - padL - padR)
  }

  const y = (v: number) => {
    const t = (v - minV) / span
    return padT + (1 - t) * (h - padT - padB)
  }

  const points: Point[] = values.map((v, i) => ({ x: x(i), y: y(v) }))
  const lineD = catmullRomToBezier(points)
  const baseY = h - padB
  const areaD = `${lineD} L ${points[points.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} L ${points[0].x.toFixed(
    2
  )} ${baseY.toFixed(2)} Z`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]">
        <div className="absolute -top-24 left-[25%] h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -top-28 left-[65%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[360px] sm:h-[420px] lg:h-[460px]">
        <defs>
          <linearGradient id="eqAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.22)" />
            <stop offset="55%" stopColor="rgba(16,185,129,0.10)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {Array.from({ length: 7 }).map((_, i) => {
          const yy = padT + (i / 6) * (h - padT - padB)
          return <line key={`gy${i}`} x1={padL} x2={w - padR} y1={yy} y2={yy} stroke="rgba(255,255,255,0.06)" />
        })}
        {Array.from({ length: 10 }).map((_, i) => {
          const xx = padL + (i / 9) * (w - padL - padR)
          return <line key={`gx${i}`} y1={padT} y2={h - padB} x1={xx} x2={xx} stroke="rgba(255,255,255,0.04)" />
        })}

        <path d={areaD} fill="url(#eqAreaFill)" />
        <path d={lineD} fill="none" stroke="rgba(226,232,240,0.92)" strokeWidth="2.5" />

        <text x={8} y={padT + 10} fill="rgba(255,255,255,0.45)" fontSize="11">
          {fmtNum(maxV, 2)}
        </text>
        <text x={8} y={h - padB} fill="rgba(255,255,255,0.45)" fontSize="11">
          {fmtNum(minV, 2)}
        </text>

        <text x={padL} y={h - 8} fill="rgba(255,255,255,0.40)" fontSize="11">
          0
        </text>
        <text x={w - padR - 22} y={h - 8} fill="rgba(255,255,255,0.40)" fontSize="11">
          {values.length - 1}
        </text>
      </svg>
    </div>
  )
}

/* ---------------------------------- Page ---------------------------------- */

export default function BacktesterPage() {
  const [existingBacktests, setExistingBacktests] = useState<{ id: string; name: string }[]>([])

  const [showSave, setShowSave] = useState(false)
  const [saving, setSaving] = useState(false)

  // Keep your local input-string UX (unchanged)
  const [mode, setMode] = useState<Mode>("percent")
  const [initialStr, setInitialStr] = useState("1000")
  const [riskStr, setRiskStr] = useState("1")
  const [rewardStr, setRewardStr] = useState("3")
  const [multiplier, setMultiplier] = useState(1)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [feesEnabled, setFeesEnabled] = useState(false)
  const [feeStr, setFeeStr] = useState("0.1")

  const [savedToast, setSavedToast] = useState(false)
  const toastTimer = useRef<any>(null)
  const isHydratingRef = useRef(false)


  // ✅ SINGLE source: store session
  const session = useBacktestSessionStore((s) => s)
  const { id: backtestId, config, trades, isDirty } = session

  // Keep numeric memo values exactly as your original logic
  const initial = useMemo(() => Math.max(0.01, safeNum(initialStr, 1000)), [initialStr])
  const risk = useMemo(() => Math.max(0, safeNum(riskStr, 1)), [riskStr])
  const reward = useMemo(() => Math.max(0, safeNum(rewardStr, 3)), [rewardStr])
  const feeValue = useMemo(() => Math.max(0, safeNum(feeStr, 0.1)), [feeStr])

  const equitySeries = useMemo(() => {
    const series = [initial]
    for (const t of trades) series.push(t.equityAfter)
    return series
  }, [initial, trades])

  // ✅ When store hydrates (open saved backtest), reflect into local UI input states
  useEffect(() => {
    if (!config) return

    // lock to prevent local->store effect from firing during hydration
    isHydratingRef.current = true

    setMode(config.mode)
    setInitialStr(String(config.initial))
    setRiskStr(String(config.risk))
    setRewardStr(String(config.reward))
    setMultiplier(config.multiplier)
    setFeesEnabled(config.feesEnabled)
    setFeeStr(String(config.feeValue))
    setAdvancedOpen(!!config.advancedOpen)

    // unlock after this render flush
    Promise.resolve().then(() => {
      isHydratingRef.current = false
    })
  }, [config])


  // ✅ When user changes inputs locally, push into store config (no UX change)
  useEffect(() => {
    // prevent infinite loop during store hydration
    if (isHydratingRef.current) return

    useBacktestSessionStore.getState().updateConfig({
      mode,
      initial,
      risk,
      reward,
      multiplier,
      feesEnabled,
      feeValue,
      advancedOpen,
    })
    // NOTE: trades are NOT recalculated (same as your original)
  }, [mode, initial, risk, reward, multiplier, feesEnabled, feeValue, advancedOpen])

  // Load existing backtests list (for Save modal duplicate handling)
  useEffect(() => {
    async function fetchExisting() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from("backtests").select("id,name").eq("user_id", user.id)
      setExistingBacktests(data ?? [])
    }
    fetchExisting()
  }, [])

  // ✅ OPEN: hydrate store from the saved snapshot in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get("open")) return

    const raw = sessionStorage.getItem("propguru_open_backtest_v1")
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)

      // Support both shapes:
      // A) { id, name, notes, snapshot:{config,trades} }
      // B) { id, name, notes, config, trades }
      const snap = parsed.snapshot ?? parsed

      useBacktestSessionStore.getState().hydrateFromDb({
        id: parsed.id,
        name: parsed.name ?? "",
        notes: parsed.notes ?? "",
        config: snap.config,
        trades: Array.isArray(snap.trades) ? snap.trades : [],
      })

      sessionStorage.removeItem("propguru_open_backtest_v1")
    } catch (err) {
      console.error("Failed to load backtest", err)
    }
  }, [])

  const metrics = useMemo(() => {
    const total = trades.length
    const wins = trades.filter((t) => t.result === "win").length
    const losses = trades.filter((t) => t.result === "loss").length
    const bes = trades.filter((t) => t.result === "breakeven").length

    const endEq = equitySeries[equitySeries.length - 1] ?? initial
    const pnlAbs = endEq - initial
    const pnlPct = initial > 0 ? pnlAbs / initial : NaN

    const winrate = wins + losses > 0 ? wins / (wins + losses) : NaN

    const grossWins = trades.filter((t) => t.pnl > 0).reduce((a, t) => a + t.pnl, 0)
    const grossLossAbs = Math.abs(trades.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0))
    const profitFactor = grossLossAbs > 0 ? grossWins / grossLossAbs : wins > 0 ? Infinity : NaN

    const maxDd = computeMaxDrawdown(equitySeries)

    const bestTradePct = trades.length ? Math.max(...trades.map((t) => t.netReturnPct)) : NaN
    const worstTradePct = trades.length ? Math.min(...trades.map((t) => t.netReturnPct)) : NaN

    const consec = computeConsecutive(trades)

    const winReturns = trades.filter((t) => t.result === "win").map((t) => t.netReturnPct)
    const lossReturns = trades.filter((t) => t.result === "loss").map((t) => t.netReturnPct)

    const avgWin = winReturns.length ? winReturns.reduce((a, b) => a + b, 0) / winReturns.length : NaN
    const avgLossAbs = lossReturns.length
      ? Math.abs(lossReturns.reduce((a, b) => a + b, 0) / lossReturns.length)
      : NaN
    const rrAvg = avgLossAbs > 0 ? avgWin / avgLossAbs : NaN

    const avgReturnPerTrade = total ? pnlPct / total : 0
    const sampleFactor = total >= 50 ? 1 : total >= 20 ? 0.75 : total >= 10 ? 0.5 : total > 0 ? 0.25 : 0
    const edgeRaw =
      avgReturnPerTrade * 300 +
      (Number.isFinite(winrate) ? winrate : 0) * 28 -
      (Number.isFinite(maxDd) ? maxDd : 0) * 45 +
      sampleFactor * 20
    const edgeScore = clamp(edgeRaw, 0, 100)

    return {
      total,
      wins,
      losses,
      bes,
      winrate,
      pnlAbs,
      pnlPct,
      profitFactor,
      edgeScore,
      maxDd,
      bestTradePct,
      worstTradePct,
      maxConsecWins: consec.maxWins,
      maxConsecLoss: consec.maxLoss,
      avgWin,
      avgLossAbs,
      rrAvg,
      endEq,
    }
  }, [trades, equitySeries, initial])

  function showSavedToast() {
    setSavedToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setSavedToast(false), 1200)
  }

  // ✅ RESET + UNDO fixed (store-backed)
  function resetTrades() {
    useBacktestSessionStore.getState().setTrades([])
  }

  function undo() {
    useBacktestSessionStore.getState().undoTrade()
  }

  function computeFeePctApplied(equityBefore: number) {
    if (!feesEnabled) return 0
    if (equityBefore <= 0) return 0
    if (mode === "percent") return feeValue / 100
    return feeValue / equityBefore
  }

  function addTrade(result: TradeResult) {
    const equityBefore = trades.length ? trades[trades.length - 1].equityAfter : initial
    const rMultiple = result === "win" ? reward : result === "loss" ? -1 : 0

    let grossReturnPct = 0
    if (mode === "percent") {
      grossReturnPct = (risk / 100) * rMultiple * multiplier
    } else {
      const riskDollars = risk * multiplier
      grossReturnPct = equityBefore > 0 ? (riskDollars * rMultiple) / equityBefore : 0
    }

    const feePctApplied = computeFeePctApplied(equityBefore)
    const netReturnPct = grossReturnPct - feePctApplied
    const feeAmount = equityBefore * feePctApplied
    const pnl = equityBefore * netReturnPct
    const equityAfter = equityBefore + pnl

    const t: Trade = {
      id: (trades[trades.length - 1]?.id ?? 0) + 1,
      ts: Date.now(),
      result,
      mode,
      riskInput: risk,
      rewardInput: reward,
      multiplier,
      feesEnabled,
      feeInput: feeValue,
      feePctApplied,
      rMultiple,
      grossReturnPct,
      netReturnPct,
      feeAmount,
      pnl,
      equityBefore,
      equityAfter,
    }

    useBacktestSessionStore.getState().appendTrade(t)
  }

  const qualityHint = useMemo(() => {
    const t = metrics.total
    if (t === 0) return { tone: "neutral" as const, text: "Log trades to build a quick read on expectancy." }
    if (t < 10) return { tone: "warn" as const, text: "Under 10 trades is noise. Keep going." }
    if (t < 20) return { tone: "mid" as const, text: "20 trades is a bare minimum for confidence." }
    return { tone: "good" as const, text: "Sample size is getting meaningful. Avoid changing rules mid-run." }
  }, [metrics.total])

  const hintPillCls =
    qualityHint.tone === "good"
      ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-200"
      : qualityHint.tone === "mid"
      ? "bg-amber-400/10 border-amber-400/20 text-amber-200"
      : qualityHint.tone === "warn"
      ? "bg-rose-400/10 border-rose-400/20 text-rose-200"
      : "bg-white/6 border-white/10 text-white/75"

  const feeUnit = mode === "percent" ? "%" : "$"

  return (
    <div className="min-h-[calc(100vh-72px)] px-4 sm:px-6 py-5 sm:py-6 text-white">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
      </div>
      {/* hidden scrollbar utility (no globals needed) */}
      <style jsx global>{`
        .scroll-clean {
          scrollbar-width: none; /* Firefox */
        }
        .scroll-clean::-webkit-scrollbar {
          width: 0px; /* Chrome/Safari */
          height: 0px;
        }
      `}</style>


      {/* Toast */}
      <AnimatePresence>
        {savedToast ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur">
              Saved
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Top Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Controls */}
        <Card
          className="col-span-12 xl:col-span-4"
          title="Controls"
          right={<span className="text-[11px] text-white/45">Auto-applies to new trades</span>}
        >
          <div className="flex flex-col lg:flex-row xl:flex-col items-start gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Save / Reset */}
              <Button variant="primary" onClick={() => setShowSave(true)} className="px-4 py-1.5 text-xs">
                Save
              </Button>

              <Button
                variant="ghost"
                onClick={resetTrades}
                disabled={trades.length === 0}
                className="px-4 py-1.5 text-xs text-white/60"
              >
                Reset
              </Button>

              <div className="h-4 w-px bg-white/10 mx-1" />

              {/* Mode */}
              <Pill
                active={mode === "dollar"}
                onClick={() => {
                  setMode("dollar")
                }}
              >
                Dollar
              </Pill>
              <Pill
                active={mode === "percent"}
                onClick={() => {
                  setMode("percent")
                }}
              >
                Percent
              </Pill>

              <div className="h-4 w-px bg-white/10 mx-1" />

              {/* Multiplier */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                  onClick={() => setMultiplier((m) => Math.max(0.1, Number((m - 0.1).toFixed(1))))}
                >
                  −
                </button>

                <div className="min-w-[44px] text-center text-xs font-semibold text-white/85">
                  {multiplier.toFixed(1)}x
                </div>

                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                  onClick={() => setMultiplier((m) => Number((m + 0.1).toFixed(1)))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="min-w-0">
                  <Label>Initial</Label>
                  <Input value={initialStr} onChange={setInitialStr} inputMode="decimal" />
                </div>
                <div className="min-w-0">
                  <Label>{mode === "percent" ? "Risk (%)" : "Risk ($)"}</Label>
                  <Input
                    value={riskStr}
                    onChange={setRiskStr}
                    rightText={mode === "percent" ? "%" : "$"}
                    inputMode="decimal"
                  />
                </div>
                <div className="min-w-0">
                  <Label>Reward (R)</Label>
                  <Input value={rewardStr} onChange={setRewardStr} rightText="R" inputMode="decimal" />
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                    hintPillCls
                  )}
                >
                  {qualityHint.text}
                </div>

                <Button variant="ghost" onClick={() => setAdvancedOpen((v) => !v)} className="w-full sm:w-auto">
                  Advanced <span className="text-white/50">{advancedOpen ? "▴" : "▾"}</span>
                </Button>
              </div>

              <AnimatePresence>
                {advancedOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-white/80">Fees</div>
                        <Toggle value={feesEnabled} onChange={() => setFeesEnabled((v) => !v)} label="Enable" />
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                        <div className="sm:col-span-2 min-w-0">
                          <Label>Fee per trade ({feeUnit})</Label>
                          <Input value={feeStr} onChange={setFeeStr} rightText={feeUnit} inputMode="decimal" />
                        </div>
                        <div className="sm:col-span-1 min-w-0">
                          <Label>Applies</Label>
                          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                            Every trade
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-white/45">
                        Fees are applied when you log trades. Existing trades are not recalculated.
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="col-span-12 xl:col-span-8" title="Summary">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <StatCell label="Winrate" value={metrics.total ? fmtPct(metrics.winrate, 2) : "—"} />
            <PnLStat pnlPct={metrics.pnlPct} pnlAbs={metrics.pnlAbs} />
            <StatCell label="Total Trades" value={metrics.total ? <span className="text-white/90">{metrics.total}</span> : "—"} />
            <StatCell label="Wins / Losses" value={metrics.total ? `${metrics.wins}W / ${metrics.losses}L` : "—"} />
            <StatCell label="Breakeven Trades" value={metrics.total ? metrics.bes : "—"} />
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
            Tip: changing Risk / Reward affects new trades only — keeps the backtest honest.
          </div>
        </Card>
      </div>

      {/* Main */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Left: Chart + Action bar + History */}
        <div className="col-span-12 xl:col-span-8 min-w-0">
          <Card title="Equity Curve" right={<span className="text-[11px] text-white/45">Smooth line</span>}>
            {equitySeries.length <= 1 ? (
              <div className="h-[360px] sm:h-[420px] lg:h-[460px] rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-sm text-white/40">
                Add trades to generate the curve
              </div>
            ) : (
              <SmoothEquityChart values={equitySeries} />
            )}

            {/* ACTION BAR (moved here) */}
            <div className="mt-4 flex flex-wrap items-stretch gap-3">
              {/* Loss */}
              <button
                onClick={() => addTrade("loss")}
                className="flex-1 min-w-[160px] rounded-xl border border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/15 transition p-3 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  −1R Loss
                </div>
                <div className="mt-1 text-[11px] text-white/45">Discipline check</div>
              </button>

              {/* Breakeven */}
              <button
                onClick={() => addTrade("breakeven")}
                className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition p-3 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <span className="h-2 w-2 rounded-full bg-white/60" />
                  Breakeven
                </div>
                <div className="mt-1 text-[11px] text-white/45">Chop / scratch</div>
              </button>

              {/* Win */}
              <button
                onClick={() => addTrade("win")}
                className="flex-1 min-w-[160px] rounded-xl border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/15 transition p-3 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  +1R Win
                </div>
                <div className="mt-1 text-[11px] text-white/45">Execution rewarded</div>
              </button>

              {/* Undo */}
              <div className="flex items-center">
                <button
                  onClick={undo}
                  disabled={trades.length === 0}
                  className="ml-auto h-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 text-xs text-white/60 disabled:opacity-40"
                >
                  Undo
                </button>
              </div>
            </div>
          </Card>

          {/* History */}
          <Card
            className="mt-4"
            title="Trade History"
            right={<div className="text-[11px] text-white/45">{metrics.total ? `${metrics.total} trades` : "No trades"}</div>}
          >
            <div className="rounded-2xl border border-white/10 bg-black/20 min-w-0">
              {/* Header row (responsive) */}
              <div className="px-4 py-2 text-[11px] text-white/45 border-b border-white/10">
                <div className="grid grid-cols-12 gap-2 min-w-0">
                  <div className="col-span-2 sm:col-span-1">#</div>
                  <div className="col-span-4 sm:col-span-2">Result</div>
                  <div className="col-span-3 sm:col-span-2">Return</div>
                  <div className="col-span-3 sm:col-span-2">PnL</div>
                  <div className="hidden sm:block sm:col-span-2">Fees</div>
                  <div className="hidden sm:block sm:col-span-3">Equity</div>
                </div>
              </div>

              {/* Scroll container (hidden scrollbar) */}
              <div className="max-h-[360px] overflow-y-auto scroll-clean">
                {trades.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-white/40">No trades logged yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {trades
                      .slice()
                      .reverse()
                      .map((t) => {
                        const returnCls =
                          t.netReturnPct > 0 ? "text-emerald-300" : t.netReturnPct < 0 ? "text-rose-300" : "text-white/70"
                        const pnlCls = t.pnl > 0 ? "text-emerald-300" : t.pnl < 0 ? "text-rose-300" : "text-white/70"

                        return (
                          <div key={t.id} className="px-4 py-3 text-sm hover:bg-white/5 transition-colors">
                            <div className="grid grid-cols-12 gap-2 items-center min-w-0">
                              <div className="col-span-2 sm:col-span-1 text-white/55">{t.id}</div>

                              <div className="col-span-4 sm:col-span-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ResultBadge r={t.result} />
                                  <span className="text-[11px] text-white/35 truncate">
                                    {t.result === "win"
                                      ? `+${fmtNum(t.rMultiple, 2)}R`
                                      : t.result === "loss"
                                      ? `${fmtNum(t.rMultiple, 2)}R`
                                      : "0R"}
                                  </span>
                                </div>
                              </div>

                              <div className={cn("col-span-3 sm:col-span-2 font-semibold", returnCls)}>{fmtPct(t.netReturnPct, 2)}</div>

                              <div className={cn("col-span-3 sm:col-span-2 font-semibold", pnlCls)}>{fmtMoney(t.pnl, 2)}</div>

                              <div className="hidden sm:block sm:col-span-2 text-white/70">
                                {t.feesEnabled ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span className="text-white/55">{fmtMoney(-t.feeAmount, 2)}</span>
                                    <span className="text-[11px] text-white/35">{fmtPct(-t.feePctApplied, 2)}</span>
                                  </span>
                                ) : (
                                  <span className="text-white/35">—</span>
                                )}
                              </div>

                              <div className="hidden sm:block sm:col-span-3 text-white/80 min-w-0">
                                <div className="flex flex-col leading-tight min-w-0">
                                  <span className="text-white/55 text-[11px] truncate">Before {fmtNum(t.equityBefore, 2)}</span>
                                  <span className="font-semibold truncate">After {fmtNum(t.equityAfter, 2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Mobile-only extra row for Equity + Fees */}
                            <div className="sm:hidden mt-2 text-[11px] text-white/55 flex flex-wrap gap-x-4 gap-y-1">
                              <span className="text-white/45">Equity:</span>
                              <span className="text-white/70">Before {fmtNum(t.equityBefore, 2)}</span>
                              <span className="text-white/85">After {fmtNum(t.equityAfter, 2)}</span>
                              <span className="text-white/45">Fees:</span>
                              <span className="text-white/70">{t.feesEnabled ? fmtMoney(-t.feeAmount, 2) : "—"}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Metrics */}
        <div className="col-span-12 xl:col-span-4 min-w-0">
          <Card title="Profitability">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Profit Factor</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">
                  {metrics.total ? (metrics.profitFactor === Infinity ? "∞" : fmtNum(metrics.profitFactor, 2)) : "—"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Edge Score</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">{metrics.total ? fmtNum(metrics.edgeScore, 2) : "—"}</div>
              </div>
            </div>
          </Card>

          <Card className="mt-4" title="Risk">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Largest Win</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">{metrics.total ? fmtPct(metrics.bestTradePct, 2) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Largest Loss</div>
                <div className="mt-1 text-sm font-semibold text-rose-300">{metrics.total ? fmtPct(metrics.worstTradePct, 2) : "—"}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
                <div className="text-[11px] text-white/45">Max Drawdown</div>
                <div className="mt-1 text-sm font-semibold text-white/90">{metrics.total ? fmtPct(metrics.maxDd, 2) : "—"}</div>
              </div>
            </div>
          </Card>

          <Card className="mt-4" title="Consistency">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Consec. Wins</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">{metrics.total ? metrics.maxConsecWins : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/45">Consec. Losses</div>
                <div className="mt-1 text-sm font-semibold text-rose-300">{metrics.total ? metrics.maxConsecLoss : "—"}</div>
              </div>
            </div>
          </Card>

          <Card className="mt-4" title="Averages">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                <div className="text-[11px] text-white/45">Win</div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">{metrics.total ? fmtPct(metrics.avgWin, 2) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                <div className="text-[11px] text-white/45">Loss</div>
                <div className="mt-1 text-sm font-semibold text-rose-300">{metrics.total ? fmtPct(-metrics.avgLossAbs, 2) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                <div className="text-[11px] text-white/45">Reward : Risk</div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  {metrics.total ? (Number.isFinite(metrics.rrAvg) ? `${fmtNum(metrics.rrAvg, 2)}:1` : "—") : "—"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-4" title="Notes">
            <div className="text-sm text-white/65">Quick manual backtester. Keep rules stable during a run. Fees make net curve more realistic.</div>
          </Card>

          <Card className="mt-4" noPad>
            <BacktestShelf />
          </Card>
        </div>
      </div>

      <SaveBacktestModal
        open={showSave}
        existing={existingBacktests}
        onClose={() => setShowSave(false)}
        onConfirm={async (payload: any) => {
          try {
            setSaving(true)

            const snapshot = buildSnapshotV1({
              config: useBacktestSessionStore.getState().config,
              trades: useBacktestSessionStore.getState().trades,
            })

            const name =
              payload?.name ??
              useBacktestSessionStore.getState().name ??
              "Untitled"

            const notes =
              payload?.notes ??
              useBacktestSessionStore.getState().notes ??
              null

            const overwrite = payload?.mode === "overwrite"

            const res = await saveBacktest({
              name,
              notes,
              snapshot,
              overwrite,
            })

            if (!res.ok && res.reason === "DUPLICATE") {
              // modal already handled conflict UI
              return
            }

            // mark local session as saved (no id needed)
            useBacktestSessionStore.getState().markSaved(name)

            setShowSave(false)
            showSavedToast()
          } catch (err: any) {
            console.error("Save failed FULL ERROR:", err)
            alert(
              err?.message ??
                err?.error_description ??
                JSON.stringify(err, null, 2)
            )
          } finally {
            setSaving(false)
          }
        }}
      />

      {/* Entrance motion (subtle) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} />
    </div>
  )
}
