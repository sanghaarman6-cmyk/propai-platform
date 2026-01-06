"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"
import { getSessionFromDate } from "@/lib/metrics/session"

type Trade = {
  closedAt: string | Date
  pnl: number
}

type Point = {
  i: number
  dd: number
  session: string
}

const COLORS: Record<string, string> = {
  Asia: "#38bdf8",
  London: "#a78bfa",
  NY: "#fb7185"
}

export default function SessionUnderwaterChart({
  equity,
  trades
}: {
  equity: number[]
  trades: Trade[]
}) {
  let peak = equity[0]

  const data: Point[] = equity.slice(1).map((e, i) => {
    peak = Math.max(peak, e)
    const dd = -((peak - e) / peak) * 100
    const trade = trades[i]
    const session = trade
      ? getSessionFromDate(new Date(trade.closedAt))
      : "Unknown"

    return { i, dd, session }
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <XAxis hide />
        <YAxis hide />
        <Tooltip formatter={(v: any) => `${v.toFixed(2)}%`} />
        {["Asia", "London", "NY"].map((s) => (
          <Area
            key={s}
            dataKey="dd"
            data={data.filter(d => d.session === s)}
            stroke={COLORS[s]}
            fill={COLORS[s]}
            fillOpacity={0.25}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
