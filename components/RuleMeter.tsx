type Zone = "safe" | "warning" | "danger" | "breach"

function zoneColor(zone: Zone) {
  switch (zone) {
    case "safe":
      return "bg-green-500"
    case "warning":
      return "bg-yellow-400"
    case "danger":
      return "bg-red-500"
    case "breach":
      return "bg-red-600"
  }
}

export default function RuleMeter({
  label,
  valuePct,        // 0–100 (used)
  helper,
}: {
  label: string
  valuePct: number
  helper: string
}) {
  const pct = Math.min(valuePct, 100)

  const zone: Zone =
    pct >= 100 ? "breach" :
    pct >= 85  ? "danger" :
    pct >= 60  ? "warning" :
                 "safe"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-text-muted">{helper}</span>
      </div>

      <div className="relative h-3 w-full rounded-full bg-neutral-800 overflow-hidden">
        {/* SAFE ZONE */}
        <div className="absolute left-0 h-full w-[60%] bg-green-900/40" />
        {/* WARNING ZONE */}
        <div className="absolute left-[60%] h-full w-[25%] bg-yellow-900/40" />
        {/* DANGER ZONE */}
        <div className="absolute left-[85%] h-full w-[15%] bg-red-900/40" />

        {/* ACTUAL PROGRESS */}
        <div
          className={`absolute left-0 h-full ${zoneColor(zone)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* CONTEXT */}
      <div className="text-xs text-text-muted">
        {zone === "safe" && "🟢 Safe — normal trading"}
        {zone === "warning" && "🟡 Warning — reduce risk"}
        {zone === "danger" && "🔴 Danger — close to limit"}
        {zone === "breach" && "⛔ Limit breached"}
      </div>
    </div>
  )
}
