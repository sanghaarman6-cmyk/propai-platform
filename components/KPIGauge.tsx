"use client"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

type Zone = {
  label: string
  from: number
  to: number
  color: string
}

export default function KPIGauge({
  value,
  min,
  max,
  zones,
  label
}: {
  value: number
  min: number
  max: number
  zones: Zone[]
  label?: string
}) {
  const goodZone = zones[zones.length - 1]

    const currentZone =
    zones.find(z => value >= z.from && value <= z.to) ?? null

    const isBelow = value < goodZone.from
    const isWithin = value >= goodZone.from && value <= goodZone.to
    const isAbove = value > goodZone.to

    let valueColor = "text-white"
    let statusText = "—"
    let StatusIcon = null

    if (isBelow) {
    valueColor = "text-red-400"
    statusText = "Below profitable range"
    StatusIcon = "down"
    } else if (isWithin) {
    valueColor = "text-emerald-400"
    statusText = "Within profitable range"
    StatusIcon = "equal"
    } else if (isAbove) {
    valueColor = "text-emerald-300"
    statusText = "Above profitable range"
    StatusIcon = "up"
    }


  const rangeLabel =
    goodZone.from === Infinity
      ? `> ${goodZone.from}`
      : `${goodZone.from} – ${goodZone.to}`

  const clamped = Math.max(min, Math.min(max, value))
  const pct = ((clamped - min) / (max - min)) * 100

  return (
    <div className="w-full space-y-3">
      {label && (
        <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-white/40">
            {label}
            </div>
            <div className="text-[11px] text-white/50">
            Typical profitable range
            <span className="block text-white/70 font-medium">
                {goodZone.from} – {goodZone.to}
            </span>
            </div>
        </div>
        )}


      {/* Gauge bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-white/10">
        {zones.map((z, i) => {
          const left = ((z.from - min) / (max - min)) * 100
          const width = ((z.to - z.from) / (max - min)) * 100

          return (
            <div
              key={i}
              className={`absolute top-0 h-full ${z.color}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          )
        })}

        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 rounded bg-white shadow"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>

      {/* Value */}
        <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-white/40">
            Current value
        </div>

        <div className={`flex items-center gap-2 text-xl font-semibold ${valueColor}`}>
            {StatusIcon === "down" && <ArrowDown size={18} />}
            {StatusIcon === "up" && <ArrowUp size={18} />}
            {StatusIcon === "equal" && <Minus size={18} />}

            <span>{value.toFixed(2)}</span>
        </div>

        <div className="text-xs text-white/50">
            {statusText}
        </div>
        </div>
    </div>
  )
}
