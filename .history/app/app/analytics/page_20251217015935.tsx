export default function ChartBlock({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded border border-border bg-black/25 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{title}</div>
          {subtitle && <div className="mt-1 text-xs text-text-muted">{subtitle}</div>}
        </div>
        <div className="text-xs text-text-muted font-mono">UI-level chart</div>
      </div>

      <div className="mt-4 rounded border border-border bg-black/40 p-3">
        {children ? (
          children
        ) : (
          <div className="h-28 w-full rounded bg-black/40" />
        )}
      </div>
    </div>
  )
}
