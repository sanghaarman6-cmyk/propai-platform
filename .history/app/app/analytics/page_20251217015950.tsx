"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import Tabs from "@/components/Tabs"
import ChartBlock from "@/components/ChartBlock"
import TagPill from "@/components/TagPill"
import { useAppStore } from "@/lib/store"
import type { Trade } from "@/lib/types"

type Session = Trade["session"]

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function AnalyticsPage() {
  const { recentTrades, activeChallenge } = useAppStore()
  const [tab, setTab] = useState("performance")

  const stats = useMemo(() => {
    const rs = recentTrades.map((t) => t.rMultiple)
    const wins = recentTrades.filter((t) => t.rMultiple > 0).length
    const losses = recentTrades.filter((t) => t.rMultiple < 0).length
    const bes = recentTrades.filter((t) => t.rMultiple === 0).length

    const avgR = rs.length ? sum(rs) / rs.length : 0
    const grossWin = sum(recentTrades.filter((t) => t.rMultiple > 0).map((t) => t.rMultiple))
    const grossLoss = Math.abs(
      sum(recentTrades.filter((t) => t.rMultiple < 0).map((t) => t.rMultiple))
    )
    const pf = grossLoss === 0 ? (grossWin > 0 ? 9.99 : 0) : grossWin / grossLoss

    const bySession = new Map<Session, Trade[]>()
    recentTrades.forEach((t) => {
      const list = bySession.get(t.session) ?? []
      list.push(t)
      bySession.set(t.session, list)
    })

    const sessionRows = (["Asia", "London", "NY", "Off-hours"] as Session[]).map((s) => {
      const list = bySession.get(s) ?? []
      const r = list.map((t) => t.rMultiple)
      const total = sum(r)
      const wr = list.length ? Math.round((list.filter((x) => x.rMultiple > 0).length / list.length) * 100) : 0
      return { session: s, trades: list.length, totalR: total, winRate: wr }
    })

    return { wins, losses, bes, avgR, pf, sessionRows }
  }, [recentTrades])

  const equityCurve = useMemo(() => {
    // UI-level: cumulative R curve
    let c = 0
    return recentTrades
      .slice()
      .reverse()
      .map((t) => {
        c += t.rMultiple
        return c
      })
  }, [recentTrades])

  const drawdownCurve = useMemo(() => {
    let peak = -Infinity
    let dd = 0
    const series: number[] = []
    equityCurve.forEach((v) => {
      peak = Math.max(peak, v)
      dd = v - peak
      series.push(dd)
    })
    return series
  }, [equityCurve])

  const ruleProximity = useMemo(() => {
    // UI-level: fabricate “how close” the trader typically gets to limits
    const base = activeChallenge?.stats.ruleRiskScore ?? 35
    return {
      daily: clamp(base + 12, 0, 100),
      max: clamp(base + 4, 0, 100),
      consistency: clamp(base - 8, 0, 100),
    }
  }, [activeChallenge])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs text-text-muted">Analytics</div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <div className="mt-1 text-sm text-text-muted">
            Performance, risk, behavior and prop-rule proximity.
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { key: "performance", label: "Performance" },
            { key: "risk", label: "Risk" },
            { key: "behavior", label: "Behavior" },
            { key: "consistency", label: "Consistency" },
          ]}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {tab === "performance" && (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartBlock
                  title="Equity curve (R)"
                  subtitle="Cumulative R multiple over time (UI-level)"
                >
                  <MiniSparkline values={equityCurve} />
                </ChartBlock>

                <ChartBlock
                  title="R distribution"
                  subtitle="How your outcomes cluster (UI-level bins)"
                >
                  <RDistribution trades={recentTrades} />
                </ChartBlock>
              </div>

              <TerminalCard title="Session breakdown">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-text-muted">
                      <tr className="border-b border-border">
                        <th className="py-2 text-left font-normal">Session</th>
                        <th className="py-2 text-left font-normal">Trades</th>
                        <th className="py-2 text-left font-normal">Total R</th>
                        <th className="py-2 text-left font-normal">Win rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.sessionRows.map((r) => (
                        <tr key={r.session} className="border-b border-border/60 hover:bg-black/30">
                          <td className="py-2">{r.session}</td>
                          <td className="py-2 font-mono">{r.trades}</td>
                          <td className="py-2 font-mono">
                            {r.totalR >= 0 ? "+" : ""}
                            {r.totalR.toFixed(2)}
                          </td>
                          <td className="py-2">
                            <TagPill tone={r.winRate >= 55 ? "green" : r.winRate >= 45 ? "amber" : "red"}>
                              {r.winRate}%
                            </TagPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TerminalCard>
            </>
          )}

          {tab === "risk" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartBlock
                title="Drawdown curve (R)"
                subtitle="Peak-to-trough drawdown over time (UI-level)"
              >
                <MiniSparkline values={drawdownCurve} negative />
              </ChartBlock>

              <ChartBlock
                title="Rule proximity heatmap"
                subtitle="How close you typically get to firm limits (mocked from rule risk)"
              >
                <RuleHeat
                  daily={ruleProximity.daily}
                  max={ruleProximity.max}
                  consistency={ruleProximity.consistency}
                />
              </ChartBlock>

              <TerminalCard title="Risk summary">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Avg R</div>
                    <div className="mt-1 font-mono text-lg">{stats.avgR.toFixed(2)}</div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Profit factor</div>
                    <div className="mt-1 font-mono text-lg">{stats.pf.toFixed(2)}</div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Wins / Losses</div>
                    <div className="mt-1 font-mono text-lg">
                      {stats.wins}/{stats.losses}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">BE trades</div>
                    <div className="mt-1 font-mono text-lg">{stats.bes}</div>
                  </div>
                </div>
              </TerminalCard>
            </div>
          )}

          {tab === "behavior" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartBlock
                title="Overtrading indicator"
                subtitle="Trades clustered in short windows (UI-level)"
              >
                <BehaviorBars labelA="NY open cluster" a={78} labelB="London AM cluster" b={42} />
              </ChartBlock>

              <ChartBlock
                title="Setup discipline"
                subtitle="A+ adherence vs impulse entries (UI-level)"
              >
                <BehaviorBars labelA="A+ setups" a={61} labelB="Impulse entries" b={39} />
              </ChartBlock>

              <TerminalCard title="Behavior notes">
                <div className="space-y-2 text-sm text-text-muted">
                  <div>• NY open trades show higher variance and faster rule proximity events.</div>
                  <div>• Best edge appears in London AM pullback continuation setups.</div>
                  <div>• Consider a “2-loss cooldown” protocol to prevent tilt escalation.</div>
                </div>
              </TerminalCard>
            </div>
          )}

          {tab === "consistency" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartBlock
                title="Consistency meter"
                subtitle="Variance vs stability (UI-level)"
              >
                <ConsistencyMeter score={activeChallenge?.stats.consistencyScore ?? 75} />
              </ChartBlock>

              <ChartBlock
                title="Day-of-week / session performance"
                subtitle="Mock grid — later driven by real trade timestamps"
              >
                <MiniGrid />
              </ChartBlock>

              <TerminalCard title="Consistency coaching">
                <div className="rounded border border-border bg-black/30 p-4 text-sm">
                  Your passing probability increases sharply when your daily loss exposure stays below{" "}
                  <span className="font-mono text-accent-green">50%</span> by midday. Most failures occur after
                  a second re-entry attempt on a red morning.
                </div>
              </TerminalCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function MiniSparkline({ values, negative = false }: { values: number[]; negative?: boolean }) {
  const max = Math.max(...values, 0.0001)
  const min = Math.min(...values, -0.0001)
  const span = max - min || 1

  return (
    <div className="flex h-28 items-end gap-1">
      {values.slice(-40).map((v, idx) => {
        const norm = (v - min) / span
        const h = Math.max(6, Math.round(norm * 100))
        const isNeg = v < 0
        return (
          <div
            key={idx}
            className={`w-2 rounded ${isNeg ? "bg-accent-red" : "bg-accent-green"}`}
            style={{ height: `${negative ? (isNeg ? h : h * 0.7) : h}%` }}
            title={v.toFixed(2)}
          />
        )
      })}
    </div>
  )
}

function RDistribution({ trades }: { trades: Trade[] }) {
  const bins = [
    { label: "< -1.0", min: -999, max: -1.01 },
    { label: "-1.0 to -0.2", min: -1.0, max: -0.2 },
    { label: "-0.2 to 0.2", min: -0.2, max: 0.2 },
    { label: "0.2 to 1.0", min: 0.2, max: 1.0 },
    { label: "> 1.0", min: 1.01, max: 999 },
  ]

  const counts = bins.map((b) => ({
    ...b,
    count: trades.filter((t) => t.rMultiple >= b.min && t.rMultiple <= b.max).length,
  }))
  const maxCount = Math.max(...counts.map((c) => c.count), 1)

  return (
    <div className="space-y-2">
      {counts.map((c) => (
        <div key={c.label} className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>{c.label}</span>
            <span className="font-mono">{c.count}</span>
          </div>
          <div className="h-2 rounded bg-black/40">
            <div
              className="h-2 rounded bg-accent-cyan"
              style={{ width: `${(c.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function RuleHeat({ daily, max, consistency }: { daily: number; max: number; consistency: number }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <HeatRow label="Daily loss proximity" value={daily} />
      <HeatRow label="Max loss proximity" value={max} />
      <HeatRow label="Consistency variance" value={consistency} />
    </div>
  )
}

function HeatRow({ label, value }: { label: string; value: number }) {
  // higher value = riskier
  const w = clamp(value, 0, 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span className="font-mono">{w}%</span>
      </div>
      <div className="h-2 rounded bg-black/40">
        <div
          className={`h-2 rounded ${w >= 70 ? "bg-accent-red" : w >= 40 ? "bg-accent-amber" : "bg-accent-green"}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  )
}

function BehaviorBars({
  labelA,
  a,
  labelB,
  b,
}: {
  labelA: string
  a: number
  labelB: string
  b: number
}) {
  return (
    <div className="space-y-3">
      <HeatRow label={labelA} value={a} />
      <HeatRow label={labelB} value={b} />
      <div className="text-xs text-text-muted">
        Higher values indicate more frequent pattern presence.
      </div>
    </div>
  )
}

function ConsistencyMeter({ score }: { score: number }) {
  const s = clamp(score, 0, 100)
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-muted">Consistency score</div>
      <div className="text-3xl font-mono">{s}</div>
      <div className="h-2 rounded bg-black/40">
        <div
          className={`${s >= 80 ? "bg-accent-green" : s >= 60 ? "bg-accent-amber" : "bg-accent-red"} h-2 rounded`}
          style={{ width: `${s}%` }}
        />
      </div>
      <div className="text-xs text-text-muted">
        {s >= 80
          ? "Stable execution. Keep risk uniform."
          : s >= 60
          ? "Moderate variance. Focus on session boundaries."
          : "High variance. Add cooldown rules and reduce size."}
      </div>
    </div>
  )
}

function MiniGrid() {
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  const cols = ["Asia", "London", "NY"]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 text-xs text-text-muted">
        <div />
        {cols.map((c) => (
          <div key={c} className="text-center">
            {c}
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r} className="grid grid-cols-4 gap-2">
          <div className="text-xs text-text-muted">{r}</div>
          {cols.map((c, j) => {
            const v = (i * 17 + j * 23) % 100
            const tone = v >= 70 ? "bg-accent-green" : v >= 45 ? "bg-accent-amber" : "bg-accent-red"
            return (
              <div key={c} className="rounded border border-border bg-black/40 p-2">
                <div className="text-[10px] text-text-muted">{Math.round(v)}%</div>
                <div className="mt-1 h-1 rounded bg-black/40">
                  <div className={`h-1 rounded ${tone}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
