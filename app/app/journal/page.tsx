"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import { useMT5Store } from "@/lib/mt5Store"
import JournalAIInsightCard from "@/components/JournalAIInsightCard"

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  Activity,
  Sparkles,
  X,
} from "lucide-react"

/* -------------------------------- Types -------------------------------- */

type Trade = {
  id: string
  symbol: string
  side: "long" | "short"
  pnl: number
  time: string
  closedAt: Date
}

type DayStats = {
  date: Date
  trades: Trade[]
}

type WeekSummary = {
  label: string
  start: Date
  end: Date
  pnl: number
  trades: number
}

/* ------------------------------ Supabase -------------------------------- */

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ------------------------------ Date utils ------------------------------ */

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function ymdKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfWeekSunday(d: Date) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  x.setHours(0, 0, 0, 0)
  return x
}

function monthGridDays(month: Date) {
  const days: Date[] = []
  let cur = startOfWeekSunday(startOfMonth(month))
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function formatMonthTitle(d: Date) {
  return d.toLocaleString("default", { month: "long", year: "numeric" })
}

function formatRangeShort(a: Date, b: Date) {
  return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`
}

function money(n: number, decimals = 0) {
  const sign = n >= 0 ? "+" : "-"
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/* ------------------------- DB → UI helpers ------------------------------ */

function buildDayMap(rows: any[]): Record<string, DayStats> {
  const map: Record<string, DayStats> = {}

  for (const r of rows) {
    const closedAt = new Date(r.closed_at)
    const key = ymdKey(closedAt)

    if (!map[key]) map[key] = { date: closedAt, trades: [] }

    map[key].trades.push({
      id: r.id,
      symbol: r.symbol,
      side: r.side,
      pnl: Number(r.pnl),
      time: closedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      closedAt,
    })
  }

  for (const k of Object.keys(map)) {
    map[k].trades.sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  }

  return map
}

function sumPnL(trades: Trade[]) {
  return trades.reduce((a, t) => a + t.pnl, 0)
}

function computeWinPct(trades: Trade[]) {
  if (!trades.length) return 0
  const wins = trades.filter((t) => t.pnl > 0).length
  return (wins / trades.length) * 100
}

function computeAvg(trades: Trade[]) {
  if (!trades.length) return 0
  return sumPnL(trades) / trades.length
}

function computeMonthKPIs(dayMap: Record<string, DayStats>) {
  const trades = Object.values(dayMap).flatMap((d) => d.trades)
  const net = sumPnL(trades)
  const winPct = computeWinPct(trades)
  const avg = computeAvg(trades)
  const wins = trades.filter((t) => t.pnl > 0).length
  const losses = trades.filter((t) => t.pnl < 0).length
  return { trades, net, winPct, avg, wins, losses }
}



function computeWeeks(month: Date, map: Record<string, DayStats>): WeekSummary[] {
  const weeks: WeekSummary[] = []
  let cur = startOfWeekSunday(startOfMonth(month))
  let idx = 1

  for (let w = 0; w < 6; w++) {
    let pnl = 0
    let tradesCount = 0

    for (let i = 0; i < 7; i++) {
      const d = addDays(cur, i)
      const data = map[ymdKey(d)]
      if (data) {
        pnl += sumPnL(data.trades)
        tradesCount += data.trades.length
      }
    }

    weeks.push({
      label: `Week ${idx++}`,
      start: cur,
      end: addDays(cur, 6),
      pnl,
      trades: tradesCount,
    })

    cur = addDays(cur, 7)
  }

  return weeks
}

function getTradesInRange(dayMap: Record<string, DayStats>, start: Date, end: Date) {
  const trades: Trade[] = []
  const s = new Date(start)
  s.setHours(0, 0, 0, 0)
  const e = new Date(end)
  e.setHours(0, 0, 0, 0)

  let cur = new Date(s)
  while (cur <= e) {
    const data = dayMap[ymdKey(cur)]
    if (data) trades.push(...data.trades)
    cur = addDays(cur, 1)
  }

  trades.sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
  return trades
}

/* ------------------------------ UI bits -------------------------------- */

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ")
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "good" | "bad" | "violet"
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.14)_inset]"
      : tone === "bad"
      ? "bg-red-500/10 text-red-200 shadow-[0_0_0_1px_rgba(248,113,113,0.14)_inset]"
      : tone === "violet"
      ? "bg-violet-500/10 text-violet-200 shadow-[0_0_0_1px_rgba(167,139,250,0.18)_inset]"
      : "bg-white/[0.04] text-neutral-200 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]"

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-xs", cls)}>
      {children}
    </div>
  )
}

function SoftCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]",
        "backdrop-blur supports-[backdrop-filter]:bg-white/[0.025]",
        className
      )}
    >
      {children}
    </div>
  )
}

function MetricCard({
  icon,
  title,
  value,
  sub,
  accent,
  right,
}: {
  icon: React.ReactNode
  title: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: "good" | "bad" | "neutral"
  right?: React.ReactNode
}) {
  const ring =
    accent === "good"
      ? "shadow-[0_0_0_1px_rgba(52,211,153,0.14)_inset]"
      : accent === "bad"
      ? "shadow-[0_0_0_1px_rgba(248,113,113,0.14)_inset]"
      : "shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]"

  return (
    <div className={cn("rounded-3xl bg-neutral-950/55 p-4", ring)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 rounded-2xl bg-white/[0.04] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-neutral-400">{title}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
            {sub ? <div className="mt-1 text-xs text-neutral-400">{sub}</div> : null}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-[860px]",
}: {
  title?: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  widthClass?: string
}) {

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        {/* FULL-SCREEN BACKDROP */}
        <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0, ease: "easeOut" }}
        onPointerDown={onClose}
      />
        <motion.div

          className={cn(
            "relative w-full overflow-hidden rounded-3xl bg-[#0f0f0f]/95 text-white shadow-2xl shadow-black/50",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]",
            widthClass
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="min-w-0">
                <div className="text-lg font-semibold">{title}</div>
                {subtitle && (
                  <div className="mt-1 text-sm text-neutral-400">{subtitle}</div>
                )}
              </div>

              <button
                onClick={onClose}
                className="rounded-full px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          )}
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function TradesList({ trades }: { trades: Trade[] }) {
  return (
    <div className="space-y-2">
      {trades.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center justify-between rounded-2xl px-3 py-2",
            "bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]"
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-neutral-200">{t.symbol}</div>
              <Pill tone={t.side === "long" ? "good" : "bad"}>{t.side.toUpperCase()}</Pill>
            </div>
            <div className="mt-1 text-xs text-neutral-400">{t.time}</div>
          </div>

          <div className={cn("text-sm font-semibold", t.pnl >= 0 ? "text-emerald-300" : "text-red-300")}>
            {money(t.pnl, 2)}
          </div>
        </div>
      ))}
      {!trades.length ? <div className="text-sm text-neutral-400">No trades found.</div> : null}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-44 rounded bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
    </div>
  )
}

/* -------------------------------- Page -------------------------------- */

export default function JournalPage() {
  const activeAccountId = useMT5Store((s) => s.activeAccountId)
  const refreshNonce = useMT5Store((s) => s.refreshNonce)

  const [month, setMonth] = useState(new Date())
  const [dayMap, setDayMap] = useState<Record<string, DayStats>>({})
  const [loading, setLoading] = useState(false)

  // Modals
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<WeekSummary | null>(null)

  /* ------------------------ Load trades (DB) ------------------------ */
  useEffect(() => {
    if (!activeAccountId) {
      setDayMap({})
      setSelectedDayKey(null)
      setSelectedWeek(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      const start = startOfMonth(month)
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 1)

      const { data, error } = await supabase
        .from("trades")
        .select("id, symbol, side, pnl, closed_at")
        .eq("account_id", activeAccountId)
        .gte("closed_at", start.toISOString())
        .lt("closed_at", end.toISOString())

      if (cancelled) return

      if (error) console.error("Failed to load trades", error)
      setDayMap(buildDayMap(data ?? []))
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [month, activeAccountId, refreshNonce])

  const gridDays = useMemo(() => monthGridDays(month), [month])
  const weeks = useMemo(() => computeWeeks(month, dayMap), [month, dayMap])
  const monthKPIs = useMemo(() => computeMonthKPIs(dayMap), [dayMap])
  const monthAIPayload = useMemo(() => {
  if (!activeAccountId) return null

    return {
      month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      stats: {
        net: monthKPIs.net,
        winRate: monthKPIs.winPct,
        avgPnL: monthKPIs.avg,
        trades: monthKPIs.trades.length,
        wins: monthKPIs.wins,
        losses: monthKPIs.losses
      },
      dailyPnL: Object.values(dayMap).map((d: DayStats) => ({
        date: d.date.toISOString().slice(0, 10),
        pnl: sumPnL(d.trades),
        trades: d.trades.length
      }))
    }
  }, [month, monthKPIs, dayMap, activeAccountId])


  const selectedDay = selectedDayKey ? dayMap[selectedDayKey] : null
  const dayTrades = selectedDay?.trades ?? []
  const dayNet = sumPnL(dayTrades)
  const dayWin = computeWinPct(dayTrades)
  const dayAvg = computeAvg(dayTrades)

  const weekTrades = useMemo(() => {
    if (!selectedWeek) return []
    return getTradesInRange(dayMap, selectedWeek.start, selectedWeek.end)
  }, [selectedWeek, dayMap])

  const weekNet = sumPnL(weekTrades)
  const weekWin = computeWinPct(weekTrades)
  const weekAvg = computeAvg(weekTrades)

  const netAccent = monthKPIs.net > 0 ? "good" : monthKPIs.net < 0 ? "bad" : "neutral"
  const avgAccent = monthKPIs.avg > 0 ? "good" : monthKPIs.avg < 0 ? "bad" : "neutral"

  const bestWorst = useMemo(() => {
    const entries = Object.entries(dayMap).map(([k, v]) => ({
      key: k,
      date: v.date,
      pnl: sumPnL(v.trades),
      trades: v.trades.length,
    }))
    if (!entries.length) return null
    const best = entries.reduce((a, b) => (b.pnl > a.pnl ? b : a), entries[0])
    const worst = entries.reduce((a, b) => (b.pnl < a.pnl ? b : a), entries[0])
    return { best, worst }
  }, [dayMap])

  const pnlAbsMax = useMemo(() => {
    const vals = Object.values(dayMap).map((d) => Math.abs(sumPnL(d.trades)))
    return Math.max(1, ...vals)
  }, [dayMap])

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 py-6 space-y-5">
        {/* Top bar */}
        <SoftCard className="px-4 sm:px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-neutral-400">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">Journal</span>
                <span className="text-xs text-neutral-600">•</span>
                <span className="text-sm">{formatMonthTitle(month)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="text-xl font-semibold tracking-tight">Monthly overview</div>
                {!activeAccountId ? (
                  <Pill tone="bad">No account selected</Pill>
                ) : (
                  <Pill tone="good">Account connected</Pill>
                )}
                {loading ? <Pill>Syncing…</Pill> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                  "bg-white/[0.04] text-neutral-200 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]",
                  "hover:bg-white/[0.06] active:scale-[0.99]"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <button
                onClick={() => setMonth(new Date())}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                  "bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.16)_inset]",
                  "hover:bg-emerald-500/14 active:scale-[0.99]"
                )}
              >
                Today
              </button>

              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                  "bg-white/[0.04] text-neutral-200 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]",
                  "hover:bg-white/[0.06] active:scale-[0.99]"
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SoftCard>

        {/* KPI row (scrollable on mobile) */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Activity className="h-5 w-5 text-neutral-200" />}
            title="Net P&L"
            accent={netAccent}
            value={
              <span className={monthKPIs.net >= 0 ? "text-emerald-300" : "text-red-300"}>
                {money(monthKPIs.net, 2)}
              </span>
            }
            sub={
              <span className={monthKPIs.net >= 0 ? "text-emerald-400" : "text-red-400"}>
                {monthKPIs.net >= 0 ? "Equity trending up" : "Equity trending down"}
              </span>
            }
            right={
              <Pill tone={netAccent === "good" ? "good" : netAccent === "bad" ? "bad" : "neutral"}>
                {monthKPIs.wins}W / {monthKPIs.losses}L
              </Pill>
            }
          />

          <MetricCard
            icon={<Percent className="h-5 w-5 text-neutral-200" />}
            title="Win rate"
            value={<span className="text-white">{monthKPIs.winPct.toFixed(1)}%</span>}
            sub={<span>{monthKPIs.trades.length} trades</span>}
            right={<Pill>{Math.round(monthKPIs.winPct)}% consistency</Pill>}
          />

          <MetricCard
            icon={<Target className="h-5 w-5 text-neutral-200" />}
            title="Trades"
            value={<span className="text-white">{monthKPIs.trades.length}</span>}
            sub={<span className="text-neutral-400">executed this month</span>}
            right={<Pill>Avg {Math.round(monthKPIs.trades.length / 4)} / week</Pill>}
          />

          <MetricCard
            icon={
              monthKPIs.avg >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-300" />
              )
            }
            title="Avg P&L / trade"
            accent={avgAccent}
            value={
              <span className={monthKPIs.avg >= 0 ? "text-emerald-300" : "text-red-300"}>
                {money(monthKPIs.avg, 2)}
              </span>
            }
            sub={<span className="text-neutral-400">expectancy snapshot</span>}
            right={
              <Pill tone={avgAccent === "good" ? "good" : avgAccent === "bad" ? "bad" : "neutral"}>
                {monthKPIs.avg >= 0 ? "Positive edge" : "Negative edge"}
              </Pill>
            }
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
          {/* Calendar */}
          <SoftCard className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-200">Calendar</div>
                <div className="mt-1 text-xs text-neutral-400">
                  Tap a day for the breakdown • border intensity reflects the day’s magnitude
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Pill tone="good">Profit</Pill>
                <Pill tone="bad">Loss</Pill>
                <Pill>Flat</Pill>
              </div>
            </div>

            {/* Weekday header */}
            <div className="mt-4 grid grid-cols-7 gap-2 text-[11px] text-neutral-400">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="px-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {gridDays.map((d) => {
                const key = ymdKey(d)
                const data = dayMap[key]
                const pnl = data ? sumPnL(data.trades) : null
                const inMonth = isSameMonth(d, month)
                const tradesCount = data?.trades.length ?? 0

                const intensity = pnl === null ? 0 : Math.min(1, Math.abs(pnl) / pnlAbsMax)
                const ring =
                  pnl === null
                    ? "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                    : pnl > 0
                    ? "shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]"
                    : pnl < 0
                    ? "shadow-[0_0_0_1px_rgba(248,113,113,0.18)_inset]"
                    : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"

                const glow =
                  pnl === null
                    ? ""
                    : pnl > 0
                    ? "bg-emerald-500/6"
                    : pnl < 0
                    ? "bg-red-500/6"
                    : "bg-white/[0.03]"

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDayKey(key)}
                    className={cn(
                      "group relative h-[78px] sm:h-[86px] rounded-3xl px-3 py-2 text-left transition",
                      "hover:bg-white/[0.04] active:scale-[0.99]",
                      ring,
                      glow,
                      inMonth ? "opacity-100" : "opacity-35"
                    )}
                    style={{
                      // subtle “fill” feel based on magnitude
                      backgroundImage:
                        pnl === null
                          ? undefined
                          : pnl >= 0
                          ? `radial-gradient(circle at 20% 15%, rgba(16,185,129,${0.10 + intensity * 0.18}), rgba(0,0,0,0) 55%)`
                          : `radial-gradient(circle at 20% 15%, rgba(239,68,68,${0.10 + intensity * 0.18}), rgba(0,0,0,0) 55%)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-neutral-200/90">{d.getDate()}</div>

                      {tradesCount > 0 ? (
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            pnl! > 0
                              ? "bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                              : pnl! < 0
                              ? "bg-red-400/80 shadow-[0_0_10px_rgba(239,68,68,0.35)]"
                              : "bg-white/20"
                          )}
                        />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      )}
                    </div>

                    {pnl !== null ? (
                      <div className="mt-2">
                        <div
                          className={cn(
                            "text-sm font-semibold tracking-tight",
                            pnl >= 0 ? "text-emerald-300" : "text-red-300"
                          )}
                        >
                          {money(pnl, 0)}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-400">
                          {tradesCount} {tradesCount === 1 ? "trade" : "trades"}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 text-xs text-neutral-600">—</div>
                    )}

                    {/* hover hint */}
                    <div className="pointer-events-none absolute inset-x-3 bottom-2 opacity-0 transition group-hover:opacity-100">
                      <div className="h-px w-full bg-white/10" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Best / worst quick chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {bestWorst ? (
                <>
                  <Pill tone="good">
                    Best: {bestWorst.best.date.toLocaleDateString()} ({money(bestWorst.best.pnl, 0)})
                  </Pill>
                  <Pill tone="bad">
                    Worst: {bestWorst.worst.date.toLocaleDateString()} ({money(bestWorst.worst.pnl, 0)})
                  </Pill>
                </>
              ) : (
                <Pill>Log trades to see best / worst days</Pill>
              )}
            </div>
          </SoftCard>

          {/* Right rail */}
          <div className="space-y-4">
            <SoftCard className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-neutral-200">Weekly snapshots</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Tap a week for the full breakdown + trades
                  </div>
                </div>
                <Pill>{weeks.length} weeks</Pill>
              </div>

              <div className="mt-4 space-y-2">
                {!activeAccountId ? (
                  <div className="rounded-2xl bg-white/[0.03] p-4 text-sm text-neutral-400 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                    Select an account to see weekly performance.
                  </div>
                ) : loading ? (
                  <SkeletonRow />
                ) : (
                  weeks.map((w) => {
                    const positive = w.pnl >= 0
                    const mag = Math.min(1, Math.abs(w.pnl) / Math.max(1, Math.abs(monthKPIs.net || 1)))
                    return (
                      <button
                        key={w.label}
                        onClick={() => setSelectedWeek(w)}
                        className={cn(
                          "w-full text-left rounded-3xl p-4 transition",
                          "shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset] hover:bg-white/[0.04] active:scale-[0.99]",
                          positive ? "bg-emerald-500/6" : "bg-red-500/6"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-neutral-200">{w.label}</div>
                              <Pill tone={positive ? "good" : "bad"}>{positive ? "Profit" : "Loss"}</Pill>
                            </div>
                            <div className="mt-1 text-xs text-neutral-400">
                              {formatRangeShort(w.start, w.end)}
                            </div>
                          </div>

                          <div className={cn("text-sm font-semibold", positive ? "text-emerald-300" : "text-red-300")}>
                            {money(w.pnl, 0)}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                          <span>{w.trades} trades</span>
                          <span className={positive ? "text-emerald-400" : "text-red-400"}>
                            {positive ? "↗" : "↘"} {Math.round(mag * 100)}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn("h-full", positive ? "bg-emerald-400/70" : "bg-red-400/70")}
                            style={{ width: `${Math.max(6, Math.round(mag * 100))}%` }}
                          />
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </SoftCard>

            {/* AI Journal Insight (LIVE) */}
            <JournalAIInsightCard
              endpoint="/api/ai/journal/month"
              payload={monthAIPayload}
              disabled={!monthAIPayload || loading}
              cacheKey={`journal:month:${activeAccountId}:${month.getFullYear()}-${month.getMonth() + 1}`}
            />



          </div>
        </div>

        {/* --------------------------- Day Modal --------------------------- */}
        {selectedDay && (
          <ModalShell
            onClose={() => setSelectedDayKey(null)}
            widthClass="max-w-[980px]"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  Daily breakdown
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {selectedDay.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <button
                onClick={() => setSelectedDayKey(null)}
                aria-label="Close"
                className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Net P&L</div>
                <div className={cn("mt-2 text-2xl font-semibold", dayNet >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {money(dayNet, 2)}
                </div>
                <div className="mt-2">
                  <Pill tone={dayNet >= 0 ? "good" : dayNet < 0 ? "bad" : "neutral"}>
                    {dayNet >= 0 ? "Good day" : dayNet < 0 ? "Tough day" : "Flat"}
                  </Pill>
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Win rate</div>
                <div className="mt-2 text-2xl font-semibold text-white">{dayWin.toFixed(1)}%</div>
                <div className="mt-2">
                  <Pill>{dayTrades.length} trades</Pill>
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Avg P&L / trade</div>
                <div className={cn("mt-2 text-2xl font-semibold", dayAvg >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {money(dayAvg, 2)}
                </div>
                <div className="mt-2">
                  <Pill tone={dayAvg >= 0 ? "good" : dayAvg < 0 ? "bad" : "neutral"}>
                    {dayAvg >= 0 ? "Positive expectancy" : "Negative expectancy"}
                  </Pill>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <TradesList trades={dayTrades} />
              </div>

              <JournalAIInsightCard
                title="Daily AI Insight"
                endpoint="/api/ai/journal/day"
                cacheKey={`journal:day:${selectedDay.date.toISOString().slice(0,10)}`}
                payload={{
                  date: selectedDay.date.toISOString().slice(0, 10),
                  stats: {
                    net: dayNet,
                    winRate: dayWin,
                    avgPnL: dayAvg,
                    trades: dayTrades.length
                  },
                  trades: dayTrades.map((t) => ({
                    symbol: t.symbol,
                    side: t.side,
                    pnl: t.pnl,
                    time: t.time
                  }))
                }}
              />


            </div>
          </ModalShell>
        )}


        {/* --------------------------- Week Modal -------------------------- */}
        {selectedWeek && (
          <ModalShell
            onClose={() => setSelectedWeek(null)}
            widthClass="max-w-[980px]"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  Weekly breakdown
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {selectedWeek.label}
                </div>
                <div className="mt-1 text-sm text-neutral-400">
                  {formatRangeShort(selectedWeek.start, selectedWeek.end)}
                </div>
              </div>

              <button
                onClick={() => setSelectedWeek(null)}
                aria-label="Close"
                className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Net P&L</div>
                <div className={cn("mt-2 text-2xl font-semibold", weekNet >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {money(weekNet, 2)}
                </div>
                <div className="mt-2">
                  <Pill tone={weekNet >= 0 ? "good" : weekNet < 0 ? "bad" : "neutral"}>
                    {weekNet >= 0 ? "Winning week" : weekNet < 0 ? "Losing week" : "Flat"}
                  </Pill>
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Win rate</div>
                <div className="mt-2 text-2xl font-semibold text-white">{weekWin.toFixed(1)}%</div>
                <div className="mt-2">
                  <Pill>{weekTrades.length} trades</Pill>
                </div>
              </div>

              <div className="rounded-3xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
                <div className="text-xs text-neutral-400">Avg P&L / trade</div>
                <div className={cn("mt-2 text-2xl font-semibold", weekAvg >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {money(weekAvg, 2)}
                </div>
                <div className="mt-2">
                  <Pill tone={weekAvg >= 0 ? "good" : weekAvg < 0 ? "bad" : "neutral"}>
                    {weekAvg >= 0 ? "Positive expectancy" : "Negative expectancy"}
                  </Pill>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-200">Trades this week</div>
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <TradesList trades={weekTrades} />
                </div>
              </div>

              <JournalAIInsightCard
                title="Weekly AI Insight"
                endpoint="/api/ai/journal/week"
                cacheKey={`journal:week:${selectedWeek.start.toISOString().slice(0,10)}_${selectedWeek.end.toISOString().slice(0,10)}`}
                payload={{
                  range: `${selectedWeek.start.toISOString().slice(0,10)} → ${selectedWeek.end.toISOString().slice(0,10)}`,
                  stats: {
                    net: weekNet,
                    winRate: weekWin,
                    avgPnL: weekAvg,
                    trades: weekTrades.length
                  },
                  trades: weekTrades.map(t => ({
                    symbol: t.symbol,
                    side: t.side,
                    pnl: t.pnl,
                    time: t.time
                  }))
                }}
              />


            </div>
          </ModalShell>
        )}

      </div>
    </div>
  )
}
