import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import type { Trade } from "@/lib/types"

function outcomeTone(o: Trade["outcome"]) {
  if (o === "Win") return "green"
  if (o === "Loss") return "red"
  return "neutral"
}

export default function TradesTable({
  trades,
  filtersUI,
}: {
  trades: Trade[]
  filtersUI: React.ReactNode
}) {
  return (
    <TerminalCard title="Recent Trades">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs text-text-muted">
          Last {trades.length} trades · filter to demo “real product” feel
        </div>
        {filtersUI}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-text-muted">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-normal">Time</th>
              <th className="py-2 text-left font-normal">Instrument</th>
              <th className="py-2 text-left font-normal">Dir</th>
              <th className="py-2 text-left font-normal">R</th>
              <th className="py-2 text-left font-normal">Session</th>
              <th className="py-2 text-left font-normal">Setup</th>
              <th className="py-2 text-left font-normal">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-border/60 hover:bg-black/30">
                <td className="py-2 text-xs text-text-muted">
                  {new Date(t.tsISO).toLocaleString()}
                </td>
                <td className="py-2 font-mono">{t.instrument}</td>
                <td className="py-2">{t.direction}</td>
                <td className="py-2 font-mono">{t.rMultiple.toFixed(2)}</td>
                <td className="py-2">{t.session}</td>
                <td className="py-2 text-xs text-text-muted">{t.setupTag}</td>
                <td className="py-2">
                  <TagPill tone={outcomeTone(t.outcome) as any}>{t.outcome}</TagPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TerminalCard>
  )
}
