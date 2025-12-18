import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import type { AiInsight } from "@/lib/types"

function severityTone(sev: AiInsight["severity"]) {
  if (sev === "high") return "red"
  if (sev === "med") return "amber"
  return "green"
}

export default function InsightsList({ items }: { items: AiInsight[] }) {
  return (
    <TerminalCard title="AI Insights">
      <div className="space-y-3">
        {items.map((ins) => (
          <div key={ins.id} className="rounded border border-border bg-black/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{ins.title}</div>
                <div className="mt-1 text-xs text-text-muted">{ins.detail}</div>
              </div>
              <TagPill tone={severityTone(ins.severity) as any}>
                {ins.severity.toUpperCase()}
              </TagPill>
            </div>

            <div className="mt-3 text-xs">
              <span className="text-text-muted">Suggested: </span>
              <span className="text-text-primary">{ins.suggestedAction}</span>
            </div>

            {ins.relatedMetric && (
              <div className="mt-2 text-[11px] text-text-muted">
                Related: <span className="font-mono">{ins.relatedMetric}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </TerminalCard>
  )
}
