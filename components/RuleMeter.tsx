export default function RuleMeter({
  label,
  valuePct,
  helper,
}: {
  label: string
  valuePct: number // 0–100 where higher = worse risk
  helper: string
}) {
  const clamped = Math.max(0, Math.min(100, valuePct))
  const bar = 100 - clamped

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span className="font-mono">{helper}</span>
      </div>
      <div className="h-2 rounded bg-black/50 border border-border overflow-hidden">
        <div className="h-full bg-accent-green" style={{ width: `${bar}%` }} />
      </div>
    </div>
  )
}
