"use client"

import { useMemo, useState } from "react"
import TerminalCard from "@/components/TerminalCard"
import Drawer from "@/components/Drawer"
import TagPill from "@/components/TagPill"
import { useAppStore } from "@/lib/store"
import type { Trade } from "@/lib/types"

function rowTone(t: Trade) {
  if (t.outcome === "Win") return "text-accent-green"
  if (t.outcome === "Loss") return "text-accent-red"
  return "text-text-muted"
}

export default function TradesPage() {
  const { recentTrades } = useAppStore()
  const [selected, setSelected] = useState<Trade | null>(null)

  const instruments = useMemo(
    () => Array.from(new Set(recentTrades.map((t) => t.instrument))),
    [recentTrades]
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-text-muted">Journal</div>
        <h1 className="text-2xl font-semibold">Trade Journal</h1>
        <div className="mt-1 text-sm text-text-muted">
          All trades across accounts, enriched with AI review.
        </div>
      </div>

      <TerminalCard title="Trades">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-text-muted">
              <tr>
                <th className="px-2 py-2 text-left">Time</th>
                <th className="px-2 py-2">Instrument</th>
                <th className="px-2 py-2">Dir</th>
                <th className="px-2 py-2">R</th>
                <th className="px-2 py-2">Session</th>
                <th className="px-2 py-2">Setup</th>
                <th className="px-2 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="cursor-pointer border-t border-border hover:bg-black/40"
                >
                  <td className="px-2 py-2 font-mono text-xs">
                    {new Date(t.tsISO).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-center">{t.instrument}</td>
                  <td className="px-2 py-2 text-center">{t.direction}</td>
                  <td className={`px-2 py-2 text-center font-mono ${rowTone(t)}`}>
                    {t.rMultiple.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-center">{t.session}</td>
                  <td className="px-2 py-2 text-center">{t.setupTag}</td>
                  <td className="px-2 py-2 text-center">
                    <TagPill
                      tone={
                        t.outcome === "Win"
                          ? "green"
                          : t.outcome === "Loss"
                          ? "red"
                          : "neutral"
                      }
                    >
                      {t.outcome}
                    </TagPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentTrades.length === 0 && (
            <div className="p-6 text-sm text-text-muted">
              No trades yet. Connect an account or import CSV.
            </div>
          )}
        </div>
      </TerminalCard>

      {/* Trade Detail Drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.instrument} · ${selected.setupTag}` : ""}
      >
        {selected && (
          <div className="space-y-4">
            <TerminalCard title="Trade Snapshot">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-text-muted">Direction</div>
                  <div>{selected.direction}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Session</div>
                  <div>{selected.session}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">Duration</div>
                  <div>{selected.durationMin} min</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted">R multiple</div>
                  <div className="font-mono">{selected.rMultiple.toFixed(2)}</div>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard title="MFE / MAE (mock)">
              <div className="space-y-2 text-xs">
                <Bar label="MFE" value={Math.max(0, selected.rMultiple + 0.6)} />
                <Bar label="MAE" value={Math.min(0, selected.rMultiple - 0.8)} />
              </div>
            </TerminalCard>

            <TerminalCard title="AI Review">
              <div className="text-sm">
                Entry timing aligned with session edge, but size consistency
                dropped after prior loss. Expectancy remains positive when
                holding losers shorter.
              </div>
              <ul className="mt-2 list-disc pl-5 text-xs text-text-muted">
                <li>Reduce size after loss</li>
                <li>Delay NY re-entries</li>
                <li>Tag impulse setups</li>
              </ul>
            </TerminalCard>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.abs(value) * 40)
  const positive = value >= 0

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(2)}R</span>
      </div>
      <div className="h-2 w-full rounded bg-black/40">
        <div
          className={`h-2 rounded ${
            positive ? "bg-accent-green" : "bg-accent-red"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
