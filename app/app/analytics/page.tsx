"use client"
import { useRouter } from "next/navigation"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AnalyticsAIInsightCard from "@/components/AnalyticsAIInsightCard"
import type { AnalyticsAIResponse } from "@/components/AnalyticsAIInsightCard"
import KPIGauge from "@/components/KPIGauge"
import { createPortal } from "react-dom"

import EquityDrawdownChart from "@/components/EquityDrawdownChart"
import UnderwaterChart from "@/components/UnderwaterChart"
import DrawdownDurationChart from "@/components/DrawdownDurationChart"
import RollingExpectancyChart from "@/components/RollingExpectancyChart"
import SymbolSplitChart from "@/components/SymbolSplitChart"
import { useAIInsight } from "@/lib/hooks/useAIInsight";
import md5 from "md5"



import {
  TrendingUp,
  Activity,
  BarChart3,
  Gauge,
  Percent,
  Sigma,
  Brain,
  RefreshCw,
  AlertTriangle
} from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import {
  computeAccountMetrics,
  type TradeForMetrics,
  type AccountMetrics
} from "@/lib/metrics/accountMetrics"
import { fmt2, fmtPct, fmtMoney } from "@/lib/metrics/format"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type KPI = {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}
type KPIInsightCacheEntry = {
  hash: string
  text: string
}

type KPIInsightCache = Record<string, KPIInsightCacheEntry>


/* -------------------------------------------------------------------------- */
/*                           KPI Insight Modal                                 */
/* -------------------------------------------------------------------------- */
function splitKPISections(text: string | null) {
  if (!text) return {}

  const extract = (label: string) => {
    const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z ]+:|$)`, "i")
    return text.match(regex)?.[1]?.trim()
  }

  return {
    meaning: extract("MEANING"),
    reading: extract("YOUR READING"),
    reason: extract("WHY THIS LOOKS THIS WAY"),
    action: extract("NEXT ADJUSTMENT")
  }
}

function KPIInsightModal({
  kpi,
  open,
  onClose,
  metrics,
  metricsHash,
  cache,
  setCache
}: {
  kpi: KPI | null
  open: boolean
  onClose: () => void
  metrics: AccountMetrics | null
  metricsHash: string
  cache: KPIInsightCache
  setCache: React.Dispatch<React.SetStateAction<KPIInsightCache>>
}) {


  const [aiText, setAiText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !kpi || !metrics) return;

    // If we already have cached AI for this KPI, skip fetch
    const cached = cache[kpi.label]
    if (cached && cached.hash === metricsHash) {
      setAiText(cached.text)
      return
    }



    setLoading(true);
    setAiText(null);

    fetch("/api/ai/kpi-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpi: kpi.label,
        value: kpi.value,
        metrics
      })
    })
      .then((r) => r.json())
      .then((d) => {
        setAiText(d.text);
        setCache((prev) => ({
          ...prev,
          [kpi.label]: { hash: metricsHash, text: d.text }
        }))


        localStorage.setItem(
          `analytics:kpi:${kpi.label}`,
          JSON.stringify({
            hash: metricsHash,
            text: d.text,
            ts: Date.now()
          })
        )

      })
      .catch(() => setAiText("AI insight unavailable."))
      .finally(() => setLoading(false));
  }, [open, kpi, metrics, cache, setCache]);


  if (!open || !kpi) return null

  
  if (typeof window === "undefined") return null

  
  return createPortal(
  <AnimatePresence>
    {open && (
      <div
        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="w-full max-w-3xl rounded-2xl bg-[#0f0f0f]/95 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-emerald-400">{kpi.icon}</div>
            <h3 className="text-lg font-medium text-white">
              {kpi.label}
            </h3>
          </div>

          {loading ? (
            <div className="text-sm text-white/40">
              Analyzing this metric…
            </div>
          ) : (
            (() => {
              const s = splitKPISections(aiText)

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

                  {/* LEFT — EXPLANATION */}
                  <div className="md:col-span-2 space-y-4">
                    {s.meaning && (
                      <KPISection title="What this metric measures">
                        {s.meaning}
                      </KPISection>
                    )}

                    {s.reading && (
                      <KPISection title="Your reading">
                        {s.reading}
                      </KPISection>
                    )}

                    {s.reason && (
                      <KPISection title="Why it looks this way">
                        {s.reason}
                      </KPISection>
                    )}
                  </div>

                  {/* RIGHT — GAUGE */}
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    {(() => {
                      const cfg = getKPIGaugeConfig(kpi)

                      return (
                        <KPIGauge
                          label={kpi.label}
                          value={cfg.value}
                          min={cfg.min}
                          max={cfg.max}
                          zones={cfg.zones}
                        />
                      )
                    })()}
                  </div>

                  {/* FULL WIDTH — ACTION */}
                  {s.action && (
                    <div className="md:col-span-3">
                      <KPISection highlight title="Next adjustment">
                        {s.action}
                      </KPISection>
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
)
}

/* -------------------------------------------------------------------------- */
/*                             Reusable KPI Card                               */
/* -------------------------------------------------------------------------- */

function KPICard({
  kpi,
  onClick
}: {
  kpi: KPI
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-[#111111] border border-white/5 p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="text-white/80 text-sm">{kpi.label}</div>
        <div className="text-emerald-400">{kpi.icon}</div>
      </div>

      <div className="mt-2 text-2xl font-semibold text-white">
        {kpi.value}
      </div>

      {kpi.sub && (
        <div className="mt-1 text-xs text-white/40">{kpi.sub}</div>
      )}
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Trades fetch                                     */
/* -------------------------------------------------------------------------- */


async function fetchTradesForMetrics(
  userId: string
): Promise<TradeForMetrics[]> {

  const { data: auth } = await supabase.auth.getUser()

  if (!userId) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("trades")
    .select("closed_at,pnl,symbol")
    .eq("user_id", userId)
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    closedAt: row.closed_at,
    pnl: Number(row.pnl) || 0,
    symbol: row.symbol
  }))
}

function AIInsightPlaceholder({ hint }: { hint?: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-[#111111] to-[#10493d53] border border-white/5 p-5">
      <div className="flex items-center gap-2 text-white mb-2">
        <Brain size={18} className="text-emerald-400" />
        <span className="font-medium">AI Insight (Coming Soon)</span>
      </div>

      <p className="text-sm text-white/50 leading-relaxed">
        This section will later contain AI-generated insights combining risk metrics,
        trade behavior, drawdowns, and execution quality.
        <br /><br />
        {hint ? (
          <>
            Example:
            <br />
            <span className="text-white/60">“{hint}”</span>
          </>
        ) : (
          <>
            Example:
            <br />
            “Your Sharpe and MAR ratios suggest strong risk-adjusted returns,
            but expectancy is capped by inconsistent R:R.”
          </>
        )}
      </p>
    </div>
  )
}


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



/* -------------------------------------------------------------------------- */
/*                                Page Layout                                  */
/* -------------------------------------------------------------------------- */
function splitGraphInsight(text: string | null) {
  if (!text) return {}

  const extract = (label: string) => {
    const r = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z ]+:|$)`, "i")
    return text.match(r)?.[1]?.trim()
  }

  return {
    regime: extract("REGIME"),
    equity: extract("EQUITY BEHAVIOR"),
    drawdown: extract("DRAWDOWN STRUCTURE"),
    expectancy: extract("EXPECTANCY HEALTH"),
    focus: extract("STRATEGIC FOCUS")
  }
}

export default function AnalyticsPage() {
  const [retryTick, setRetryTick] = useState(0)

  const hasHydrated = useMT5Store((s) => s.hasHydrated)
const [userId, setUserId] = useState<string | null>(null)

useEffect(() => {
  let mounted = true

  supabase.auth.getUser().then(({ data }) => {
    if (!mounted) return
    setUserId(data.user?.id ?? null)
  })

  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    setUserId(session?.user?.id ?? null)
  })

  return () => {
    mounted = false
    sub.subscription.unsubscribe()
  }
}, [])

  const router = useRouter()
  
  const [brainPing, setBrainPing] = useState(0)
  const [metrics, setMetrics] = useState<AccountMetrics | null>(null)



  const refreshNonce = useMT5Store((s) => s.refreshNonce)
  const bumpRefresh = useMT5Store((s) => s.bumpRefresh)

  const [kpiInsightCache, setKpiInsightCache] =
    useState<KPIInsightCache>({})

  


  const activeId = useMT5Store((s) => s.activeAccountId)
  const accounts = useMT5Store((s) => s.accounts)

  const [equityCurve, setEquityCurve] = useState<number[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trades, setTrades] = useState<TradeForMetrics[]>([])
  const [activeKPI, setActiveKPI] = useState<KPI | null>(null)

  const metricsHash = useMemo(() => {
    return metrics ? md5(JSON.stringify(metrics)) : ""
  }, [metrics])


    useEffect(() => {
    if (!metricsHash) return

    const nextCache: Record<string, { hash: string; text: string }> = {}



    Object.keys(localStorage)
      .filter((k) => k.startsWith("analytics:kpi:"))
      .forEach((key) => {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "")
          if (parsed.hash === metricsHash) {
            const kpiLabel = key.replace("analytics:kpi:", "")
            nextCache[kpiLabel] = parsed
          }
        } catch {}
      })

    setKpiInsightCache(nextCache)
  }, [metricsHash])


// make sure you create the hook

  const { insight: graphAIText, loading: graphAILoading, generate: runGraphAI } =
    useAIInsight(
      async (metrics: AccountMetrics) => {
        const res = await fetch("/api/ai/graph-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metrics,
            equityCurve,
            tradesCount: trades.length
          })
        })

        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Graph AI failed")
        return json.text
      },
      metrics ?? undefined,
      "analytics:graph-ai" // 👈 persistent key
    )




  const activeAccount = useMemo(() => {
    if (!activeId) return null
    return accounts.find((a: any) => a.id === activeId) ?? null
  }, [activeId, accounts])

  const baselineStart = useMemo(() => {
    const v =
      Number((activeAccount as any)?.baseline_balance ??
        (activeAccount as any)?.baselineBalance) || 0
    return v > 0 ? v : 0
  }, [activeAccount])

  const aiHint = useMemo(() => {
    if (!metrics) return undefined

    const s = metrics.performance.sharpe
    const dd = metrics.risk.max_drawdown_start
    const pf = metrics.statistics.profit_factor
    const exp = metrics.statistics.expectancy

    const parts: string[] = []
    if (s != null) parts.push(`Sharpe ${s.toFixed(2)}`)
    if (pf != null) parts.push(`PF ${pf.toFixed(2)}`)
    if (dd != null) parts.push(`Max DD ${(dd * 100).toFixed(1)}%`)
    if (exp != null) parts.push(`Expectancy ${exp.toFixed(0)}`)

    return `Current profile: ${parts.join(" · ")}. Next AI step will diagnose what drives drawdown and caps expectancy.`
  }, [metrics])

const startEquity = useMemo(() => {
  if (!activeAccount) return null

  const v =
    activeAccount.baselineBalance ??
    activeAccount.balance ??
    null

  return typeof v === "number" && v > 0 ? v : null
}, [
  activeAccount?.baselineBalance,
  activeAccount?.balance
])

useEffect(() => {
  let cancelled = false

  async function run() {
    if (!userId) return
    if (!activeAccount) return

    const startEquity =
      activeAccount.baselineBalance ??
      activeAccount.balance ??
      null

    if (!startEquity || startEquity <= 0) return

    setLoading(true)

    try {
      const trades = await fetchTradesForMetrics(userId)

      const equity: number[] = [startEquity]
      for (const t of trades) {
        equity.push(equity[equity.length - 1] + t.pnl)
      }

      const computed = computeAccountMetrics({
        trades,
        startEquity,
      })

      if (!cancelled) {
        setTrades(trades)
        setEquityCurve(equity)
        setMetrics(computed)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  run()
  return () => {
    cancelled = true
  }
}, [
  userId,
  hasHydrated,
  activeAccount?.id,
  activeAccount?.baselineBalance,
  activeAccount?.balance,
  refreshNonce,
  accounts.length

])

  const [aiData, setAiData] = useState<AnalyticsAIResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function runAI() {
    if (!metrics) return
    setAiLoading(true)
    setAiError(null)

    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics,
          trade_count: trades.length,
          baseline_balance: baselineStart
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "AI failed")

      setAiData(json)
    } catch (e: any) {
      setAiError(e?.message ?? "AI failed")
    } finally {
      setAiLoading(false)
    }
  }




  /* ------------------------------- KPIs ----------------------------------- */

  const performanceKPIs: KPI[] = useMemo(() => {
    return [
      {
        label: "Sharpe Ratio",
        value: metrics ? fmt2(metrics.performance.sharpe) : "—",
        sub: "Mean return / volatility",
        icon: <Activity size={18} />
      },
      {
        label: "Sortino Ratio",
        value: metrics ? fmt2(metrics.performance.sortino) : "—",
        sub: "Mean / downside deviation",
        icon: <TrendingUp size={18} />
      },
      {
        label: "MAR Ratio",
        value: metrics ? fmt2(metrics.performance.mar) : "—",
        sub: "Annual return / max peak DD",
        icon: <Gauge size={18} />
      },
      {
        label: "Calmar Ratio",
        value: metrics ? fmt2(metrics.performance.calmar) : "—",
        sub: "CAGR / max peak DD",
        icon: <BarChart3 size={18} />
      }
    ]
  }, [metrics])

  const statisticalKPIs: KPI[] = useMemo(() => {
    return [
      {
        label: "Expectancy",
        value: metrics ? fmtMoney(metrics.statistics.expectancy) : "—",
        sub: "Avg PnL per trade",
        icon: <Sigma size={18} />
      },
      {
        label: "Win Rate",
        value: metrics ? fmtPct(metrics.statistics.win_rate) : "—",
        sub: metrics ? `${metrics.statistics.total_trades} trades` : "Consistency",
        icon: <Percent size={18} />
      },
      {
        label: "Profit Factor",
        value: metrics ? fmt2(metrics.statistics.profit_factor) : "—",
        sub: "Gross profit / gross loss",
        icon: <TrendingUp size={18} />
      },
      {
        label: "Max Drawdown",
        value: metrics ? fmtPct(metrics.risk.max_drawdown_start) : "—",
        sub: "Start-to-trough (prop style)",
        icon: <Gauge size={18} />
      }
    ]
  }, [metrics])

  return (
    <div className="relative space-y-8 p-6 max-w-[1400px] mx-auto">
      {/* Loading Spinner */}
      {loading && <AnalyticsPageLoading />}
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">
            Deep performance, risk & statistical breakdown
          </p>
        </div>
      </div>

      {/* Performance Ratios */}
      <section className="space-y-3">
        <h2 className="text-white text-lg font-medium">Performance Ratios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceKPIs.map((kpi) => (
            <KPICard
              key={kpi.label}
              kpi={kpi}
              onClick={() => setActiveKPI(kpi)}
            />
          ))}
        </div>
      </section>

      {/* Statistical Metrics */}
      <section className="space-y-3">
        <h2 className="text-white text-lg font-medium">Statistical Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statisticalKPIs.map((kpi) => (
            <KPICard
              key={kpi.label}
              kpi={kpi}
              onClick={() => setActiveKPI(kpi)}
            />
          ))}
        </div>
      </section>

      {/* Visualization */}
      <section className="space-y-6">

        {/* Row 1: Main Risk + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Underwater Drawdown */}
          <div className="lg:col-span-2 rounded-xl bg-[#111111] border border-white/5 p-5">
            <h3 className="text-white font-medium mb-3">
              Underwater Drawdown Curve
            </h3>

            <div className="h-[260px] rounded-lg border border-white/5 bg-black/20">
              {equityCurve.length > 1 ? (
                <UnderwaterChart equity={equityCurve} />
              ) : (
                <div className="h-full flex items-center justify-center text-white/30 text-sm">
                  No drawdown data
                </div>
              )}
            </div>
          </div>

          {/* AI Insight */}
            <div className="relative rounded-xl bg-[#111111] border border-white/5 p-5 flex flex-col">
              {/* REGIME BADGE */}
              
              {graphAIText && (() => {
                const s = splitGraphInsight(graphAIText)
                if (!s.regime) return null
                const regimeTone =
                  s.regime.toUpperCase() === "HIGH RISK"
                    ? "bg-red-500/10 text-red-300 border-red-500/20"
                    : s.regime.toUpperCase() === "CAUTION"
                      ? "bg-yellow-500/10 text-yellow-200 border-yellow-500/20"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                return (
                  <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] border rounded-full px-2 py-0.5 ${regimeTone}`}>
                    <AlertTriangle size={10} className="opacity-70" />
                    {s.regime.toUpperCase()}
                  </span>
                )
              })()}

              {/* HEADER */}
              <div className="flex items-center gap-3 mb-4 text-white">
                {/* CLICKABLE AI BRAIN */}
                <motion.button
                  onClick={() => {
                    setBrainPing((n) => n + 1)
                    runGraphAI()
                  }}
                  disabled={graphAILoading}
                  title="Generate AI Insight"
                  className={`
                    relative flex items-center justify-center
                    h-9 w-9 rounded-full
                    bg-emerald-500/15
                    border border-emerald-400/30
                    text-emerald-300
                    disabled:opacity-40
                  `}
                  animate={
                    graphAILoading
                      ? {
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 0 0px rgba(16,185,129,0.0)",
                            "0 0 16px rgba(16,185,129,0.6)",
                            "0 0 0px rgba(16,185,129,0.0)"
                          ]
                        }
                      : {
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 0 0px rgba(16,185,129,0.0)",
                            "0 0 10px rgba(16,185,129,0.35)",
                            "0 0 0px rgba(16,185,129,0.0)"
                          ]
                        }
                  }
                  transition={{
                    duration: graphAILoading ? 0.9 : 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Brain size={18} />
                </motion.button>

                {/* TITLE */}
                <span className="font-medium">AI Graph Insight</span>
              </div>



              {/* AI TEXT CONTENT */}
              {!graphAIText && !graphAILoading && (
                <div className="text-sm text-white/50 leading-relaxed">
                  <p>
                    Click the <span className="text-emerald-300 font-medium">AI brain</span> to analyze
                    your equity behavior, drawdown structure, and expectancy health.
                  </p>

                  <p className="mt-2 text-xs text-white/40">
                    Insight is generated on demand and cached to avoid unnecessary analysis.
                  </p>
                </div>
              )}

              {graphAIText && !graphAILoading && (() => {
                const s = splitGraphInsight(graphAIText)
                return (
                  <div className="flex flex-col gap-3 text-sm">
                    {s.equity && <GraphBullet title="Equity behavior">{s.equity}</GraphBullet>}
                    {s.drawdown && <GraphBullet title="Drawdown structure">{s.drawdown}</GraphBullet>}
                    {s.expectancy && <GraphBullet title="Expectancy health">{s.expectancy}</GraphBullet>}

                    {s.focus && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-2">
                        <div className="text-xs uppercase tracking-wide text-emerald-300 mb-1">
                          Strategic focus
                        </div>
                        <div className="text-white/90">{s.focus}</div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

    
        </div>

        {/* Row 2: Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rolling Expectancy */}
          <div className="rounded-xl bg-[#111111] border border-white/5 p-5 flex flex-col h-full">

            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-medium">
                Rolling Expectancy
              </h3>
              <span className="text-xs text-white/40">
                20-trade window
              </span>
            </div>

            <p className="text-xs text-white/40 mb-3">
              Edge health over time. Above zero = positive expectancy.
            </p>

            <div className="h-[260px] rounded-lg border border-white/5 bg-black/20">
              {trades.length >= 20 ? (
                <RollingExpectancyChart trades={trades} window={20} />
              ) : (
                <div className="h-full flex items-center justify-center text-white/30 text-sm">
                  Not enough trades
                </div>
              )}
            </div>

          </div>

          {/* Symbol Exposure */}
          <div className="rounded-xl bg-[#111111] border border-white/5 p-5 flex flex-col h-full">

            <h3 className="text-white font-medium mb-1">
              Symbol Exposure
            </h3>
            <p className="text-xs text-white/40 mb-3">
              Distribution of trades across instruments
            </p>

            {trades.length > 0 ? (
              <SymbolSplitChart trades={trades} />
            ) : (
              <div className="h-[240px] flex items-center justify-center text-white/30 text-sm">
                No trade data
              </div>
            )}
          </div>
          
        </div>
      </section>
      {/* KPI Insight Modal (GLOBAL, NOT INSIDE CARDS) */}
      <KPIInsightModal
        kpi={activeKPI}
        open={!!activeKPI}
        metrics={metrics}
        metricsHash={metricsHash}
        onClose={() => setActiveKPI(null)}
        cache={kpiInsightCache}
        setCache={setKpiInsightCache}
      />


    </div>
  )
}

function KPISection({
  title,
  children,
  highlight
}: {
  title: string
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-white/40 mb-1">
        {title}
      </div>
      <div className="text-white/80 leading-relaxed">
        {children}
      </div>
    </div>
  )
}
function GraphBullet({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wide text-white/40">
        {title}
      </div>
      <div className="text-white/70 leading-relaxed flex gap-2">
        <span className="text-white/30">•</span>
        <span>{children}</span>
      </div>
    </div>
  )
}

function getKPIGaugeConfig(kpi: KPI) {
  const label = kpi.label.toLowerCase()
  const raw = Number(
    kpi.value
      .replace("%", "")
      .replace("$", "")
      .replace(",", "")
  )

  // Sharpe / Sortino
  if (label.includes("sharpe") || label.includes("sortino")) {
    return {
      value: raw,
      min: -2,
      max: 2,
      zones: [
        { label: "Poor", from: -2, to: 0, color: "bg-red-500/60" },
        { label: "Neutral", from: 0, to: 1, color: "bg-yellow-400/60" },
        { label: "Good", from: 1, to: 2, color: "bg-emerald-400/60" }
      ]
    }
  }

  // Profit Factor
  if (label.includes("profit factor")) {
    return {
      value: raw,
      min: 0,
      max: 3,
      zones: [
        { label: "Poor", from: 0, to: 1, color: "bg-red-500/60" },
        { label: "Neutral", from: 1, to: 1.5, color: "bg-yellow-400/60" },
        { label: "Good", from: 1.5, to: 3, color: "bg-emerald-400/60" }
      ]
    }
  }

  // Expectancy
  if (label.includes("expectancy")) {
    return {
      value: raw,
      min: -500,
      max: 500,
      zones: [
        { label: "Negative", from: -500, to: 0, color: "bg-red-500/60" },
        { label: "Break-even", from: 0, to: 50, color: "bg-yellow-400/60" },
        { label: "Positive", from: 50, to: 500, color: "bg-emerald-400/60" }
      ]
    }
  }

  // Win Rate (%)
  if (label.includes("win rate")) {
    return {
      value: raw,
      min: 0,
      max: 100,
      zones: [
        { label: "Low", from: 0, to: 40, color: "bg-red-500/60" },
        { label: "Average", from: 40, to: 55, color: "bg-yellow-400/60" },
        { label: "Strong", from: 55, to: 100, color: "bg-emerald-400/60" }
      ]
    }
  }

  // Max Drawdown (INVERTED: lower is better)
  if (label.includes("drawdown")) {
    return {
      value: raw,
      min: 0,
      max: 20,
      zones: [
        { label: "Safe", from: 0, to: 5, color: "bg-emerald-400/60" },
        { label: "Warning", from: 5, to: 10, color: "bg-yellow-400/60" },
        { label: "Danger", from: 10, to: 20, color: "bg-red-500/60" }
      ]
    }
  }

  // MAR / Calmar
  if (label.includes("mar") || label.includes("calmar")) {
    return {
      value: raw,
      min: -2,
      max: 3,
      zones: [
        { label: "Poor", from: -2, to: 0, color: "bg-red-500/60" },
        { label: "Neutral", from: 0, to: 1, color: "bg-yellow-400/60" },
        { label: "Strong", from: 1, to: 3, color: "bg-emerald-400/60" }
      ]
    }
  }

  // Fallback
  return {
    value: raw,
    min: 0,
    max: 1,
    zones: [
      { label: "Low", from: 0, to: 0.5, color: "bg-red-500/60" },
      { label: "High", from: 0.5, to: 1, color: "bg-emerald-400/60" }
    ]
  }
}
