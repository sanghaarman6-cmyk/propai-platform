import type { ChallengeDay } from "@/lib/types"
import clsx from "clsx"

export default function ChallengeTimeline({
  days,
}: {
  days: ChallengeDay[]
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-text-muted">Timeline (daily performance)</div>
      <div className="flex flex-wrap gap-2">
        {days.map((d) => {
          const tone =
            d.pnlUsd > 0 ? "green" : d.pnlUsd < 0 ? "red" : "neutral"
          return (
            <div
              key={`${d.dayIndex}-${d.dateISO}`}
              className={clsx(
                "w-20 rounded border p-2",
                tone === "green" && "border-accent-green/30 bg-black/40",
                tone === "red" && "border-accent-red/30 bg-black/40",
                tone === "neutral" && "border-border bg-black/30"
              )}
              title={`${d.dateISO} · Trades ${d.trades}${d.note ? ` · ${d.note}` : ""}`}
            >
              <div className="text-[10px] text-text-muted font-mono">
                D{d.dayIndex}
              </div>
              <div className="mt-1 font-mono text-sm">
                {d.pnlUsd >= 0 ? "+" : ""}
                {Math.round(d.pnlUsd)}
              </div>
              <div className="text-[10px] text-text-muted">
                {d.trades} trades
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
