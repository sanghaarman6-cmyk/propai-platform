import type { RuleViolation } from "@/lib/types"
import TagPill from "@/components/TagPill"

function sevTone(sev: RuleViolation["severity"]) {
  if (sev === "high") return "red"
  if (sev === "med") return "amber"
  return "neutral"
}

export default function ViolationsLog({ items }: { items: RuleViolation[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded border border-border bg-black/30 p-4 text-sm text-text-muted">
        No rule violations logged for this challenge.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((v) => (
        <div
          key={v.id}
          className="rounded border border-border bg-black/30 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{v.title}</div>
              <div className="mt-1 text-xs text-text-muted">{v.detail}</div>
              <div className="mt-2 text-[11px] text-text-muted font-mono">
                {new Date(v.tsISO).toLocaleString()} · {v.type}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <TagPill tone={sevTone(v.severity) as any}>{v.severity.toUpperCase()}</TagPill>
              <TagPill tone={v.resolved ? "green" : "amber"}>
                {v.resolved ? "RESOLVED" : "ACTIVE"}
              </TagPill>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
