"use client"

type RuleCardProps = {
  title: string
  description: string
  severity: "critical" | "warning" | "info"
  limit?: string | null
  ai_advice: string
}

const SEVERITY_STYLES: Record<
  RuleCardProps["severity"],
  {
    border: string
    label: string
    labelColor: string
  }
> = {
  critical: {
    border: "border-red-500",
    label: "CRITICAL",
    labelColor: "text-red-400",
  },
  warning: {
    border: "border-yellow-400",
    label: "WARNING",
    labelColor: "text-yellow-300",
  },
  info: {
    border: "border-cyan-400",
    label: "INFO",
    labelColor: "text-cyan-300",
  },
}

export default function RuleCard({
  title,
  description,
  severity,
  limit,
  ai_advice,
}: RuleCardProps) {
  const s = SEVERITY_STYLES[severity]

  return (
    <div
      className={`rounded-lg border ${s.border} bg-bg-secondary p-5 space-y-3`}
    >
      <div className={`text-xs font-semibold ${s.labelColor}`}>
        {s.label}
      </div>

      <div className="text-white font-semibold text-sm">
        {title}
      </div>

      <div className="text-sm text-text-muted">
        {description}
      </div>

      {limit && (
        <div className="text-xs text-text-muted">
          <span className="font-medium text-white">Limit:</span>{" "}
          {limit}
        </div>
      )}

      <div className="mt-2 rounded bg-bg-primary p-3 text-xs">
        <span className="text-text-muted">AI Advice:</span>
        <div className="text-white mt-1">
          {ai_advice}
        </div>
      </div>
    </div>
  )
}
