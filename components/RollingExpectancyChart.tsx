"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts"

type Trade = {
  pnl: number
}

type Point = {
  i: number
  expectancy: number
}

function ExpectancyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value

  return (
    <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur px-3 py-2">
      <div className="text-xs text-white/50">Rolling Expectancy</div>
      <div
        className={`text-sm font-medium ${
          v >= 0 ? "text-emerald-300" : "text-rose-300"
        }`}
      >
        ${Number(v).toFixed(2)}
      </div>
    </div>
  )
}

export default function RollingExpectancyChart({
  trades,
  window = 20
}: {
  trades: Trade[]
  window?: number
}) {
  if (trades.length < window) return null

  const data: Point[] = []

  for (let i = window; i <= trades.length; i++) {
    const slice = trades.slice(i - window, i)

    const wins = slice.filter(t => t.pnl > 0)
    const losses = slice.filter(t => t.pnl < 0)

    const winRate = wins.length / slice.length
    const avgWin = wins.length
      ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length
      : 0
    const avgLoss = losses.length
      ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length)
      : 0

    const expectancy =
      winRate * avgWin - (1 - winRate) * avgLoss

    data.push({
      i,
      expectancy: Number(expectancy.toFixed(2))
    })
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="expPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>

          <linearGradient id="expNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis hide />

        {/* Zero expectancy reference */}
        <ReferenceLine
          y={0}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="4 4"
        />

        <Tooltip
          content={<ExpectancyTooltip />}
          cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
        />

        {/* Area automatically looks good around zero */}
        <Area
          type="monotone"
          dataKey="expectancy"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#expPos)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
