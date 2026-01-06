// components/fundamentals/RiskHeader.tsx
import clsx from "clsx"

export function RiskHeader({
  level,
  subtitle,
}: {
  level: "Low" | "Medium" | "High" | string
  subtitle: string
}) {
  const tone =
    level === "High"
      ? "text-red-300 bg-red-500/10 ring-red-500/20"
      : level === "Medium"
      ? "text-amber-300 bg-amber-500/10 ring-amber-500/20"
      : "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20"

  return (
    <div
      className={clsx(
        "flex items-center justify-between",
        "rounded-2xl px-5 py-3",
        "bg-gradient-to-br from-white/[0.08] to-white/[0.03]",
        "ring-1 ring-white/10"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={clsx(
              "absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping",
              tone
            )}
          />
          <span className={clsx("relative inline-flex h-2.5 w-2.5 rounded-full", tone)} />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{level} risk</p>
          <p className="text-xs text-white/50 truncate">{subtitle}</p>
        </div>
      </div>

      <span className="text-xs font-mono text-white/40 shrink-0">{String(level)}</span>
    </div>
  )
}
