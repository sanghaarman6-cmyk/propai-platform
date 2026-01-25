"use client"

import { useTradeRiskStore } from "@/lib/stores/useTradeRiskStore"
import React, { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronDown,
  Check,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Zap,
  Info,
  Search,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Impact = "Low" | "Medium" | "High" | "None"

type EconEvent = {
  id: string
  title: string
  country?: string
  currency: string
  impact: Impact
  datetimeISO: string
  forecast?: string
  previous?: string
  actual?: string
  note?: string
  affectedSymbols: string[]
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })
}

function pad2(n: number) {
  return n.toString().padStart(2, "0")
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return "LIVE"
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function isFutureDataUnavailable(events: EconEvent[]) {
  // If we have ANY event dated after today, future data exists
  const now = new Date()
  return !events.some(e => new Date(e.datetimeISO) > now)
}

function hoursUntilFFRelease() {
  const now = new Date()

  // New York time
  const nyNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  )

  const release = new Date(nyNow)
  release.setDate(release.getDate() + ((7 - release.getDay()) % 7))
  release.setHours(24, 0, 0, 0)

  const diffMs = release.getTime() - nyNow.getTime()
  if (diffMs <= 0) return 0

  return Math.ceil(diffMs / 1000 / 60 / 60)
}


function impactBadge(impact: Impact) {
  if (impact === "High")
    return {
      wrap: "border-red-500/30 bg-red-500/10 text-red-200",
      dot: "bg-red-500",
      icon: Flame,
      label: "High",
    }
  if (impact === "Medium")
    return {
      wrap: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      dot: "bg-amber-400",
      icon: Zap,
      label: "Medium",
    }
  if (impact === "Low")
    return {
      wrap: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      dot: "bg-emerald-400",
      icon: Info,
      label: "Low",
    }
  return {
    wrap: "border-white/10 bg-white/5 text-zinc-400",
    dot: "bg-zinc-500",
    icon: Info,
    label: "Non-economic",
  }
}
function currenciesForSymbol(symbol: string): string[] {
  // FX pairs
  if (symbol.length === 6) {
    return [symbol.slice(0, 3), symbol.slice(3)]
  }

  // Indices
  if (["US30", "US100", "US500"].includes(symbol)) {
    return ["USD"]
  }

  if (symbol === "GER40") return ["EUR"]
  if (symbol === "UK100") return ["GBP"]
  if (symbol === "JP225") return ["JPY"]

  // Metals
  if (symbol === "XAUUSD" || symbol === "XAGUSD") return ["USD"]

  // Crypto
  if (symbol.endsWith("USD")) return ["USD"]

  return []
}

/* -------------------------------------------------------------------------- */
/*                              Main Page                                     */
/* -------------------------------------------------------------------------- */

export default function NewsCalendarPage() {
  const [events, setEvents] = useState<EconEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [symbolsOpen, setSymbolsOpen] = useState(false)
  const setCanTrade = useTradeRiskStore((s) => s.setCanTrade)
  const futureDataUnavailable = useMemo(() => {
    return isFutureDataUnavailable(events)
  }, [events])
  const ffCountdownHours = useMemo(hoursUntilFFRelease, [])
  const [showFFWarning, setShowFFWarning] = useState(false)

  // setCanTrade effect moved below where `status` is declared


  // Primary interaction
const SYMBOL_GROUPS = {
  Forex: {
    color: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    symbols: [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "USDCHF",
      "AUDUSD",
      "NZDUSD",
      "USDCAD",
      "EURGBP",
      "EURJPY",
      "GBPJPY",
      "AUDJPY",
    ],
  },
  Metals: {
    color: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    symbols: ["XAUUSD", "XAGUSD"],
  },
  Indices: {
    color: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    symbols: ["US30", "US100", "US500", "GER40", "UK100", "JP225"],
  },
  Crypto: {
    color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    symbols: ["BTCUSD"],
  },
}


  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD")
  useEffect(() => {
    const saved = localStorage.getItem("pg:selectedSymbol")
    if (saved) setSelectedSymbol(saved)
  }, [])


  // Inline expanding filter container
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hideNonEconomic, setHideNonEconomic] = useState(true)
  const [impactFilter, setImpactFilter] = useState<Impact[]>(["High", "Medium", "Low"])
  const [q, setQ] = useState("")

  // Time scope: “today decision engine”
  const [scope, setScope] = useState<"yesterday" | "today" | "tomorrow">("today")


  /* ---------------------------- Live Clock ---------------------------- */

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  /* ----------------------------- Fetch News ----------------------------- */

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        setLoading(true)
        console.log("📡 FETCHING NEWS…")

        const res = await fetch("/api/news/forexfactory?holidays=1")
        const json = await res.json()

        console.log("📦 FETCH RESULT:", json)

        if (!alive) return
        setEvents(Array.isArray(json.events) ? json.events : [])
      } catch (e) {
        console.error("❌ FETCH FAILED", e)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    console.log("🟢 EVENTS UPDATED:", events.length)
    if (events.length > 0) {
      console.log("🟢 FIRST EVENT:", events[0])
    }
  }, [events])


  /* --------------------------- Derived Date Range ------------------------ */

  const { dayFrom, dayTo, dayLabel } = useMemo(() => {
    const base = new Date()
    let target = base

    if (scope === "tomorrow") target = new Date(base.getTime() + 86400000)
    if (scope === "yesterday") target = new Date(base.getTime() - 86400000)

    return {
      dayFrom: startOfDay(target),
      dayTo: endOfDay(target),
      dayLabel:
        scope === "today"
          ? `Today · ${formatDayLabel(target)}`
          : scope === "tomorrow"
          ? `Tomorrow · ${formatDayLabel(target)}`
          : `Yesterday · ${formatDayLabel(target)}`,
    }
  }, [scope])

/* ---------------------- Weekly High-Impact Overview ---------------------- */
const debugHighs = events.filter(e => e.impact === "High")
console.log("EVENTS LENGTH (before weekly):", events.length)

const [weeklyHighImpact, setWeeklyHighImpact] = useState<
  { date: Date; count: number }[]
>([])

useEffect(() => {
  if (events.length === 0) return

  console.log("RECALCULATING WEEKLY STRIP WITH EVENTS:", events.length)

  const startOfISOWeek = (d: Date) => {
    const date = new Date(d)
    const day = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() - day + 1)
    date.setUTCHours(0, 0, 0, 0)
    return date
  }

  const monday = startOfISOWeek(new Date())

  const base = selectedSymbol.slice(0, 3)
  const quote = selectedSymbol.slice(3)

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)

    const from = startOfDay(d)
    const to = endOfDay(d)

    const count = events.filter((e) => {
      const dt = new Date(e.datetimeISO)
      if (dt < from || dt > to) return false
      if (e.impact !== "High") return false

      return (
        e.currency === base ||
        e.currency === quote ||
        selectedSymbol.startsWith(e.currency) ||
        selectedSymbol.endsWith(e.currency)
      )
    }).length

    return { date: d, count }
  })

  console.log("WEEKLY STRIP COUNTS:", days)
  setWeeklyHighImpact(days)
}, [events, selectedSymbol])



  /* ----------------------- Filter: relevant to symbol -------------------- */

  const todayEventsForSymbol = useMemo(() => {
    const qlc = q.trim().toLowerCase()

    return events
      .filter((e) => {
        const dt = new Date(e.datetimeISO)
        if (dt < dayFrom || dt > dayTo) return false

        // symbol relevance
        if (!e.affectedSymbols?.includes(selectedSymbol)) return false

        // non-economic toggle
        if (hideNonEconomic && e.impact === "None") return false

        // impact filter
        if (!impactFilter.includes(e.impact)) return false

        // search
        if (qlc) {
          const hay = `${e.title} ${e.currency} ${e.country ?? ""} ${e.impact} ${e.affectedSymbols?.join(" ") ?? ""}`.toLowerCase()
          if (!hay.includes(qlc)) return false
        }

        return true
      })
      .sort((a, b) => new Date(a.datetimeISO).getTime() - new Date(b.datetimeISO).getTime())
  }, [events, dayFrom, dayTo, selectedSymbol, hideNonEconomic, impactFilter, q])

  /* -------------------------- Trade Decision ---------------------------- */

  const hasUpcomingHighImpact = useMemo(
    () =>
      todayEventsForSymbol.some((e) => {
        const dt = new Date(e.datetimeISO)
        return e.impact === "High" && dt.getTime() > now
      }),
    [todayEventsForSymbol, now]
  )

  const hasMediumImpact = useMemo(() => todayEventsForSymbol.some((e) => e.impact === "Medium"), [todayEventsForSymbol])

  const status =
    scope === "yesterday"
      ? "ALLOWED"
      : hasUpcomingHighImpact
      ? "BLOCKED"
      : "ALLOWED"


  useEffect(() => {
    setCanTrade(status === "ALLOWED")
  }, [status, setCanTrade])


  const nextUpcoming = useMemo(() => {
    // next event for this symbol (can be today/tomorrow based on scope)
    const upcoming = todayEventsForSymbol
      .map((e) => ({ e, dt: new Date(e.datetimeISO) }))
      .filter(({ dt }) => dt.getTime() >= now)
      .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0]
    return upcoming ?? null
  }, [todayEventsForSymbol, now])

  const nextCountdown = useMemo(() => {
    if (!nextUpcoming) return null
    const seconds = Math.floor((nextUpcoming.dt.getTime() - now) / 1000)
    // show DONE if it passed by > 5 minutes
    if (seconds < -300) return "DONE"
    return formatCountdown(seconds)
  }, [nextUpcoming, now])

  /* ------------------------------ Loading ------------------------------- */
function AnalyticsPageLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
        <div className="text-sm text-neutral-400 tracking-wide">

        </div>
      </div>
    </div>
  )
}


  /* ---------------------------------------------------------------------- */
  /*                                 Render                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen text-zinc-100">
      
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {loading && <AnalyticsPageLoading />}
        {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Trade Risk (News)</div>
              <div className="text-xs text-zinc-500">ForexFactory-powered “Can I trade today?” view</div>
            </div>
          </div>

          {/* Scope switch */}
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
              onClick={() => setScope("yesterday")}
              className={cn(
                "rounded-2xl px-3 py-1.5 text-xs transition",
                scope === "yesterday" ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Yesterday
            </button>
            <button
              onClick={() => setScope("today")}
              className={cn(
                "rounded-2xl px-3 py-1.5 text-xs transition",
                scope === "today" ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Today
            </button>
            <button
              onClick={() => {
                if (futureDataUnavailable) {
                  setShowFFWarning(true)
                  return
                }
                setScope("tomorrow")
              }}
              className={cn(
                "rounded-2xl px-3 py-1.5 text-xs transition",
                scope === "tomorrow"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Tomorrow
            </button>

          </div>
        </div>

        {/* SYMBOL SELECTOR (DROPDOWN) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
        {/* Header / collapsed bar */}
        <button
            onClick={() => setSymbolsOpen((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-3"
        >
            <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
                Active
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-sm font-semibold">
                {selectedSymbol}
            </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">Symbols</span>
            <svg
                className={`h-4 w-4 transition ${
                symbolsOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
                />
            </svg>
            </div>
        </button>

        {/* Expanded dropdown */}
        {symbolsOpen && (
            <div className="border-t border-white/10 px-4 py-3">
            <div className="space-y-3">
                {Object.entries(SYMBOL_GROUPS).map(([group, cfg]) => (
                <div key={group}>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    {group}
                    </div>

                    <div className="flex flex-wrap gap-2">
                    {cfg.symbols.map((s) => {
                        const active = s === selectedSymbol
                        return (
                        <button
                            key={s}
                            onClick={() => {
                              setSelectedSymbol(s)
                              localStorage.setItem("pg:selectedSymbol", s)
                              setSymbolsOpen(false)
                            }}
                            className={cn(
                            "rounded-xl border px-2.5 py-1 text-[11px] transition",
                            active
                                ? cfg.color
                                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                            )}
                        >
                            {s}
                        </button>
                        )
                    })}
                    </div>
                </div>
                ))}
            </div>
            </div>
        )}
        </div>



        {/* Status + Filters container */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Status Card */}
            <div
              className={cn(
                "w-full rounded-3xl border p-5",
                status === "ALLOWED"
                  ? "border-emerald-500/25 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                  : "border-red-500/25 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.12)]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-400">{dayLabel}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {status === "ALLOWED" ? "You can trade" : "Do not trade"}
                  </div>
                  <div className="mt-1 text-sm text-zinc-200">
                    {status === "ALLOWED"
                      ? hasMediumImpact
                        ? "No upcoming high-impact events. Medium impact events exist — trade with caution."
                        : "No upcoming high-impact events for this symbol."
                      : "High-impact news is still upcoming. Expect volatility + spread widening."}
                  </div>
                </div>

                <div className="shrink-0">
                  {status === "ALLOWED" ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                      <ShieldCheck className="h-4 w-4" />
                      Allowed
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                      <AlertTriangle className="h-4 w-4" />
                      Blocked
                    </div>
                  )}
                </div>
              </div>

              {/* Next event */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-zinc-500">Next relevant event</div>
                  <div className="text-xs text-zinc-500">{new Date().toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                </div>

                {!nextUpcoming ? (
                  <div className="mt-2 text-sm text-emerald-200">No upcoming events for {selectedSymbol} in this window.</div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{formatTime(nextUpcoming.dt)}</span>
                        <span className="text-xs text-zinc-500">{nextUpcoming.e.currency}</span>
                        <span className="text-sm truncate">{nextUpcoming.e.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Impact:{" "}
                        <span className="text-zinc-200">
                          {nextUpcoming.e.impact === "None" ? "Non-economic" : nextUpcoming.e.impact}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-sm font-mono",
                          nextUpcoming.e.impact === "High"
                            ? "border-red-500/25 bg-red-500/10 text-red-100"
                            : nextUpcoming.e.impact === "Medium"
                            ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                            : nextUpcoming.e.impact === "Low"
                            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                            : "border-white/10 bg-white/5 text-zinc-300"
                        )}
                      >
                        {nextCountdown ?? "--:--:--"}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">Countdown</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filters button + expanding container (like your image) */}
            <div className="w-full lg:w-[360px]">
              <button
                onClick={() => setFiltersOpen((s) => !s)}
                className="w-full inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-zinc-300 hover:border-white/20 transition"
              >
                <span>Filters</span>
                <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition", filtersOpen && "rotate-180")} />
              </button>

              <div
                className={cn(
                  "mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all",
                  filtersOpen ? "max-h-[420px] p-4" : "max-h-0 p-0 border-transparent"
                )}
              >
                {filtersOpen && (
                  <div className="space-y-4">
                    {/* Search */}
                    <div>
                      <div className="mb-2 text-xs text-zinc-500">Search</div>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="CPI, FOMC, GDP…"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/20"
                        />
                      </div>
                    </div>

                    {/* Impact toggles */}
                    <div>
                      <div className="mb-2 text-xs text-zinc-500">Impact</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["High", "Medium", "Low", "None"] as Impact[]).map((imp) => {
                          const active = impactFilter.includes(imp)
                          const meta = impactBadge(imp)
                          const Icon = meta.icon
                          return (
                            <button
                              key={imp}
                              onClick={() =>
                                setImpactFilter((prev) =>
                                  active ? prev.filter((x) => x !== imp) : [...prev, imp]
                                )
                              }
                              className={cn(
                                "flex items-center justify-between rounded-2xl border px-3 py-2 text-xs transition",
                                active ? "border-white/15 bg-white/5" : "border-white/10 bg-transparent hover:border-white/15 hover:bg-white/5"
                              )}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                                <Icon className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="text-zinc-200">{meta.label}</span>
                              </span>
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                                  active
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                    : "border-white/10 bg-white/5 text-zinc-500"
                                )}
                              >
                                {active ? <Check className="h-3.5 w-3.5" /> : null}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Hide non-economic */}
                    <button
                      onClick={() => setHideNonEconomic((s) => !s)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs"
                    >
                      <span className="text-zinc-200">Hide non-economic</span>
                      <span className={cn("h-5 w-9 rounded-full transition", hideNonEconomic ? "bg-emerald-500/60" : "bg-white/20")}>
                        <span
                          className={cn(
                            "block h-5 w-5 rounded-full bg-white transition",
                            hideNonEconomic ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </span>
                    </button>

                    <div className="text-[11px] text-zinc-500">
                      Tip: Leave non-economic hidden for a clean “trade permission” signal.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Events list */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Relevant events</div>
              <div className="text-xs text-zinc-500">
                {todayEventsForSymbol.length === 0
                  ? `No events match your filters for ${selectedSymbol}.`
                  : `Showing ${todayEventsForSymbol.length} event(s) for ${selectedSymbol}.`}
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              Window:{" "}
              <span className="text-zinc-200">
                {dayFrom.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                {scope === "tomorrow" ? "(tomorrow)" : "(today)"}
              </span>
            </div>
          </div>

          {todayEventsForSymbol.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
              </div>
              <div className="text-sm font-semibold text-zinc-100">Clear window</div>
              <div className="mt-1 text-xs text-zinc-500">
                No relevant economic events found for {selectedSymbol} in this window.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {todayEventsForSymbol.map((e) => {
                const dt = new Date(e.datetimeISO)
                const meta = impactBadge(e.impact)
                const Icon = meta.icon
                const seconds = Math.floor((dt.getTime() - now) / 1000)
                const countdown =
                  seconds < -300 ? "DONE" : seconds <= 0 ? "LIVE" : formatCountdown(seconds)

                return (
                  <div key={e.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border", meta.wrap)}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{formatTime(dt)}</span>
                            <span className="text-xs text-zinc-500">{e.currency}</span>
                            <span className={cn("inline-flex items-center gap-2 rounded-2xl border px-2.5 py-0.5 text-xs", meta.wrap)}>
                              <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-zinc-100 truncate">{e.title}</div>

                          {(e.forecast || e.previous || e.actual) && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                              {e.forecast && (
                                <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                                  Forecast: <span className="text-zinc-200">{e.forecast}</span>
                                </span>
                              )}
                              {e.previous && (
                                <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                                  Previous: <span className="text-zinc-200">{e.previous}</span>
                                </span>
                              )}
                              {e.actual && (
                                <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                                  Actual: <span className="text-zinc-200">{e.actual}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {e.note && <div className="mt-2 text-xs text-zinc-500">{e.note}</div>}
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-sm font-mono",
                            e.impact === "High"
                              ? "border-red-500/25 bg-red-500/10 text-red-100"
                              : e.impact === "Medium"
                              ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                              : e.impact === "Low"
                              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                              : "border-white/10 bg-white/5 text-zinc-300"
                          )}
                        >
                          {countdown}
                        </div>
                      </div>

                      
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* Weekly High-Impact Danger Strip */}
<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
  <div className="mb-3 flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">Weekly danger strip</div>
      <div className="text-xs text-zinc-500">
        High-impact days for {selectedSymbol}
      </div>
    </div>
  </div>

  <div className="flex gap-2">
    {weeklyHighImpact.map((d, i) => {
      const active = d.count > 0
      return (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-xl border px-2 py-3 text-center transition",
            active
              ? "border-red-500/40 bg-red-500/15 text-red-300"
              : "border-white/10 bg-white/5 text-zinc-500"
          )}
        >
          <div className="text-xs uppercase tracking-wide">
            {d.date.toLocaleDateString([], { weekday: "short" })}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {active ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-red-300",
                  d.count >= 2 && "animate-pulse"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                {d.count}
              </span>
            ) : (
              "Clear"
            )}
          </div>
        </div>
      )
    })}
  </div>

  <div className="mt-3 text-[11px] text-zinc-500">
    Only high-impact news shown
  </div>
  {showFFWarning && (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
    <div className="max-w-sm rounded-3xl border border-red-500/30 bg-neutral-950 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <h3 className="text-lg font-semibold text-red-200">
          News data not available yet
        </h3>
      </div>

      <p className="text-sm text-zinc-300">
        Apologies for now our economic calendar resources currently update around every
        <span className="text-white font-medium"> Monday 00:00 AM (New York Time)</span>.
        <br /><br />
        Until then, tomorrow’s data may be incomplete.
      </p>

      <div className="mt-4 text-sm text-zinc-400">
        Expected approximately within - {" "}
        <span className="text-emerald-400 font-semibold">
          {ffCountdownHours} Hour{ffCountdownHours === 1 ? "" : "s"}
        </span>.
      </div>

      <button
        onClick={() => {
          setShowFFWarning(false)
          setScope("today")
        }}
        className="mt-6 w-full rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 py-2 text-sm font-semibold text-red-100 transition"
      >
        Return to Today
      </button>
    </div>
  </div>
)}

</div>

      </div>
    </div>
  )
}
