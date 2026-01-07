"use client"

/**
 * ============================================================
 * JOURNAL PAGE — PART 1 / 3
 * ------------------------------------------------------------
 * Scope of this file:
 * - Imports
 * - Types
 * - Supabase client
 * - Date utilities
 * - Math / stats helpers
 * - DB → UI transformers
 * - Shared UI primitives (cn, pills, cards, skeletons)
 *
 * ❗ NO calendar UI yet
 * ❗ NO modals yet
 * ❗ NO page JSX yet
 *
 * This file COMPILES on its own when combined with Part 2 + 3
 * ============================================================
 */
import { Cell } from "recharts"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts"

import React, { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import { useMT5Store } from "@/lib/mt5Store"
import JournalAIInsightCard from "@/components/JournalAIInsightCard"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

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


function MobileKPI({
  label,
  value,
  tone = "neutral",
  pill,
}: {
  label: string
  value: React.ReactNode
  tone?: "good" | "bad" | "neutral"
  pill?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center rounded-xl px-2 py-2",
        "bg-white/[0.03]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
      )}
    >
      <div
        className={cn(
          "text-sm font-semibold leading-none",
          tone === "good" && "text-emerald-300",
          tone === "bad" && "text-red-300"
        )}
      >
        {value}
      </div>

      <div className="mt-0.5 text-[10px] text-neutral-400 truncate">
        {label}
      </div>

      {pill && (
        <div className="mt-1 scale-[0.85] origin-left">
          {pill}
        </div>
      )}
    </div>
  )
}

function TopKPI({
  icon,
  title,
  value,
  valueTone = "neutral",
  subtitle,
  pill,
}: {
  icon: React.ReactNode
  title: string
  value: React.ReactNode
  valueTone?: "good" | "bad" | "neutral"
  subtitle?: string
  pill?: React.ReactNode
}) {
  const ring =
    valueTone === "good"
      ? "shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]"
      : valueTone === "bad"
      ? "shadow-[0_0_0_1px_rgba(248,113,113,0.18)_inset]"
      : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"

  return (
    <div
      className={cn(
        "relative flex items-start justify-between gap-4 rounded-3xl",
        "bg-white/[0.03] backdrop-blur",
        "p-4",
        ring
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-2xl bg-white/[0.06] p-2">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xs text-neutral-400">{title}</div>
          <div className="mt-1 text-xl font-semibold tracking-tight">
            {value}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-neutral-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {pill && <div className="shrink-0">{pill}</div>}
    </div>
  )
}

/* ========================================================================
   TYPES
   ======================================================================== */

export type Trade = {
  id: string
  symbol: string
  side: "long" | "short"
  pnl: number
  time: string
  closedAt: Date
}

export type DayStats = {
  date: Date
  trades: Trade[]
}

export type WeekSummary = {
  label: string
  start: Date
  end: Date
  pnl: number
  trades: number
}

/* ========================================================================
   SUPABASE CLIENT
   ======================================================================== */

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ========================================================================
   DATE UTILITIES
   ======================================================================== */

export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

export function ymdKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function startOfWeekSunday(d: Date) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  x.setHours(0, 0, 0, 0)
  return x
}

export function monthGridDays(month: Date) {
  const days: Date[] = []
  let cur = startOfWeekSunday(startOfMonth(month))
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function formatMonthTitle(d: Date) {
  return d.toLocaleString("default", { month: "long", year: "numeric" })
}

export function formatRangeShort(a: Date, b: Date) {
  return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`
}

/* ========================================================================
   MONEY / STATS HELPERS
   ======================================================================== */

export function money(n: number, decimals = 0) {
  const sign = n >= 0 ? "+" : "-"
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function compactMoney(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${n < 0 ? "-" : ""}${(abs / 1_000).toFixed(1)}k`
  return `${n < 0 ? "-" : ""}${abs}`
}

export function sumPnL(trades: Trade[]) {
  return trades.reduce((a, t) => a + t.pnl, 0)
}

export function computeWinPct(trades: Trade[]) {
  if (!trades.length) return 0
  const wins = trades.filter((t) => t.pnl > 0).length
  return (wins / trades.length) * 100
}

export function computeAvg(trades: Trade[]) {
  if (!trades.length) return 0
  return sumPnL(trades) / trades.length
}

export function computeMonthKPIs(dayMap: Record<string, DayStats>) {
  const trades = Object.values(dayMap).flatMap((d) => d.trades)
  const net = sumPnL(trades)
  const winPct = computeWinPct(trades)
  const avg = computeAvg(trades)
  const wins = trades.filter((t) => t.pnl > 0).length
  const losses = trades.filter((t) => t.pnl < 0).length
  return { trades, net, winPct, avg, wins, losses }
}

/* ========================================================================
   DB → UI TRANSFORMERS
   ======================================================================== */

export function buildDayMap(rows: any[]): Record<string, DayStats> {
  const map: Record<string, DayStats> = {}

  for (const r of rows) {
    const closedAt = new Date(r.closed_at)
    const key = ymdKey(closedAt)

    if (!map[key]) {
      map[key] = {
        date: closedAt,
        trades: [],
      }
    }

    map[key].trades.push({
      id: r.id,
      symbol: r.symbol,
      side: r.side,
      pnl: Number(r.pnl),
      time: closedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      closedAt,
    })
  }

  for (const k of Object.keys(map)) {
    map[k].trades.sort(
      (a, b) => a.closedAt.getTime() - b.closedAt.getTime()
    )
  }

  return map
}

export function computeWeeks(
  month: Date,
  map: Record<string, DayStats>
): WeekSummary[] {
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

export function getTradesInRange(
  dayMap: Record<string, DayStats>,
  start: Date,
  end: Date
) {
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

/* ========================================================================
   UI PRIMITIVES
   ======================================================================== */

export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ")
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "good" | "bad" | "violet"
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]"
      : tone === "bad"
      ? "bg-red-500/10 text-red-300 shadow-[0_0_0_1px_rgba(248,113,113,0.18)_inset]"
      : tone === "violet"
      ? "bg-violet-500/10 text-violet-300 shadow-[0_0_0_1px_rgba(167,139,250,0.18)_inset]"
      : "bg-white/[0.04] text-neutral-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"

  return (
    <div className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium", cls)}>
      {children}
    </div>
  )
}

export function SoftCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/[0.035]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]",
        "backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-36 rounded bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
      <div className="h-10 w-full rounded-2xl bg-white/10" />
    </div>
  )
}

/**
 * ============================================================
 * END OF PART 1
 * ============================================================
 */
/**
 * ============================================================
 * JOURNAL PAGE — PART 2 / 3
 * ------------------------------------------------------------
 * Scope of this file:
 * - Month header (Tradezella-style)
 * - Monthly stats bar
 * - Fixed-height calendar grid (NO squishing)
 * - Desktop + mobile responsive calendar UI
 *
 * ❗ NO modals yet
 * ❗ NO page export yet
 *
 * This file ASSUMES Part 1 is pasted ABOVE it
 * ============================================================
 */

export function JournalCalendarSection({
  month,
  setMonth,
  gridDays,
  dayMap,
  pnlAbsMax,
  onSelectDay,
}: {
  month: Date
  setMonth: (d: Date) => void
  gridDays: Date[]
  dayMap: Record<string, DayStats>
  pnlAbsMax: number
  onSelectDay: (key: string) => void
}) {
  const monthNet = useMemo(() => {
    return Object.values(dayMap).reduce((acc, d) => acc + sumPnL(d.trades), 0)
  }, [dayMap])

  const activeDays = useMemo(() => Object.keys(dayMap).length, [dayMap])

  return (
    <SoftCard className="p-3 sm:p-3">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            className="rounded-xl p-2 bg-white/[0.05] hover:bg-white/[0.08]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-lg sm:text-xl font-semibold">
            {formatMonthTitle(month)}
          </div>

          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            className="rounded-xl p-2 bg-white/[0.05] hover:bg-white/[0.08]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Pill tone={monthNet >= 0 ? "good" : "bad"}>
            Monthly Stats: {compactMoney(monthNet)}
          </Pill>
          <Pill>{activeDays} Days</Pill>
        </div>
      </div>

      {/* ================= WEEKDAYS ================= */}
      <div className="grid grid-cols-7 mb-1 text-[11px] text-neutral-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-1 text-center">
            {d}
          </div>
        ))}
      </div>

      {/* ================= CALENDAR GRID ================= */}
      <div className="grid grid-cols-7 gap-[4px] sm:gap-[6px]">
        {gridDays.map((d) => {
          const key = ymdKey(d)
          const data = dayMap[key]
          const pnl = data ? sumPnL(data.trades) : null
          const trades = data?.trades.length ?? 0
          const inMonth = isSameMonth(d, month)

          const intensity =
            pnl === null ? 0 : Math.min(1, Math.abs(pnl) / pnlAbsMax)

const bg =
  pnl === null
    ? "bg-white/[0.02]"
    : pnl >= 0
    ? "bg-emerald-500/10"
    : "bg-red-500/10"

const ring =
  pnl === null
    ? "border border-white/[0.06]"
    : pnl >= 0
    ? "border border-emerald-400/50"
    : "border border-red-400/50"



          return (
<button
  key={key}
  onClick={() => onSelectDay(key)}
  className={cn(
    "relative flex flex-col justify-between",
    "h-[64px] sm:h-[96px]",
    "rounded-xl px-1.5 py-1 sm:px-2 sm:py-2",
    "transition active:scale-[0.97]",
    bg,
    ring,
    inMonth ? "opacity-100" : "opacity-30"
  )}
>

              {/* DATE */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-[11px] font-medium">
                  {d.getDate()}
                </span>
                {trades > 0 && (
                  <span className="text-[10px] text-neutral-400">
                    {trades}
                  </span>
                )}
              </div>

              {/* PNL */}
              <div className="mt-auto">
                <div
                  className={cn(
                    // 👇 responsive font sizing instead of truncation
                    "font-semibold tabular-nums",
                    "text-[9px] sm:text-[13px]",
                    "leading-[1.0]",
                    pnl === null
                      ? "opacity-0"
                      : pnl >= 0
                      ? "text-emerald-300"
                      : "text-red-300"
                  )}
                >
                  {pnl !== null ? `$${compactMoney(pnl)}` : "—"}
                </div>


                <div
                  className={cn(
                    "text-[9px] sm:text-[10px] text-neutral-400 leading-[1]",
                    trades === 0 && "opacity-0"
                  )}
                >
                  {trades} {trades === 1 ? "trade" : "trades"}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </SoftCard>
  )
}

/**
 * ============================================================
 * END OF PART 2
 * ============================================================
 */
/**
 * ============================================================
 * JOURNAL PAGE — PART 3 / 3
 * ------------------------------------------------------------
 * Scope of this file:
 * - Weekly rail (click week → modal)
 * - Day modal + Week modal (scrollable trades)
 * - Trades list UI
 * - Full JournalPage export (assembled)
 *
 * This file ASSUMES Part 1 + Part 2 are pasted ABOVE it
 * ============================================================
 */

/* ========================================================================
   SMALL UI PIECES (LISTS / MODALS)
   ======================================================================== */

function TradesList({ trades }: { trades: Trade[] }) {
  return (
    <div className="space-y-2">
      {trades.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl px-3 py-2",
            "bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]"
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="truncate text-sm font-medium text-neutral-200">
                {t.symbol}
              </div>
              <Pill tone={t.side === "long" ? "good" : "bad"}>
                {t.side.toUpperCase()}
              </Pill>
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-400">{t.time}</div>
          </div>

          <div
            className={cn(
              "shrink-0 text-sm font-semibold tabular-nums",
              t.pnl >= 0 ? "text-emerald-300" : "text-red-300"
            )}
          >
            {money(t.pnl, 2)}
          </div>
        </div>
      ))}

      {!trades.length ? (
        <div className="rounded-2xl bg-white/[0.03] p-4 text-sm text-neutral-400 shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]">
          No trades found.
        </div>
      ) : null}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: React.ReactNode
  tone?: "neutral" | "good" | "bad"
}) {
  const ring =
    tone === "good"
      ? "shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]"
      : tone === "bad"
      ? "shadow-[0_0_0_1px_rgba(248,113,113,0.18)_inset]"
      : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"

  return (
    <div className={cn("rounded-2xl bg-white/[0.03] p-3", ring)}>
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-[980px]",
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  widthClass?: string
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center px-3 sm:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/65 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Card */}
        <motion.div
          onMouseDown={(e) => e.stopPropagation()}
          initial={{ y: 14, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "relative w-full overflow-hidden rounded-3xl bg-[#0b0b0b]/95 text-white",
            "shadow-2xl shadow-black/60",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.10)_inset]",
            widthClass
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold tracking-tight">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-neutral-400">{subtitle}</div>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition"
              aria-label="Close"
            >
              Close
            </button>
          </div>

          {/* Scrollable container */}
          <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-5">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ========================================================================
   WEEKLY RAIL (RIGHT SIDE)
   ======================================================================== */

function WeeklyRail({
  month,
  weeks,
  monthNet,
  loading,
  activeAccountId,
  onSelectWeek,
}: {
  month: Date
  weeks: WeekSummary[]
  monthNet: number
  loading: boolean
  activeAccountId: string | null
  onSelectWeek: (w: WeekSummary) => void
}) {
  return (
    <div className="space-y-4">
      <SoftCard className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-200">
              Weekly snapshots
            </div>
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
              const mag = Math.min(
                1,
                Math.abs(w.pnl) / Math.max(1, Math.abs(monthNet || 1))
              )
              return (
                <button
                  key={`${w.label}-${w.start.toISOString()}`}
                  onClick={() => onSelectWeek(w)}
                  className={cn(
                    "w-full text-left rounded-3xl p-4 transition",
                    "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]",
                    "hover:bg-white/[0.04] active:scale-[0.99]",
                    positive ? "bg-emerald-500/7" : "bg-red-500/7"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-neutral-200">
                          {w.label}
                        </div>
                        <Pill tone={positive ? "good" : "bad"}>
                          {positive ? "Profit" : "Loss"}
                        </Pill>
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {formatRangeShort(w.start, w.end)}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        positive ? "text-emerald-300" : "text-red-300"
                      )}
                    >
                      {money(w.pnl, 0)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                    <span>{w.trades} trades</span>
                    <span
  className={cn(
    "flex items-center gap-1 text-xs font-medium",
    positive ? "text-emerald-400" : "text-red-400"
  )}
>
  {positive ? (
    <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
  ) : (
    <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
  )}
  {Math.round(mag * 100)}%
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
    </div>
  )
}

/* ========================================================================
   PAGE (ASSEMBLED)
   ======================================================================== */
type PnLTrackerProps = {
  dayMap: Record<string, DayStats>
}
function PnLTracker({ dayMap }: PnLTrackerProps) {
  const activeAccountId = useMT5Store((s) => s.activeAccountId)
const accounts = useMT5Store((s) => s.accounts)

const account = accounts.find(a => a.id === activeAccountId)
const accountSize = account?.accountSize ?? 0

  const data = Object.values(dayMap)
    .map((d) => {
      const pnl = d.trades.reduce((a, t) => a + t.pnl, 0)
      return {
        date: d.date.toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
        pnl,
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const profit = data.filter(d => d.pnl > 0).reduce((a, b) => a + b.pnl, 0)
  const loss = data.filter(d => d.pnl < 0).reduce((a, b) => a + b.pnl, 0)
  const net = profit + loss

 
  const effectiveAccountSize =
    accountSize || account?.balance || account?.equity || 0

  const performancePct =
    effectiveAccountSize > 0 ? (net / effectiveAccountSize) * 100 : 0

  return (
    <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white/70">
            Profit / Loss
          </div>
          <div className="mt-1 text-2xl font-semibold text-white/70">
            {net.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USD
          </div>
        </div>

        <div
  className={cn(
    "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
    performancePct >= 0
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-red-500/15 text-red-400"
  )}
>
  {performancePct >= 0 ? (
    <ArrowUpRight className="h-4 w-4" />
  ) : (
    <ArrowDownRight className="h-4 w-4" />
  )}

  {performancePct.toFixed(2)}%
</div>

      </div>

      {/* Chart */}
      

      <div className="h-[220px] w-full pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
  data={data}
  barCategoryGap="55%"
  barGap={2}

>

            <CartesianGrid
  stroke="#374151"       // gray-700
  strokeOpacity={0.25}
  vertical={false}
/>


            <XAxis
  dataKey="date"
  tick={{ fontSize: 11, fill: "#9ca3af" }}   // gray-400
  axisLine={false}
  tickLine={false}
/>

            <YAxis
  domain={[
    (min: number) => Math.min(min, 0),
    (max: number) => Math.max(max, 0),
  ]}
  tick={{ fontSize: 11, fill: "#9ca3af" }}
  axisLine={false}
  tickLine={false}
/>



            <ReferenceLine
  y={0}
  stroke="#6b7280"        // gray-500
  strokeOpacity={0.8}
  strokeWidth={1}
/>







<Bar
  dataKey="pnl"
  barSize={6}          // 👈 THIN bars (key)
  minPointSize={3}
  radius={[2, 2, 2, 2]}
  isAnimationActive={false}
  activeBar={false}
>
  {data.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={entry.pnl >= 0 ? "#22c55e" : "#1f2937"}
    />
  ))}
</Bar>



          </BarChart>
        </ResponsiveContainer>
      </div>
      

      {/* Legend */}
      <div className="mt-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-neutral-600">
            Profit{" "}
            <span className="font-medium text-white/70">
              +{compactMoney(profit)} USD
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-800" />
          <span className="text-neutral-600">
            Loss{" "}
            <span className="font-medium text-white/70">
              {compactMoney(loss)} USD
            </span>
          </span>
        </div>
      </div>
    </div>
    
  )
}

export default function JournalPage() {
  const activeAccountId = useMT5Store((s) => s.activeAccountId)
  const refreshNonce = useMT5Store((s) => s.refreshNonce)

  const [month, setMonth] = useState(new Date())
  const [dayMap, setDayMap] = useState<Record<string, DayStats>>({})
  const [loading, setLoading] = useState(false)

  // Modals
    const account = useMT5Store((s) =>
    s.accounts.find(a => a.id === activeAccountId)
  )
  const monthKPIs = useMemo(() => computeMonthKPIs(dayMap), [dayMap])
  
  const accountSize = account?.accountSize ?? 0
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<WeekSummary | null>(null)
    const performancePct =
    accountSize > 0
      ? (monthKPIs.net / accountSize) * 100
      : 0

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
        losses: monthKPIs.losses,
      },
      dailyPnL: Object.values(dayMap).map((d: DayStats) => ({
        date: d.date.toISOString().slice(0, 10),
        pnl: sumPnL(d.trades),
        trades: d.trades.length,
      })),
    }
  }, [month, monthKPIs, dayMap, activeAccountId])

  const pnlAbsMax = useMemo(() => {
    const vals = Object.values(dayMap).map((d) => Math.abs(sumPnL(d.trades)))
    return Math.max(1, ...vals)
  }, [dayMap])

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



  /* ======================================================================
     RENDER
     ====================================================================== */

return (
  <div className="min-h-screen bg-neutral-950 text-white">
    {/* Subtle background */}
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
        <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

    {/* PAGE CONTAINER */}
    <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 py-6">

      {/* ================= MASTER GRID ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">

        {/* ================= HEADER (FULL WIDTH) ================= */}
        <SoftCard className="col-span-full px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-neutral-300">
              <CalendarDays className="h-4 w-4" />
              <div className="text-sm font-semibold">Journal</div>
              <span className="text-xs text-neutral-600">•</span>
              <div className="text-sm text-neutral-400">
                {formatMonthTitle(month)}
              </div>
              {loading && <Pill>Syncing…</Pill>}
              {!activeAccountId && <Pill tone="bad">No account selected</Pill>}
            </div>

            <button
              onClick={() => setMonth(new Date())}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium",
                "bg-emerald-500/10 text-emerald-300",
                "shadow-[0_0_0_1px_rgba(52,211,153,0.18)_inset]",
                "hover:bg-emerald-500/14 transition"
              )}
            >
              Today
            </button>
          </div>
        </SoftCard>

        {/* ================= KPI ROW (FULL WIDTH) ================= */}
        <div className="hidden sm:grid col-span-full grid-cols-2 xl:grid-cols-4 gap-3">
          <TopKPI
            icon={<Activity className="h-5 w-5 text-red-300" />}
            title="Net P&L"
            value={<span className="text-red-300">{money(monthKPIs.net, 2)}</span>}
            valueTone="bad"
            subtitle="Equity trending down"
            pill={<Pill tone="bad">{monthKPIs.wins}W / {monthKPIs.losses}L</Pill>}
          />

          <TopKPI
            icon={<Percent className="h-5 w-5 text-neutral-200" />}
            title="Win rate"
            value={`${monthKPIs.winPct.toFixed(1)}%`}
            subtitle={`${monthKPIs.trades.length} trades`}
            pill={<Pill>0% Consistency</Pill>}
          />

          <TopKPI
            icon={<Target className="h-5 w-5 text-neutral-200" />}
            title="Trades"
            value={monthKPIs.trades.length}
            subtitle="Executed this month"
            pill={<Pill>Avg {Math.round(monthKPIs.trades.length / 4)} / Week</Pill>}
          />

          <TopKPI
            icon={<TrendingDown className="h-5 w-5 text-red-300" />}
            title="Avg P&L / trade"
            value={<span className="text-red-300">{money(monthKPIs.avg, 2)}</span>}
            valueTone="bad"
            subtitle="Expectancy snapshot"
            pill={<Pill tone="bad">Negative Edge</Pill>}
          />
        </div>

        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-3">
          {/* MOBILE KPI STRIP */}
          <div className="grid grid-cols-4 gap-2 sm:hidden">
            <MobileKPI label="Net P&L" value={money(monthKPIs.net, 0)} />
            <MobileKPI label="Win rate" value={`${monthKPIs.winPct.toFixed(0)}%`} />
            <MobileKPI label="Trades" value={monthKPIs.trades.length} />
            <MobileKPI label="Avg / trade" value={money(monthKPIs.avg, 0)} />
          </div>

          <JournalCalendarSection
            month={month}
            setMonth={setMonth}
            gridDays={gridDays}
            dayMap={dayMap}
            pnlAbsMax={pnlAbsMax}
            onSelectDay={setSelectedDayKey}
          />

          <PnLTracker dayMap={dayMap} />
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-3">
          <WeeklyRail
            month={month}
            weeks={weeks}
            monthNet={monthKPIs.net}
            loading={loading}
            activeAccountId={activeAccountId}
            onSelectWeek={setSelectedWeek}
          />

          <JournalAIInsightCard
            endpoint="/api/ai/journal/month"
            payload={monthAIPayload}
            disabled={!monthAIPayload || loading}
            cacheKey={`journal:month:${activeAccountId}:${month.getFullYear()}-${month.getMonth() + 1}`}
          />
        </div>

      </div>
    </div>

    {/* ===== MODALS (UNCHANGED, OUTSIDE GRID) ===== */}
        {/* ===================== DAY MODAL ===================== */}
        {selectedDay && (
          <ModalShell
            title={selectedDay.date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            subtitle="Daily breakdown"
            onClose={() => setSelectedDayKey(null)}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MiniStat
                label="Net P&L"
                tone={dayNet >= 0 ? "good" : dayNet < 0 ? "bad" : "neutral"}
                value={
                  <span className={dayNet >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {money(dayNet, 2)}
                  </span>
                }
              />
              <MiniStat label="Win rate" value={<span>{dayWin.toFixed(1)}%</span>} />
              <MiniStat
                label="Avg / trade"
                tone={dayAvg >= 0 ? "good" : "bad"}
                value={
                  <span className={dayAvg >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {money(dayAvg, 2)}
                  </span>
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
              {/* Trades list scrollable */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-200">Trades</div>
                  <Pill>{dayTrades.length} total</Pill>
                </div>

                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <TradesList trades={dayTrades} />
                </div>
              </div>

              <JournalAIInsightCard
                title="Daily AI Insight"
                endpoint="/api/ai/journal/day"
                cacheKey={`journal:day:${selectedDay.date.toISOString().slice(0, 10)}`}
                payload={{
                  date: selectedDay.date.toISOString().slice(0, 10),
                  stats: {
                    net: dayNet,
                    winRate: dayWin,
                    avgPnL: dayAvg,
                    trades: dayTrades.length,
                  },
                  trades: dayTrades.map((t) => ({
                    symbol: t.symbol,
                    side: t.side,
                    pnl: t.pnl,
                    time: t.time,
                  })),
                }}
              />
            </div>
          </ModalShell>
        )}

        {/* ===================== WEEK MODAL ===================== */}
        {selectedWeek && (
          <ModalShell
            title={selectedWeek.label}
            subtitle={formatRangeShort(selectedWeek.start, selectedWeek.end)}
            onClose={() => setSelectedWeek(null)}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MiniStat
                label="Net P&L"
                tone={weekNet >= 0 ? "good" : weekNet < 0 ? "bad" : "neutral"}
                value={
                  <span className={weekNet >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {money(weekNet, 2)}
                  </span>
                }
              />
              <MiniStat label="Win rate" value={<span>{weekWin.toFixed(1)}%</span>} />
              <MiniStat
                label="Avg / trade"
                tone={weekAvg >= 0 ? "good" : "bad"}
                value={
                  <span className={weekAvg >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {money(weekAvg, 2)}
                  </span>
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-200">Trades this week</div>
                  <Pill>{weekTrades.length} total</Pill>
                </div>

                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <TradesList trades={weekTrades} />
                </div>
              </div>

              <JournalAIInsightCard
                title="Weekly AI Insight"
                endpoint="/api/ai/journal/week"
                cacheKey={`journal:week:${selectedWeek.start.toISOString().slice(0, 10)}_${selectedWeek.end
                  .toISOString()
                  .slice(0, 10)}`}
                payload={{
                  range: `${selectedWeek.start.toISOString().slice(0, 10)} → ${selectedWeek.end
                    .toISOString()
                    .slice(0, 10)}`,
                  stats: {
                    net: weekNet,
                    winRate: weekWin,
                    avgPnL: weekAvg,
                    trades: weekTrades.length,
                  },
                  trades: weekTrades.map((t) => ({
                    symbol: t.symbol,
                    side: t.side,
                    pnl: t.pnl,
                    time: t.time,
                  })),
                }}
              />
            </div>
          </ModalShell>
        )}
      </div>

  )
}

/**
 * ============================================================
 * END OF PART 3
 * ============================================================
 */
