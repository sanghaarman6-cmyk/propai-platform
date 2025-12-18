"use client"

import { useMemo } from "react"
import KPI from "@/components/KPI"
import TerminalCard from "@/components/TerminalCard"
import TradesTable from "@/components/TradesTable"
import RuleMeter from "@/components/RuleMeter"
import { useActiveAccount } from "@/lib/selectors/useActiveAccount"
import { calculateDrawdown } from "@/lib/metrics/drawdown"

export default function DashboardPage() {
  const account = useActiveAccount()

  if (!account) {
    return (
      <TerminalCard title="Dashboard">
        <div className="text-sm text-text-muted">
          No MT5 account connected.
        </div>
      </TerminalCard>
    )
  }

  const {
    balance,
    equity,
    history = [],
    positions = [],
    currency,
  } = account

  /* ---------- METRICS ---------- */

  const { ddUsd, ddPct } = calculateDrawdown(balance, equity)

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        winRate: 0,
        pnl: 0,
        trades: 0,
      }
    }

    const wins = history.filter((t) => t.profit > 0)
    const pnl = history.reduce((sum, t) => sum + t.profit, 0)

    return {
      winRate: Math.round((wins.length / history.length) * 100),
      pnl,
      trades: history.length,
    }
  }, [history])

  /* ---------- AI SIGNALS (TEMP, REAL LOGIC) ---------- */

  const insights: string[] = []

  if (ddPct > 70) insights.push("Drawdown approaching critical level")
  if (positions.length > 3) insights.push("High concurrent exposure")
  if (stats.winRate < 40 && stats.trades > 10)
    insights.push("Low win rate detected")

  /* ---------- RENDER ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-text-muted">Overview</div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-xs text-text-muted">
          Live MT5 account analytics
        </div>
      </div>

      {/* KPI Strip */}
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
          value={positions.length.toString()}
        />
        <KPI
          label="Equity"
          value={`${equity.toLocaleString()} ${currency}`}
        />


      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="lg:col-span-2">
          <TerminalCard title="AI Insights">
            {insights.length === 0 ? (
              <div className="text-sm text-text-muted">
                No risk signals detected.
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {insights.map((i, idx) => (
                  <li key={idx}>• {i}</li>
                ))}
              </ul>
            )}
          </TerminalCard>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <TerminalCard title="Risk Overview">
            <div className="space-y-4">
              <RuleMeter
                label="Drawdown used"
                valuePct={ddPct}
                helper={`${ddUsd.toFixed(2)} ${currency}`}
              />

              <RuleMeter
                label="Equity vs Balance"
                valuePct={(equity / balance) * 100}
                helper={`${equity.toFixed(2)} / ${balance.toFixed(2)}`}
              />
            </div>
          </TerminalCard>

          <TerminalCard title="Next Actions (AI)">
            <div className="space-y-2 text-sm">
              {ddPct > 70 && <div>• Reduce risk immediately</div>}
              {positions.length > 3 && (
                <div>• Consider closing excess positions</div>
              )}
              {stats.winRate < 40 && stats.trades > 10 && (
                <div>• Review recent losing setups</div>
              )}
              {insights.length === 0 && (
                <div className="text-text-muted">
                  No actions required.
                </div>
              )}
            </div>
          </TerminalCard>
        </div>
      </div>

      {/* Trades */}
      <TradesTable
        trades={history}
        filtersUI={<div className="text-xs text-text-muted">MT5 History</div>}
      />
    </div>
  )
}
