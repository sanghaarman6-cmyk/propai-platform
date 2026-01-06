"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

import type { TradeForMetrics } from "@/lib/metrics/accountMetrics"

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

type Slice = {
  symbol: string
  pct: number
  count: number
}

const BASE_COLOR = "#10b981" // emerald-500

function opacityForIndex(i: number) {
  if (i === 0) return 1
  if (i === 1) return 0.7
  if (i === 2) return 0.45
  return 0.25
}

/* -------------------------------------------------------------------------- */
/*                              SymbolSplitChart                               */
/* -------------------------------------------------------------------------- */

export default function SymbolSplitChart({
  trades
}: {
  trades: TradeForMetrics[]
}) {
  if (!trades.length) return null

  /* ----------------------- Compute distribution ----------------------- */

  const counts = trades.reduce<Record<string, number>>((acc, t) => {
    if (!t.symbol) return acc
    acc[t.symbol] = (acc[t.symbol] || 0) + 1
    return acc
  }, {})

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const data: Slice[] = Object.entries(counts)
    .map(([symbol, count]) => ({
      symbol,
      count,
      pct: count / total
    }))
    .sort((a, b) => b.pct - a.pct)

  const top = data[0]
  const top3 = data.slice(0, 3)

  /* ------------------------------ Render ------------------------------ */

  return (
    <div className="flex flex-col items-center">

      {/* Donut + Center Info */}
      <div className="relative h-[220px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="pct"
              nameKey="symbol"
              innerRadius={70}
              outerRadius={95}
              stroke="none"
              paddingAngle={1}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={BASE_COLOR}
                  opacity={opacityForIndex(i)}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Overlay */}
        {top && (
          <div className="absolute text-center pointer-events-none">
            <div className="text-lg font-semibold text-white">
              {top.symbol}
            </div>
            <div className="text-sm text-emerald-400">
              {(top.pct * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              most traded
            </div>
          </div>
        )}
      </div>

      {/* Micro Legend (Top 3 only) */}
      <div className="mt-4 w-full space-y-1 text-xs">
        {top3.map((s, i) => (
          <div
            key={s.symbol}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-white/70">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: BASE_COLOR,
                  opacity: opacityForIndex(i)
                }}
              />
              {s.symbol}
            </div>
            <div className="text-white/50">
              {(s.pct * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
