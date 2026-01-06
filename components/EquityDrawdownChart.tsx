"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

type Row = {
  i: number
  equity: number
  ddPct: number // drawdown % (positive number)
}

function NiceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const equity = payload.find((p: any) => p.dataKey === "equity")?.value
  const dd = payload.find((p: any) => p.dataKey === "ddPct")?.value

  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="text-[11px] text-white/50">Snapshot</div>
      <div className="mt-1 space-y-0.5">
        <div className="text-sm text-emerald-300">
          Equity:{" "}
          <span className="text-white/90">
            ${Number(equity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-sm text-rose-300">
          Drawdown:{" "}
          <span className="text-white/90">
            {Number(dd ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function EquityDrawdownChart({ equity }: { equity: number[] }) {
  if (!equity?.length) return null

  let peak = equity[0]

  const data: Row[] = equity.map((e, i) => {
    peak = Math.max(peak, e)
    const dd = peak > 0 ? (peak - e) / peak : 0

    return {
      i,
      equity: Number(e.toFixed(2)),
      ddPct: Number((dd * 100).toFixed(4)),
    }
  })

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

          <XAxis dataKey="i" hide />
          <YAxis hide />

          <Tooltip
            content={<NiceTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
          />

          {/* Equity */}
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#eqFill)"
            dot={false}
            activeDot={{ r: 3 }}
          />

          {/* Drawdown line (subtle) */}
          <Line
            type="monotone"
            dataKey="ddPct"
            stroke="rgba(244,63,94,0.85)"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
