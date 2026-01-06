export default function KPI({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded border border-border bg-bg-panel p-4 overflow-hidden">
      <div className="text-xs text-text-muted">{label}</div>

      <div
        className={`mt-1 font-mono text-lg sm:text-xl truncate ${
          accent ? "text-accent-green" : "text-white"
        }`}
        title={value} // hover shows full value
      >
        {value}
      </div>
    </div>
  )
}
