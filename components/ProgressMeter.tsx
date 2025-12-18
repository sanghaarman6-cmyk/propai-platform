export default function ProgressMeter({
  label,
  value,
  max,
  tone = "green",
}: {
  label: string
  value: number
  max: number
  tone?: "green" | "amber" | "red"
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span className="font-mono">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded bg-black/40">
        <div
          className={`h-2 rounded ${
            tone === "red"
              ? "bg-accent-red"
              : tone === "amber"
              ? "bg-accent-amber"
              : "bg-accent-green"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
