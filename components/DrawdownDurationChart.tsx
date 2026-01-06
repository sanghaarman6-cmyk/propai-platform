"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"

type Band = {
  duration: number
  depth: number
}

export default function DrawdownDurationChart({ equity }: { equity: number[] }) {
  let peak = equity[0]
  let currentDD = 0
  let duration = 0

  const bands: Band[] = []

  for (let i = 1; i < equity.length; i++) {
    const e = equity[i]
    peak = Math.max(peak, e)
    const dd = (peak - e) / peak

    if (dd > 0) {
      duration++
      currentDD = Math.max(currentDD, dd)
    } else if (duration > 0) {
      bands.push({
        duration,
        depth: currentDD * 100
      })
      duration = 0
      currentDD = 0
    }
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={bands}>
        <XAxis dataKey="duration" hide />
        <YAxis hide />
        <Tooltip
          formatter={(v: any) => `${Number(v).toFixed(2)}%`}
          labelFormatter={(l) => `Duration: ${l} trades`}
        />
        <Bar
          dataKey="depth"
          fill="#fb7185"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
