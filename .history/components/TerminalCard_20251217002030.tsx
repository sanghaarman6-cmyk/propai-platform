export default function TerminalCard({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded border border-border bg-bg-panel p-4">
      {title && (
        <div className="mb-3 text-xs font-mono text-text-muted">
          {title.toUpperCase()}
        </div>
      )}
      {children}
    </div>
  )
}
