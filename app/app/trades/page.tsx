"use client"

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react"
import {
  X,
  Sparkles,
  Brain,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  BarChart3,
  Clock,
  DollarSign,
  Percent,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Flame,
  Focus,
  BadgeCheck,
  BadgeX,
  Minus,
  ArrowRight,
  Layers,
} from "lucide-react"

import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import { Trade } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import { computeTradeMetrics } from "@/lib/metrics/tradeMetrics"

/* -------------------------------------------------------------------------- */
/* Utils */
/* -------------------------------------------------------------------------- */

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function safeNum(n: any, fallback = 0) {
  const x = Number(n)
  return Number.isFinite(x) ? x : fallback
}

function safeR(r: number | null | undefined) {
  return typeof r === "number" && Number.isFinite(r) ? r : 0
}

function toMs(v: string | number | null | undefined) {
  if (!v) return 0
  if (typeof v === "number") return v
  const ms = new Date(v).getTime()
  return Number.isFinite(ms) ? ms : 0
}

function fmtMoney(n: number) {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  return `${sign}$${abs.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function rowTone(t: Trade) {
  if (t.outcome === "Win") return "text-emerald-400"
  if (t.outcome === "Loss") return "text-red-400"
  return "text-neutral-400"
}

function pillToneFromOutcome(outcome: Trade["outcome"]) {
  return outcome === "Win" ? "green" : outcome === "Loss" ? "red" : "neutral"
}

function iconForOutcome(outcome: Trade["outcome"]) {
  if (outcome === "Win") return <BadgeCheck className="h-4 w-4" />
  if (outcome === "Loss") return <BadgeX className="h-4 w-4" />
  return <Minus className="h-4 w-4" />
}

function normalizeSymbol(s: string) {
  return (s || "").trim().toUpperCase()
}

function startOfDayMs(ms: number) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayLabelFromMs(ms: number) {
  const d = new Date(ms)
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

function isSameDay(a: number, b: number) {
  return startOfDayMs(a) === startOfDayMs(b)
}

function avg(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((s, x) => s + x, 0) / nums.length
}

function sum(nums: number[]) {
  return nums.reduce((s, x) => s + x, 0)
}

function median(nums: number[]) {
  if (!nums.length) return 0
  const a = [...nums].sort((x, y) => x - y)
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

function profitFactor(trades: Trade[]) {
  const wins = trades.filter((t) => t.profit > 0).map((t) => t.profit)
  const losses = trades.filter((t) => t.profit < 0).map((t) => Math.abs(t.profit))
  const grossWin = sum(wins)
  const grossLoss = sum(losses)
  if (grossLoss <= 0) return grossWin > 0 ? 99 : 0
  return grossWin / grossLoss
}

function longestStreak(outcomes: Trade["outcome"][], kind: Trade["outcome"]) {
  let best = 0
  let cur = 0
  for (const o of outcomes) {
    if (o === kind) {
      cur++
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* DB Row */
/* -------------------------------------------------------------------------- */

type DbTradeRow = {
  id: string
  symbol: string | null
  side: "long" | "short" | null
  pnl: number | null
  quantity: number | null
  entry_price: number | null
  exit_price: number | null
  opened_at: string | null
  closed_at: string | null
}

/* -------------------------------------------------------------------------- */
/* Filters + Sorting Types */
/* -------------------------------------------------------------------------- */

type SortKey =
  | "newest"
  | "oldest"
  | "best_r"
  | "worst_r"
  | "best_pnl"
  | "worst_pnl"
  | "longest"
  | "shortest"

type FilterState = {
  query: string
  symbol: string
  side: "all" | "Long" | "Short"
  outcome: "all" | "Win" | "Loss" | "BE"
  session: "all" | "Asia" | "London" | "NY" | "Off-hours"
  rMin: string
  rMax: string
  fromISO: string
  toISO: string
}

/* -------------------------------------------------------------------------- */
/* Page */
/* -------------------------------------------------------------------------- */

export default function TradesPage() {
  const supabase = createClient()
  const activeAccountId = useMT5Store((s) => s.activeAccountId)
  const refreshNonce = useMT5Store((s) => s.refreshNonce)

  const [rows, setRows] = useState<DbTradeRow[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [selected, setSelected] = useState<Trade | null>(null)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("newest")
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped")

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})

  const [pageSize, setPageSize] = useState(60)

  const searchRef = useRef<HTMLInputElement | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    symbol: "",
    side: "all",
    outcome: "all",
    session: "all",
    rMin: "",
    rMax: "",
    fromISO: "",
    toISO: "",
  })

  /* ---------------------------------------------------------------------- */
  /* Guards */
  /* ---------------------------------------------------------------------- */

  if (!activeAccountId) {
    return (
      <TerminalCard title="Trades">
        <div className="text-sm text-text-muted">No MT5 account selected.</div>
      </TerminalCard>
    )
  }

  /* ---------------------------------------------------------------------- */
  /* Smooth page loading feel */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 220)
    return () => clearTimeout(t)
  }, [activeAccountId, refreshNonce])

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts: / focuses search, Esc closes panels */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        // don't hijack if typing in input already
        const tag = (document.activeElement as any)?.tagName?.toLowerCase?.()
        const isTyping = tag === "input" || tag === "textarea"
        if (!isTyping) {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape") {
        setDeepDiveOpen(false)
        setInspectorOpen(false)
        setFiltersOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  /* ---------------------------------------------------------------------- */
  /* Fetch trades (DB) */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!activeAccountId) {
        setRows([])
        return
      }

      const { data, error } = await supabase
        .from("trades")
        .select(
          "id, symbol, side, pnl, quantity, entry_price, exit_price, opened_at, closed_at"
        )
        .eq("account_id", activeAccountId)
        .order("closed_at", { ascending: false })
        .limit(2000)

      if (cancelled) return

      if (error) {
        console.error("Failed to load trades", error)
        setRows([])
      } else {
        setRows((data as DbTradeRow[]) ?? [])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase, activeAccountId, refreshNonce])

  /* ---------------------------------------------------------------------- */
  /* Map DB rows → Trade[] */
  /* ---------------------------------------------------------------------- */

  const trades: Trade[] = useMemo(() => {
    const base: Trade[] = rows.map((r) => {
      const openISO = r.opened_at ?? r.closed_at ?? new Date().toISOString()
      const closeISO = r.closed_at ?? r.opened_at ?? new Date().toISOString()

      const openMs = toMs(openISO)
      const closeMs = toMs(closeISO)

      const direction: Trade["direction"] =
        r.side === "short" ? "Short" : "Long"

      const profit = Number(r.pnl ?? 0)
      const outcome: Trade["outcome"] =
        profit > 0 ? "Win" : profit < 0 ? "Loss" : "BE"

      const entry = Number(r.entry_price ?? 0)
      const exit = Number(r.exit_price ?? 0)
      const volume = Number(r.quantity ?? 0)

      const riskUsd =
        entry && exit && volume ? Math.abs(entry - exit) * volume : 0

      const rMultiple = riskUsd > 0 ? profit / riskUsd : null

      return {
        id: r.id,
        tsISO: closeISO,
        riskUsd,
        openTime: openMs,
        closeTime: closeMs,
        metrics: {
          realisedR: safeR(rMultiple),
          durationMin: openMs && closeMs ? (closeMs - openMs) / 60000 : null,
          session: "Asia",
          isPostLoss: false,
        },
        instrument: r.symbol ?? "—",
        direction,
        entry,
        exit,
        rMultiple,
        session: "Off-hours",
        setupTag: "—",
        outcome,
        volume,
        profit,
        riskPct: null,
      }
    })

    return base.map((t, i) => ({
      ...t,
      metrics: computeTradeMetrics(t, i > 0 ? base[i - 1] : undefined),
    }))
  }, [rows])

  /* ---------------------------------------------------------------------- */
  /* Derived: symbols list, sessions list, quick stats */
  /* ---------------------------------------------------------------------- */

  const symbols = useMemo(() => {
    const set = new Set<string>()
    for (const t of trades) set.add(normalizeSymbol(t.instrument))
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [trades])

  const kpis = useMemo(() => {
    const t = trades
    const total = t.length
    const wins = t.filter((x) => x.outcome === "Win")
    const losses = t.filter((x) => x.outcome === "Loss")
    const be = t.filter((x) => x.outcome === "BE")
    const winrate = total ? wins.length / total : 0

    const rs = t.map((x) => safeR(x.rMultiple))
    const pnls = t.map((x) => safeNum(x.profit))

    const pf = profitFactor(t)
    const avgR = avg(rs)
    const medR = median(rs)
    const totalPnl = sum(pnls)

    const durations = t
      .map((x) => safeNum(x.metrics.durationMin))
      .filter((x) => x > 0)
    const avgDur = durations.length ? avg(durations) : 0

    const outcomes = t.map((x) => x.outcome)
    const bestWinStreak = longestStreak(outcomes, "Win")
    const bestLossStreak = longestStreak(outcomes, "Loss")

    return {
      total,
      wins: wins.length,
      losses: losses.length,
      be: be.length,
      winrate,
      avgR,
      medR,
      pf,
      totalPnl,
      avgDur,
      bestWinStreak,
      bestLossStreak,
    }
  }, [trades])

  /* ---------------------------------------------------------------------- */
  /* Apply filters */
  /* ---------------------------------------------------------------------- */

  const filteredTrades = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    const sym = normalizeSymbol(filters.symbol)

    const rMin = filters.rMin.trim() ? Number(filters.rMin) : null
    const rMax = filters.rMax.trim() ? Number(filters.rMax) : null

    const fromMs = filters.fromISO ? toMs(filters.fromISO) : null
    const toMs_ = filters.toISO ? toMs(filters.toISO) : null

    return trades.filter((t) => {
      if (q) {
        const hay = `${t.instrument} ${t.direction} ${t.outcome} ${t.setupTag} ${t.session}`
          .toLowerCase()
          .includes(q)
        if (!hay) return false
      }

      if (sym && normalizeSymbol(t.instrument) !== sym) return false

      if (filters.side !== "all" && t.direction !== filters.side) return false
      if (filters.outcome !== "all" && t.outcome !== filters.outcome) return false
      if (filters.session !== "all" && (t.metrics.session || t.session) !== filters.session)
        return false

      const r = safeR(t.rMultiple)
      if (rMin != null && Number.isFinite(rMin) && r < rMin) return false
      if (rMax != null && Number.isFinite(rMax) && r > rMax) return false

      const ts = toMs(t.tsISO)
      if (fromMs != null && ts < fromMs) return false
      if (toMs_ != null && ts > toMs_) return false

      return true
    })
  }, [trades, filters])

  /* ---------------------------------------------------------------------- */
  /* Sorting */
  /* ---------------------------------------------------------------------- */

  const sortedTrades = useMemo(() => {
    const arr = [...filteredTrades]
    arr.sort((a, b) => {
      const ta = toMs(a.tsISO)
      const tb = toMs(b.tsISO)
      const ra = safeR(a.rMultiple)
      const rb = safeR(b.rMultiple)
      const pa = safeNum(a.profit)
      const pb = safeNum(b.profit)
      const da = safeNum(a.metrics.durationMin)
      const db = safeNum(b.metrics.durationMin)

      switch (sortKey) {
        case "newest":
          return tb - ta
        case "oldest":
          return ta - tb
        case "best_r":
          return rb - ra
        case "worst_r":
          return ra - rb
        case "best_pnl":
          return pb - pa
        case "worst_pnl":
          return pa - pb
        case "longest":
          return db - da
        case "shortest":
          return da - db
        default:
          return tb - ta
      }
    })
    return arr
  }, [filteredTrades, sortKey])

  /* ---------------------------------------------------------------------- */
  /* Pagination slice (prevents "infinite list" feel) */
  /* ---------------------------------------------------------------------- */

  const visibleTrades = useMemo(() => {
    return sortedTrades.slice(0, clamp(pageSize, 20, 2000))
  }, [sortedTrades, pageSize])

  const canLoadMore = visibleTrades.length < sortedTrades.length

  /* ---------------------------------------------------------------------- */
  /* Grouped by day */
  /* ---------------------------------------------------------------------- */

  const groups = useMemo(() => {
    const map = new Map<string, Trade[]>()
    for (const t of visibleTrades) {
      const ms = toMs(t.tsISO)
      const key = String(startOfDayMs(ms))
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    }

    const keys = Array.from(map.keys()).sort((a, b) => Number(b) - Number(a))
    return keys.map((k) => {
      const list = map.get(k) ?? []
      const dayMs = Number(k)
      return {
        key: k,
        dayMs,
        label: dayLabelFromMs(dayMs),
        list,
      }
    })
  }, [visibleTrades])

  /* ---------------------------------------------------------------------- */
  /* Click trade → open inspector panel */
  /* ---------------------------------------------------------------------- */

  const onSelectTrade = useCallback((t: Trade) => {
    setSelected(t)
    setInspectorOpen(true)
    setDeepDiveOpen(false)
  }, [])

  /* ---------------------------------------------------------------------- */
  /* UI */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-text-muted">Journal</div>
          <h1 className="text-2xl font-semibold">Trades</h1>
          <div className="mt-1 text-sm text-text-muted">
            Clean review flow: scan → inspect → AI deep dive.
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <PillToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { key: "grouped", label: "Grouped" },
              { key: "flat", label: "Flat" },
            ]}
          />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard
          icon={<Layers className="h-4 w-4" />}
          label="Trades"
          value={kpis.total.toLocaleString()}
          sub={`${kpis.wins}W / ${kpis.losses}L / ${kpis.be}BE`}
        />
        <KpiCard
          icon={<Percent className="h-4 w-4" />}
          label="Winrate"
          value={fmtPct(kpis.winrate)}
          sub={`Best W streak: ${kpis.bestWinStreak}`}
        />
        <KpiCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg R"
          value={`${kpis.avgR.toFixed(2)}R`}
          sub={`Median: ${kpis.medR.toFixed(2)}R`}
        />
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total PnL"
          value={fmtMoney(kpis.totalPnl)}
          sub={`Profit factor: ${kpis.pf.toFixed(2)}`}
          tone={kpis.totalPnl >= 0 ? "good" : "bad"}
        />
        <KpiCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg Duration"
          value={kpis.avgDur ? `${Math.round(kpis.avgDur)}m` : "—"}
          sub={`Best L streak: ${kpis.bestLossStreak}`}
        />
        <KpiCard
          icon={<Zap className="h-4 w-4" />}
          label="Filter hits"
          value={filteredTrades.length.toLocaleString()}
          sub={`Showing ${visibleTrades.length.toLocaleString()}`}
        />
        <KpiCard
          icon={<Focus className="h-4 w-4" />}
          label="Shortcut"
          value="/"
          sub="Focus search"
        />
        <KpiCard
          icon={<Flame className="h-4 w-4" />}
          label="Vibe"
          value="Clean"
          sub="Scan → Inspect"
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-bg/70 backdrop-blur border-b border-border rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                ref={searchRef}
                value={filters.query}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, query: e.target.value }))
                }
                placeholder="Search trades… (press /)"
                className="w-full rounded-xl border border-border bg-black/30 pl-10 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-black/30 px-3 py-2">
              <ArrowUpDown className="h-4 w-4 text-text-muted" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-sm outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="best_r">Best R</option>
                <option value="worst_r">Worst R</option>
                <option value="best_pnl">Best PnL</option>
                <option value="worst_pnl">Worst PnL</option>
                <option value="longest">Longest duration</option>
                <option value="shortest">Shortest duration</option>
              </select>
            </div>

            {/* Filters */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-black/30 px-3 py-2 text-sm hover:bg-black/50 transition"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* View mode (mobile) */}
            <div className="md:hidden">
              <button
                onClick={() =>
                  setViewMode((v) => (v === "grouped" ? "flat" : "grouped"))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-black/30 px-3 py-2 text-sm hover:bg-black/50 transition"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {viewMode === "grouped" ? "Grouped" : "Flat"}
              </button>
            </div>
          </div>
        </div>

        {/* Small secondary row: quick filters chips */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip
            active={filters.side !== "all"}
            label={filters.side === "all" ? "Side: Any" : `Side: ${filters.side}`}
            onClick={() =>
              setFilters((p) => ({
                ...p,
                side: p.side === "all" ? "Long" : p.side === "Long" ? "Short" : "all",
              }))
            }
          />
          <Chip
            active={filters.outcome !== "all"}
            label={
              filters.outcome === "all" ? "Outcome: Any" : `Outcome: ${filters.outcome}`
            }
            onClick={() =>
              setFilters((p) => ({
                ...p,
                outcome:
                  p.outcome === "all"
                    ? "Win"
                    : p.outcome === "Win"
                    ? "Loss"
                    : p.outcome === "Loss"
                    ? "BE"
                    : "all",
              }))
            }
          />
          <Chip
            active={!!filters.symbol}
            label={filters.symbol ? `Symbol: ${normalizeSymbol(filters.symbol)}` : "Symbol: Any"}
            onClick={() => setFiltersOpen(true)}
          />
          <Chip
            active={!!filters.fromISO || !!filters.toISO}
            label={
              filters.fromISO || filters.toISO
                ? `Date: ${filters.fromISO ? "from" : ""}${filters.toISO ? " to" : ""}`
                : "Date: Any"
            }
            onClick={() => setFiltersOpen(true)}
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setFilters({
                  query: "",
                  symbol: "",
                  side: "all",
                  outcome: "all",
                  session: "all",
                  rMin: "",
                  rMax: "",
                  fromISO: "",
                  toISO: "",
                })
                setSortKey("newest")
                setPageSize(60)
                setCollapsedDays({})
              }}
              className="text-xs text-text-muted hover:text-white transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
        {/* Left: trades feed */}
        <div className="space-y-4">
          {loading ? (
            <TradesSkeleton />
          ) : visibleTrades.length === 0 ? (
            <EmptyState />
          ) : viewMode === "flat" ? (
            <FlatList trades={visibleTrades} onPick={onSelectTrade} />
          ) : (
            <GroupedList
              groups={groups}
              collapsed={collapsedDays}
              setCollapsed={setCollapsedDays}
              onPick={onSelectTrade}
            />
          )}

          {/* Load more */}
          {!loading && visibleTrades.length > 0 && (
            <div className="flex items-center justify-center pt-2">
              <button
                disabled={!canLoadMore}
                onClick={() => setPageSize((n) => n + 60)}
                className={cn(
                  "rounded-xl border border-border px-4 py-2 text-sm transition",
                  canLoadMore
                    ? "bg-black/30 hover:bg-black/50"
                    : "bg-black/20 text-text-muted cursor-not-allowed"
                )}
              >
                {canLoadMore ? "Load more" : "All caught up"}
              </button>
            </div>
          )}
        </div>

        {/* Right: inspector (desktop pinned) */}
        <div className="hidden xl:block">
          <InspectorDesktop
            selected={selected}
            onClose={() => {
              setSelected(null)
              setInspectorOpen(false)
              setDeepDiveOpen(false)
            }}
            onDeepDive={() => setDeepDiveOpen(true)}
          />
        </div>
      </div>

      {/* Mobile / small screens inspector drawer */}
      <InspectorDrawer
        open={inspectorOpen}
        trade={selected}
        onClose={() => {
          setInspectorOpen(false)
          setDeepDiveOpen(false)
        }}
        onDeepDive={() => setDeepDiveOpen(true)}
      />

      {/* Deep dive modal */}
      <DeepDiveModal
        open={deepDiveOpen && !!selected}
        onClose={() => setDeepDiveOpen(false)}
        trade={selected}
      />

      {/* Filters side sheet */}
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        symbols={symbols}
        filters={filters}
        setFilters={setFilters}
        sortKey={sortKey}
        setSortKey={setSortKey}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Components: Lists */
/* -------------------------------------------------------------------------- */

function FlatList({
  trades,
  onPick,
}: {
  trades: Trade[]
  onPick: (t: Trade) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
      {trades.map((t) => (
        <TradeCard key={t.id} trade={t} onClick={() => onPick(t)} />
      ))}
    </div>
  )
}

function GroupedList({
  groups,
  collapsed,
  setCollapsed,
  onPick,
}: {
  groups: { key: string; label: string; dayMs: number; list: Trade[] }[]
  collapsed: Record<string, boolean>
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onPick: (t: Trade) => void
}) {
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const isCollapsed = !!collapsed[g.key]
        const wins = g.list.filter((t) => t.outcome === "Win").length
        const losses = g.list.filter((t) => t.outcome === "Loss").length
        const totalPnl = sum(g.list.map((t) => safeNum(t.profit)))
        const avgR = avg(g.list.map((t) => safeR(t.rMultiple)))

        return (
          <div key={g.key} className="rounded-2xl border border-border bg-black/25">
            <button
              onClick={() =>
                setCollapsed((p) => ({ ...p, [g.key]: !p[g.key] }))
              }
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/20 transition rounded-2xl"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
                <div className="text-sm font-semibold">{g.label}</div>
                <div className="ml-2 text-xs text-text-muted">
                  {g.list.length} trades · {wins}W/{losses}L · {avgR.toFixed(2)}R avg
                </div>
              </div>

              <div className={cn("text-sm font-mono", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                {fmtMoney(totalPnl)}
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-3 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {g.list.map((t) => (
                    <TradeCard key={t.id} trade={t} onClick={() => onPick(t)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TradeCard({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  const r = safeR(trade.rMultiple)
  const pnl = safeNum(trade.profit)
  const duration = trade.metrics.durationMin
  const durText = duration != null ? `${Math.round(duration)}m` : "—"

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-2xl border border-border bg-black/30 p-4 transition",
        "hover:bg-black/50 hover:ring-1 hover:ring-emerald-500/20"
      )}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-violet-500/10" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">{trade.instrument}</div>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{trade.direction}</span>
          </div>

          <TagPill tone={pillToneFromOutcome(trade.outcome)}>
            {trade.outcome}
          </TagPill>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniStat label="R" value={`${r.toFixed(2)}R`} tone={rowTone(trade)} />
          <MiniStat
            label="PnL"
            value={fmtMoney(pnl)}
            tone={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <MiniStat label="Dur" value={durText} tone="text-neutral-200" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDateTime(trade.tsISO)}
          </span>
          <span className="inline-flex items-center gap-1">
            {iconForOutcome(trade.outcome)}
            <span className={cn("font-mono", rowTone(trade))}>
              {r.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-black/25 px-3 py-2">
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={cn("mt-0.5 text-sm font-mono", tone)}>{value}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Components: KPI / Chips */
/* -------------------------------------------------------------------------- */

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  tone?: "good" | "bad"
}) {
  return (
    <div className="rounded-2xl border border-border bg-black/25 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="text-text-muted">{icon}</div>
      </div>
      <div
        className={cn(
          "mt-2 text-lg font-semibold",
          tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-white"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted">{sub}</div>
    </div>
  )
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs rounded-full border px-3 py-1 transition",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-border bg-black/20 text-text-muted hover:bg-black/40 hover:text-white"
      )}
    >
      {label}
    </button>
  )
}

function PillToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { key: T; label: string }[]
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-black/25 p-1">
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition",
              active
                ? "bg-black/60 text-white ring-1 ring-emerald-500/20"
                : "text-text-muted hover:text-white"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Components: Inspector */
/* -------------------------------------------------------------------------- */

function InspectorDesktop({
  selected,
  onClose,
  onDeepDive,
}: {
  selected: Trade | null
  onClose: () => void
  onDeepDive: () => void
}) {
  return (
    <div className="sticky top-20">
      <div className="rounded-2xl border border-border bg-black/25 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black/30">
          <div>
            <div className="text-xs text-text-muted">Inspector</div>
            <div className="text-sm font-semibold">
              {selected ? `${selected.instrument} · ${selected.direction}` : "Pick a trade"}
            </div>
          </div>
          {selected && (
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-black/30 hover:bg-black/50 transition p-2"
              aria-label="Close inspector"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-4">
          {!selected ? (
            <div className="text-sm text-text-muted">
              Click any trade to inspect it here, then open the AI deep dive.
            </div>
          ) : (
            <InspectorBody trade={selected} onDeepDive={onDeepDive} />
          )}
        </div>
      </div>
    </div>
  )
}

function InspectorDrawer({
  open,
  trade,
  onClose,
  onDeepDive,
}: {
  open: boolean
  trade: Trade | null
  onClose: () => void
  onDeepDive: () => void
}) {
  if (!open || !trade) return null
  return (
    <div className="fixed inset-0 z-[70] xl:hidden">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close inspector"
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl border border-border bg-bg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black/20">
            <div>
              <div className="text-xs text-text-muted">Inspector</div>
              <div className="text-sm font-semibold">
                {trade.instrument} · {trade.direction}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-black/30 hover:bg-black/50 transition p-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <InspectorBody trade={trade} onDeepDive={onDeepDive} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InspectorBody({
  trade,
  onDeepDive,
}: {
  trade: Trade
  onDeepDive: () => void
}) {
  const r = safeR(trade.rMultiple)
  const pnl = safeNum(trade.profit)
  const dur = trade.metrics.durationMin
  const durText = dur != null ? `${Math.round(dur)} min` : "—"
  const session = trade.metrics.session || trade.session

  const score = aiScoreMock(trade)

  return (
    <div className="space-y-4">
      {/* top row */}
      <div className="grid grid-cols-3 gap-2">
        <InspectorMetric label="R" value={`${r.toFixed(2)}R`} tone={rowTone(trade)} />
        <InspectorMetric
          label="PnL"
          value={fmtMoney(pnl)}
          tone={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <InspectorMetric label="Dur" value={durText} tone="text-white" />
      </div>

      {/* execution */}
      <div className="rounded-2xl border border-border bg-black/20 p-4">
        <div className="text-xs text-text-muted">Execution</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <KV label="Entry" value={String(trade.entry)} mono />
          <KV label="Exit" value={String(trade.exit)} mono />
          <KV label="Volume" value={`${trade.volume} lots`} mono />
          <KV label="Session" value={session || "—"} />
        </div>
      </div>

      {/* AI preview */}
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
            <Sparkles className="h-4 w-4" />
            AI Preview
          </div>
          <span className="text-[10px] rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-300">
            EDGE AI
          </span>
        </div>
        <div className="mt-3">
          <ScoreBar value={score} />
        </div>
        <div className="mt-3 text-sm text-neutral-200 leading-relaxed">
          {aiOneLinerMock(trade)}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-text-muted">
            Tap deep dive for full breakdown
          </div>
          <button
            onClick={onDeepDive}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/15 transition"
          >
            <Brain className="h-4 w-4" />
            Open AI Deep Dive
          </button>
        </div>
      </div>
    </div>
  )
}

function InspectorMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-black/25 p-3">
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={cn("mt-1 font-mono text-sm", tone)}>{value}</div>
    </div>
  )
}

function KV({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={cn("mt-0.5 text-sm", mono ? "font-mono" : "")}>
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Deep Dive Modal */
/* -------------------------------------------------------------------------- */

function DeepDiveModal({
  open,
  onClose,
  trade,
}: {
  open: boolean
  onClose: () => void
  trade: Trade | null
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !trade) return null

  const r = safeR(trade.rMultiple)
  const pnl = safeNum(trade.profit)
  const session = trade.metrics.session || trade.session
  const dur = trade.metrics.durationMin
  const durText = dur != null ? `${Math.round(dur)} min` : "—"
  const score = aiScoreMock(trade)

  const flags = aiFlagsMock(trade)
  const exec = executionBreakdownMock(trade)

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close deep dive"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-bg shadow-2xl"
        >
          {/* sticky header */}
          <div className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-text-muted">AI Deep Dive</div>
              <div className="mt-0.5 text-lg font-semibold">
                {trade.instrument} · {trade.direction} ·{" "}
                <span className={cn("font-mono", rowTone(trade))}>
                  {r.toFixed(2)}R
                </span>
              </div>
              <div className="mt-1 text-sm text-text-muted">
                {fmtDateTime(trade.tsISO)} · {session} · {durText}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-black/30 hover:bg-black/50 transition p-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* top cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <InfoCard label="Outcome">
                <div className="mt-1 inline-flex">
                  <TagPill tone={pillToneFromOutcome(trade.outcome)}>
                    {trade.outcome}
                  </TagPill>
                </div>
              </InfoCard>
              <InfoCard label="PnL" tone={pnl >= 0 ? "good" : "bad"}>
                <div className={cn("mt-1 font-mono text-lg", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {fmtMoney(pnl)}
                </div>
              </InfoCard>
              <InfoCard label="R Multiple">
                <div className={cn("mt-1 font-mono text-lg", rowTone(trade))}>
                  {r.toFixed(2)}R
                </div>
              </InfoCard>
              <InfoCard label="AI Score">
                <div className="mt-2">
                  <ScoreBar value={score} />
                </div>
              </InfoCard>
            </div>

            {/* AI insight */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
                  <Sparkles className="h-4 w-4" />
                  AI Insight
                </div>
                <span className="text-[10px] rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-300">
                  EDGE AI
                </span>
              </div>

              <div className="mt-3 text-sm text-neutral-200 leading-relaxed">
                {aiParagraphMock(trade)}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <FlagCard
                  icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                  title="What you did well"
                  items={flags.good}
                />
                <FlagCard
                  icon={<Brain className="h-4 w-4 text-yellow-400" />}
                  title="Watch-outs"
                  items={flags.warn}
                />
                <FlagCard
                  icon={<TrendingDown className="h-4 w-4 text-red-400" />}
                  title="Fix next time"
                  items={flags.bad}
                />
              </div>
            </div>

            {/* Execution breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-black/25 p-5">
                <div className="text-sm font-semibold">Execution Breakdown</div>
                <div className="mt-3 space-y-3">
                  <BreakdownRow label="Timing" value={exec.timing} />
                  <BreakdownRow label="Entry quality" value={exec.entryQuality} />
                  <BreakdownRow label="Exit discipline" value={exec.exitDiscipline} />
                  <BreakdownRow label="Risk consistency" value={exec.riskConsistency} />
                </div>

                <div className="mt-4 rounded-xl border border-border bg-black/20 p-4">
                  <div className="text-xs text-text-muted">Trade facts</div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <KV label="Entry" value={String(trade.entry)} mono />
                    <KV label="Exit" value={String(trade.exit)} mono />
                    <KV label="Volume" value={`${trade.volume} lots`} mono />
                    <KV label="Risk $" value={fmtMoney(safeNum(trade.riskUsd))} mono />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-black/25 p-5">
                <div className="text-sm font-semibold">Rules & Psychology</div>

                <div className="mt-3 space-y-3">
                  <RuleRow
                    ok
                    title="No hard violations detected"
                    desc="This is currently mocked. Later we'll validate against your rules engine."
                  />
                  <RuleRow
                    ok={score >= 60}
                    title="Emotional risk"
                    desc={
                      score >= 60
                        ? "Low emotional carryover signal."
                        : "Possible post-loss carryover. Consider cooldown rules."
                    }
                  />
                  <RuleRow
                    ok={safeR(trade.rMultiple) >= 0}
                    title="Expectancy alignment"
                    desc="Trade expectancy improves when entries occur earlier after confirmation."
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-200 font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Action Plan (Auto)
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-200">
                    <li className="flex gap-2">
                      <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Add “cooldown after loss” rule (5–10 minutes)
                    </li>
                    <li className="flex gap-2">
                      <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Require “early session” tag for A+ setups
                    </li>
                    <li className="flex gap-2">
                      <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Track “late entries” as a recurring pattern
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* footer note */}
            <div className="text-xs text-text-muted">
              Deep dive content is mocked now — once your AI route is ready, plug it
              into the “aiParagraphMock / aiFlagsMock / aiScoreMock” layer.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  label,
  tone,
  children,
}: {
  label: string
  tone?: "good" | "bad"
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-black/25 p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className={cn(
          "mt-1",
          tone === "good" ? "text-emerald-200" : tone === "bad" ? "text-red-200" : ""
        )}
      >
        {children}
      </div>
    </div>
  )
}

function FlagCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-2xl border border-border bg-black/20 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-neutral-200">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-text-muted">•</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  const pct = clamp(value, 0, 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-neutral-200">{pct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-black/30 border border-border overflow-hidden">
        <div className="h-full bg-white/20" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RuleRow({
  ok,
  title,
  desc,
}: {
  ok: boolean
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", ok ? "text-emerald-400" : "text-red-400")}>
          {ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-text-muted">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ value }: { value: number }) {
  const v = clamp(Math.round(value), 0, 100)
  const label =
    v >= 85 ? "Elite" : v >= 70 ? "Strong" : v >= 55 ? "Decent" : "Needs work"

  return (
    <div className="rounded-xl border border-border bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-muted">AI Score</div>
        <div className="text-xs text-text-muted">{label}</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-black/30 border border-border overflow-hidden">
        <div className="h-full bg-violet-500/40" style={{ width: `${v}%` }} />
      </div>
      <div className="mt-1 text-right text-[10px] text-text-muted font-mono">{v}/100</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Filters Sheet */
/* -------------------------------------------------------------------------- */

function FiltersSheet({
  open,
  onClose,
  symbols,
  filters,
  setFilters,
  sortKey,
  setSortKey,
}: {
  open: boolean
  onClose: () => void
  symbols: string[]
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  sortKey: SortKey
  setSortKey: React.Dispatch<React.SetStateAction<SortKey>>
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[75]">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close filters"
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-md p-3">
        <div
          onClick={(e) => e.stopPropagation()}
          className="h-full rounded-2xl border border-border bg-bg shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border bg-black/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">Refine</div>
              <div className="text-lg font-semibold">Filters</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-black/30 hover:bg-black/50 transition p-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-5">
            {/* Sort */}
            <div className="rounded-2xl border border-border bg-black/20 p-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-text-muted" />
                Sort
              </div>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="mt-3 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="best_r">Best R</option>
                <option value="worst_r">Worst R</option>
                <option value="best_pnl">Best PnL</option>
                <option value="worst_pnl">Worst PnL</option>
                <option value="longest">Longest duration</option>
                <option value="shortest">Shortest duration</option>
              </select>
            </div>

            {/* Symbol */}
            <div className="rounded-2xl border border-border bg-black/20 p-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-text-muted" />
                Symbol
              </div>
              <select
                value={filters.symbol}
                onChange={(e) => setFilters((p) => ({ ...p, symbol: e.target.value }))}
                className="mt-3 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="">Any</option>
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Side + Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-black/20 p-4">
                <div className="text-sm font-semibold">Side</div>
                <select
                  value={filters.side}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, side: e.target.value as any }))
                  }
                  className="mt-3 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                >
                  <option value="all">Any</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div className="rounded-2xl border border-border bg-black/20 p-4">
                <div className="text-sm font-semibold">Outcome</div>
                <select
                  value={filters.outcome}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, outcome: e.target.value as any }))
                  }
                  className="mt-3 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                >
                  <option value="all">Any</option>
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                  <option value="BE">BE</option>
                </select>
              </div>
            </div>

            {/* Session */}
            <div className="rounded-2xl border border-border bg-black/20 p-4">
              <div className="text-sm font-semibold">Session</div>
              <select
                value={filters.session}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, session: e.target.value as any }))
                }
                className="mt-3 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="all">Any</option>
                <option value="Asia">Asia</option>
                <option value="London">London</option>
                <option value="NY">NY</option>
                <option value="Off-hours">Off-hours</option>
              </select>
            </div>

            {/* R range */}
            <div className="rounded-2xl border border-border bg-black/20 p-4">
              <div className="text-sm font-semibold">R Range</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-text-muted">Min R</div>
                  <input
                    value={filters.rMin}
                    onChange={(e) => setFilters((p) => ({ ...p, rMin: e.target.value }))}
                    placeholder="-1.0"
                    className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Max R</div>
                  <input
                    value={filters.rMax}
                    onChange={(e) => setFilters((p) => ({ ...p, rMax: e.target.value }))}
                    placeholder="3.0"
                    className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="rounded-2xl border border-border bg-black/20 p-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                Date range
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-text-muted">From</div>
                  <input
                    type="datetime-local"
                    value={filters.fromISO}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, fromISO: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs text-text-muted">To</div>
                  <input
                    type="datetime-local"
                    value={filters.toISO}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, toISO: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-black/10 flex items-center justify-between">
            <button
              onClick={() =>
                setFilters({
                  query: "",
                  symbol: "",
                  side: "all",
                  outcome: "all",
                  session: "all",
                  rMin: "",
                  rMax: "",
                  fromISO: "",
                  toISO: "",
                })
              }
              className="text-sm text-text-muted hover:text-white transition"
            >
              Clear
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Loading / Empty */
/* -------------------------------------------------------------------------- */

function TradesSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-black/25 p-4 animate-pulse h-20" />
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-black/25 p-4 animate-pulse h-32"
          />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-black/25 p-10 text-center">
      <div className="mx-auto inline-flex items-center justify-center h-12 w-12 rounded-2xl border border-border bg-black/30">
        <Search className="h-5 w-5 text-text-muted" />
      </div>
      <div className="mt-4 text-lg font-semibold">No trades found</div>
      <div className="mt-2 text-sm text-text-muted">
        Try loosening filters or sync your account to pull trades.
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mock AI layer (replace later with real AI call) */
/* -------------------------------------------------------------------------- */

function aiScoreMock(t: Trade) {
  const r = safeR(t.rMultiple)
  const pnl = safeNum(t.profit)
  const dur = safeNum(t.metrics.durationMin)

  // A simple deterministic-ish score based on available fields
  let score = 60
  score += clamp(r * 12, -30, 30)
  score += pnl > 0 ? 8 : pnl < 0 ? -8 : 0
  score += dur > 0 ? clamp(10 - dur / 8, -10, 10) : 0

  // mild randomness removed (deterministic)
  return clamp(Math.round(score), 0, 100)
}

function aiOneLinerMock(t: Trade) {
  const r = safeR(t.rMultiple)
  if (t.outcome === "Win" && r >= 1.2) return "High-quality execution. Press this pattern more."
  if (t.outcome === "Loss" && r <= -0.8) return "Loss looks execution-driven. Review timing and patience."
  if (t.outcome === "BE") return "Break-even: likely hesitation or management friction."
  return "Solid trade — refine entry timing for better expectancy."
}

function aiParagraphMock(t: Trade) {
  const r = safeR(t.rMultiple)
  const afterLoss = !!t.metrics.isPostLoss
  const session = t.metrics.session || t.session

  const s1 =
    r >= 1
      ? "This trade shows clean alignment and respectable follow-through."
      : r <= -1
      ? "This trade likely suffered from either late execution or weak confirmation."
      : "This trade sits in the middle — the idea may be right, execution can be sharpened."

  const s2 = afterLoss
    ? "It also appears to be taken after a prior loss, which can subtly increase impulsivity risk."
    : "Psychology signal is stable — not strongly influenced by the prior trade outcome."

  const s3 =
    session === "Asia"
      ? "If this is Asia session, ensure liquidity and volatility assumptions match the setup."
      : session === "London"
      ? "London favors structure breaks — prioritize early confirmation for max R."
      : session === "NY"
      ? "NY can punish hesitation — plan invalidation before entry."
      : "Consider tagging session precisely to improve your pattern insights."

  return `${s1} ${s2} ${s3}`
}

function aiFlagsMock(t: Trade) {
  const r = safeR(t.rMultiple)
  const score = aiScoreMock(t)

  const good: string[] = []
  const warn: string[] = []
  const bad: string[] = []

  if (t.direction === "Long") good.push("Directional clarity (long bias maintained).")
  else good.push("Directional clarity (short bias maintained).")

  if (t.outcome === "Win") good.push("Outcome confirms edge in this condition.")
  if (t.outcome === "Loss") warn.push("Outcome may reflect timing or confirmation weakness.")
  if (t.outcome === "BE") warn.push("Management / hesitation may be limiting performance.")

  if (r >= 1.5) good.push("Strong R multiple suggests good entry discipline.")
  if (r < 0 && r > -0.5) warn.push("Small loss: consider earlier invalidation (tighter plan).")
  if (r <= -1) bad.push("Large negative R: review stop placement + invalidation logic.")

  if (score < 55) bad.push("Execution score low: focus on fewer, higher-quality entries.")
  if (score >= 70) good.push("Execution score strong: keep process consistent.")

  warn.push("Tag setup precisely (A/B/C) to unlock pattern analytics later.")
  bad.push("If late entries repeat, add a rule to prevent chasing.")

  return { good, warn, bad }
}

function executionBreakdownMock(t: Trade) {
  const r = safeR(t.rMultiple)
  const pnl = safeNum(t.profit)
  const dur = safeNum(t.metrics.durationMin)

  // scores 0..100
  const timing = clamp(60 + r * 10 - dur / 2, 0, 100)
  const entryQuality = clamp(62 + r * 12, 0, 100)
  const exitDiscipline = clamp(58 + (pnl > 0 ? 10 : pnl < 0 ? -10 : 0), 0, 100)
  const riskConsistency = clamp(65 + (t.riskUsd > 0 ? 8 : -8), 0, 100)

  return {
    timing: Math.round(timing),
    entryQuality: Math.round(entryQuality),
    exitDiscipline: Math.round(exitDiscipline),
    riskConsistency: Math.round(riskConsistency),
  }
}
