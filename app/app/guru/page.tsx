"use client"

import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import { useAppStore } from "@/lib/store"
import { useGuruStore } from "@/lib/guruStore"

export default function GuruPage() {
  const { user, activeChallenge } = useAppStore()
  const { suggestedPrompts } = useGuruStore()

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-text-muted">Guru</div>
        <h1 className="text-2xl font-semibold">Ask the Guru</h1>
        <div className="mt-1 text-sm text-text-muted">
          Prompt library, playbooks, and what the Guru “remembers” about you (mock).
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TerminalCard title="Prompt Library">
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p) => (
              <TagPill key={p} tone="neutral">
                {p}
              </TagPill>
            ))}
          </div>
          <div className="mt-4 text-sm text-text-muted">
            Use the always-on panel to run these instantly.
          </div>
        </TerminalCard>

        <TerminalCard title="Playbooks">
          <div className="space-y-2 text-sm">
            <div className="rounded border border-border bg-black/30 p-3">
              <div className="font-medium">Rule Safety Protocol</div>
              <div className="mt-1 text-xs text-text-muted">
                Daily DD defense, stop rules, session boundaries.
              </div>
            </div>
            <div className="rounded border border-border bg-black/30 p-3">
              <div className="font-medium">Phase 1 Passing Plan</div>
              <div className="mt-1 text-xs text-text-muted">
                7-day schedule, risk caps, trade limits.
              </div>
            </div>
            <div className="rounded border border-border bg-black/30 p-3">
              <div className="font-medium">Psychology Reset</div>
              <div className="mt-1 text-xs text-text-muted">
                Tilt detection, cooldown rules, revenge trading interrupts.
              </div>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard title="Memory (mock)">
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs text-text-muted">Trader</div>
              <div className="font-mono">{user?.name ?? "Unknown"}</div>
            </div>

            <div>
              <div className="text-xs text-text-muted">Current challenge</div>
              <div className="font-mono">
                {activeChallenge ? `${activeChallenge.firmName} · ${activeChallenge.phase}` : "None"}
              </div>
            </div>

            <div className="rounded border border-border bg-black/30 p-3 text-xs text-text-muted">
              Patterns detected (mock):
              <div className="mt-2 space-y-1">
                <div>• Higher variance during NY open</div>
                <div>• Better expectancy in London AM</div>
                <div>• Rule proximity spikes after 2 consecutive losses</div>
              </div>
            </div>
          </div>
        </TerminalCard>
      </div>

      <TerminalCard title="Tip">
        <div className="text-sm text-text-muted">
          The Guru panel is always on the right. Use it while browsing Dashboard, Trades, Analytics, or Live.
        </div>
      </TerminalCard>
    </div>
  )
}
