"use client"

import { useMemo } from "react"
import KPI from "@/components/KPI"
import TerminalCard from "@/components/TerminalCard"
import TradesTable from "@/components/TradesTable"
import RuleMeter from "@/components/RuleMeter"
import { useActiveAccount } from "@/lib/selectors/useActiveAccount"
import { computeDrawdownMetrics } from "@/lib/metrics/drawdown"
import { mapMT5Trade } from "@/lib/mappers/mt5TradeMapper"
import { useAuthGuard } from "@/lib/hooks/useAuthGuard"


export default function DashboardPage() {
  // 🔒 Route protection
  
  
  const account = useActiveAccount()

  /* -------------------------------------------------
     SAFE FALLBACKS (hooks must ALWAYS run)
  -------------------------------------------------- */
  const balance = account?.balance ?? 0
  const equity = account?.equity ?? 0
  const currency = account?.currency ?? "USD"

  const history = Array.isArray(account?.history)
    ? account!.history
    : []

  const positions = Array.isArray(account?.positions)
    ? account!.positions
    : []

  /* -------------------------------------------------
     BASELINE (CRITICAL FOR PROP FIRMS)
  -------------------------------------------------- */
  const baseline =
    account?.baselineBalance ??
    account?.balance ??
    0

  /* -------------------------------------------------
     DERIVED DATA
  -------------------------------------------------- */
  const { ddPct, ddUsd } = computeDrawdownMetrics(
    history,
    baseline
  )

  const trades = useMemo(
    () => history.map(mapMT5Trade),
    [history]
  )

  const stats = useMemo(() => {
    if (!history.length) {
      return { winRate: 0, pnl: 0, trades: 0 }
    }

    const wins = history.filter((t) => t.profit > 0)
    const pnl = history.reduce((sum, t) => sum + t.profit, 0)

    return {
      winRate: Math.round((wins.length / history.length) * 100),
      pnl,
      trades: history.length,
    }
  }, [history])

  /* -------------------------------------------------
     DATA-READY GUARD (NO FAKE ZERO STATS)
  -------------------------------------------------- */
  if (!account) {
    return (
      <TerminalCard title="Dashboard">
        <div className="text-sm text-text-muted">
          No MT5 account connected.
        </div>
      </TerminalCard>
    )
  }


  /* -------------------------------------------------
     RENDER
  -------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-text-muted">Overview</div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-xs text-text-muted">
          Live MT5 account analytics
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <KPI label="Win rate" value={`${stats.winRate}%`} />
        <KPI label="Trades" value={stats.trades.toString()} />
        <KPI
          label="PnL"
          value={`${stats.pnl.toFixed(2)} ${currency}`}
          accent
        />
        <KPI label="Drawdown" value={`${ddPct.toFixed(2)}%`} />
        <KPI
          label="Open positions"
          value={String(positions.length)}
        />
        <KPI
          label="Equity"
          value={`${equity.toLocaleString()} ${currency}`}
        />
      </div>

      {/* Risk */}
      <TerminalCard title="Risk Overview">
        <RuleMeter
          label="Total drawdown"
          valuePct={ddPct}
          helper={`${ddUsd.toFixed(2)} ${currency}`}
        />
      </TerminalCard>

      {/* Trades */}
      <TradesTable
        trades={trades}
        filtersUI={
          <div className="text-xs text-text-muted">
            MT5 Trade History
          </div>
        }
      />
    </div>
  )
}
