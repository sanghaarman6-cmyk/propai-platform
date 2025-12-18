"use client"

import { useEffect, useMemo } from "react"
import KPI from "@/components/KPI"
import TerminalCard from "@/components/TerminalCard"
import SkeletonBlock from "@/components/SkeletonBlock"
import InsightsList from "@/components/InsightsList"
import TradesTable from "@/components/TradesTable"
import RuleMeter from "@/components/RuleMeter"
import { useAppStore } from "@/lib/store"
import Skeleton from "@/components/Skeleton"

export default function DashboardPage() {
  
  const {
    user,
    activeChallenge,
    insights,
    nextActions,
    toggleNextAction,
    recentTrades,
    dashboardLoading,
    setDashboardLoading,
    filters,
    setFilters,
  } = useAppStore()


  useEffect(() => {
    const t = setTimeout(() => {
      setDashboardLoading(false)
    }, 800)

    return () => clearTimeout(t)
  }, [setDashboardLoading])


  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }




  const instruments = useMemo(() => {
    const set = new Set(recentTrades.map((t) => t.instrument))
    return ["All", ...Array.from(set)]
  }, [recentTrades])

  const filteredTrades = useMemo(() => {
    return recentTrades.filter((t) => {
      if (filters.instrument !== "All" && t.instrument !== filters.instrument) return false
      if (filters.session !== "All" && t.session !== filters.session) return false
      if (filters.outcome !== "All" && t.outcome !== filters.outcome) return false
      return true
    })
  }, [recentTrades, filters])

  if (!user || !activeChallenge) {
    return (
      <TerminalCard title="Welcome">
        <div className="text-sm text-text-muted">
          No demo user loaded. (This won’t happen in our flow.)
        </div>
      </TerminalCard>
    )
  }

  const s = activeChallenge.stats

  if (!activeChallenge.live) {
    return (
      <TerminalCard title="Live Challenge">
        <div className="text-sm text-text-muted">
          No live data available for this challenge.
        </div>
      </TerminalCard>
    )
  }

  const live = activeChallenge.live


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-text-muted">Overview</div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            Dashboard <span className="text-text-muted">·</span>{" "}
            <span className="text-text-muted text-base">
              {activeChallenge.firmName} — {activeChallenge.phase}
            </span>
          </h1>
          <div className="text-xs text-text-muted">
            Trader: <span className="font-mono text-text-primary">{user.name}</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      {dashboardLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[74px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <KPI label="Win rate" value={`${s.winRate}%`} />
          <KPI label="Profit factor" value={s.profitFactor.toFixed(2)} />
          <KPI label="PnL" value={`$${s.pnlUsd.toLocaleString()}`} accent />
          <KPI label="Max DD" value={`${s.maxDrawdownPct}%`} />
          <KPI label="Consistency" value={`${s.consistencyScore}`} />
          <KPI label="Rule risk" value={s.ruleRiskScore < 35 ? "Low" : "Elevated"} accent />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: insights */}
        <div className="lg:col-span-2">
          {dashboardLoading ? (
            <TerminalCard title="AI Insights">
              <div className="space-y-3">
                <SkeletonBlock className="h-20" />
                <SkeletonBlock className="h-20" />
                <SkeletonBlock className="h-20" />
              </div>
            </TerminalCard>
          ) : (
            <InsightsList items={insights} />
          )}
        </div>

        {/* Right: challenge + next actions */}
        <div className="space-y-6">
          <TerminalCard title="Challenge Status">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{activeChallenge.name}</div>
              <div className="text-xs text-text-muted font-mono">
                Day {s.tradingDaysCompleted}/{activeChallenge.rules.timeLimitDays}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <RuleMeter
                label="Profit target remaining"
                valuePct={(live.profitTargetRemainingUsd / (activeChallenge.rules.accountSize * (activeChallenge.rules.profitTargetPct / 100))) * 100}
                helper={`$${live.profitTargetRemainingUsd.toLocaleString()}`}
              />
              <RuleMeter
                label="Daily loss remaining"
                valuePct={100 - Math.min(100, (live.dailyLossRemainingUsd / (activeChallenge.rules.accountSize * (activeChallenge.rules.dailyLossLimitPct / 100))) * 100)}
                helper={`$${live.dailyLossRemainingUsd.toLocaleString()}`}
              />
              <RuleMeter
                label="Max loss buffer"
                valuePct={100 - Math.min(100, (live.maxLossBufferUsd / (activeChallenge.rules.accountSize * (activeChallenge.rules.maxLossLimitPct / 100))) * 100)}
                helper={`$${live.maxLossBufferUsd.toLocaleString()}`}
              />
            </div>

            <div className="mt-4 text-xs text-text-muted">
              Equity:{" "}
              <span className="font-mono text-text-primary">
                ${live.equityUsd.toLocaleString()}
              </span>{" "}
              · Time remaining:{" "}
              <span className="font-mono text-text-primary">
                {live.timeRemainingDays}d
              </span>
            </div>
          </TerminalCard>

          <TerminalCard title="Next Actions (AI)">
            <div className="space-y-2">
              {nextActions.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-start gap-3 rounded border border-border bg-black/30 p-3 hover:bg-black/40"
                >
                  <input
                    type="checkbox"
                    checked={a.done}
                    onChange={() => toggleNextAction(a.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className={a.done ? "text-text-muted line-through" : ""}>
                      {a.label}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </TerminalCard>
        </div>
      </div>

      {/* Trades table */}
      <TradesTable
        trades={filteredTrades}
        filtersUI={
          <div className="flex items-center gap-2">
            <select
              value={filters.instrument}
              onChange={(e) => setFilters({ instrument: e.target.value as any })}
              className="rounded border border-border bg-black px-2 py-1 text-xs"
            >
              {instruments.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>

            <select
              value={filters.session}
              onChange={(e) => setFilters({ session: e.target.value as any })}
              className="rounded border border-border bg-black px-2 py-1 text-xs"
            >
              {["All", "Asia", "London", "NY", "Off-hours"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filters.outcome}
              onChange={(e) => setFilters({ outcome: e.target.value as any })}
              className="rounded border border-border bg-black px-2 py-1 text-xs"
            >
              {["All", "Win", "Loss", "BE"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  )
}
