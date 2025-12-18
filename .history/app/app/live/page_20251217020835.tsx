"use client"

import { useMemo } from "react"
import TerminalCard from "@/components/TerminalCard"
import ProgressMeter from "@/components/ProgressMeter"
import TagPill from "@/components/TagPill"
import GlowButton from "@/components/GlowButton"
import { useAppStore } from "@/lib/store"
import type { Challenge } from "@/lib/types"

export default function LivePage() {
  const {
    challenges,
    activeChallenge,
    setActiveChallengeById,
    simulateTrade,
  } = useAppStore()

  const liveChallenges = challenges.filter((c) => c.status === "in_progress")
  const c = activeChallenge

  if (!c || !c.live) {
    return (
      <TerminalCard title="Live Challenge">
        <div className="text-sm text-text-muted">
          No live challenge selected.
        </div>
      </TerminalCard>
    )
  }

  const rules = c.rules
  const live = c.live

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs text-text-muted">Mission Control</div>
          <h1 className="text-2xl font-semibold">
            Live Challenge: {c.phase}
          </h1>
          <div className="mt-1 text-sm text-text-muted">
            Real-time rule proximity and AI coaching (read-only).
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={c.id}
            onChange={(e) => setActiveChallengeById(e.target.value)}
            className="rounded border border-border bg-black px-3 py-2 text-sm"
          >
            {liveChallenges.map((x) => (
              <option key={x.id} value={x.id}>
                {x.firmName} · {x.name}
              </option>
            ))}
          </select>

          <GlowButton onClick={simulateTrade}>
            Simulate Trade
          </GlowButton>
        </div>
      </div>

      {/* Progress */}
      <TerminalCard title="Progress & Limits">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProgressMeter
            label="Profit target progress"
            value={rules.profitTargetPct * rules.accountSize / 100 - live.profitTargetRemainingUsd}
            max={rules.profitTargetPct * rules.accountSize / 100}
          />
          <ProgressMeter
            label="Daily loss used"
            value={rules.dailyLossLimitPct * rules.accountSize / 100 - live.dailyLossRemainingUsd}
            max={rules.dailyLossLimitPct * rules.accountSize / 100}
            tone="amber"
          />
          <ProgressMeter
            label="Max loss used"
            value={rules.maxLossLimitPct * rules.accountSize / 100 - live.maxLossBufferUsd}
            max={rules.maxLossLimitPct * rules.accountSize / 100}
            tone="red"
          />
        </div>
      </TerminalCard>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TerminalCard title="Current Exposure">
          <div className="space-y-2 text-sm">
            <div>Open positions: <span className="font-mono">2</span></div>
            <div>Net exposure: <span className="font-mono">$18,000</span></div>
            <div>Risk per trade: <span className="font-mono">0.45R</span></div>
          </div>
        </TerminalCard>

        <TerminalCard title="Risk Alerts">
          <div className="space-y-2 text-sm">
            <TagPill tone="amber">Daily DD proximity rising</TagPill>
            <TagPill tone="neutral">NY session volatility elevated</TagPill>
            <TagPill tone="green">No rule breaches</TagPill>
          </div>
        </TerminalCard>

        <TerminalCard title="AI Suggestions (Now)">
          <div className="space-y-2 text-sm">
            <div>• Reduce size after next loss</div>
            <div>• Avoid re-entry in first 15m</div>
            <div>• Consider stopping after +1R</div>
          </div>
        </TerminalCard>
      </div>

      {/* Footer */}
      <TerminalCard title="Live Stats">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-text-muted">Equity</div>
            <div className="font-mono">${Math.round(live.equityUsd).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Profit remaining</div>
            <div className="font-mono">${Math.round(live.profitTargetRemainingUsd)}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Daily loss left</div>
            <div className="font-mono">${Math.round(live.dailyLossRemainingUsd)}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Rule risk score</div>
            <div className="font-mono">{c.stats.ruleRiskScore}</div>
          </div>
        </div>
      </TerminalCard>
    </div>
  )
}
