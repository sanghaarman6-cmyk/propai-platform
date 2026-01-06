"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"

type Point = {
  i: number
  ddPct: number // negative number (e.g. -4.2)
}

function UnderwaterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const dd = payload[0]?.value ?? 0

  return (
    <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur px-3 py-2">
      <div className="text-xs text-white/50">Drawdown</div>
      <div className="text-sm text-rose-300">
        {Number(dd).toFixed(2)}%
      </div>
    </div>
  )
}

export default function UnderwaterChart({ equity }: { equity: number[] }) {
  if (!equity || equity.length < 2) return null

  let peak = equity[0]

  const data: Point[] = equity.map((e, i) => {
    peak = Math.max(peak, e)
    const dd = peak > 0 ? -((peak - e) / peak) * 100 : 0

    return {
      i,
      ddPct: Number(dd.toFixed(3))
    }
  })

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />

          <XAxis dataKey="i" hide />
          <YAxis
            domain={["dataMin", 0]}
            tickFormatter={(v) => `${v}%`}
            hide
          />

          <Tooltip
            content={<UnderwaterTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="ddPct"
            stroke="#fb7185"
            strokeWidth={2}
            fill="url(#ddFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
