"use client"

import TerminalCard from "@/components/TerminalCard"
import ProgressMeter from "@/components/ProgressMeter"
import TagPill from "@/components/TagPill"
import { useActiveAccount } from "@/lib/selectors/useActiveAccount"
import { computeDrawdownMetrics } from "@/lib/metrics/drawdown"

export default function LivePage() {
  const account = useActiveAccount()

  if (!account) {
    return (
      <TerminalCard title="Live">
        <div className="text-sm text-text-muted">
          No active MT5 account connected.
        </div>
      </TerminalCard>
    )
  }

  const { balance, equity, positions = [] } = account
  const { ddUsd, ddPct } = computeDrawdownMetrics(balance, equity)

  const openPositions = positions.length

  // Simple proximity logic (STEP 4 will replace this)
  const ddTone =
    ddPct > 80 ? "red" : ddPct > 60 ? "amber" : "green"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-text-muted">Mission Control</div>
        <h1 className="text-2xl font-semibold">Live Account</h1>
        <div className="mt-1 text-sm text-text-muted">
          Real-time MT5 monitoring (read-only)
        </div>
      </div>

      {/* Progress */}
      <TerminalCard title="Risk & Drawdown">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProgressMeter
            label="Current drawdown"
            value={ddUsd}
            max={balance}
            tone={ddTone}
          />

          <ProgressMeter
            label="Drawdown %"
            value={ddPct}
            max={100}
            tone={ddTone}
          />

          <ProgressMeter
            label="Equity vs Balance"
            value={equity}
            max={balance}
          />
        </div>
      </TerminalCard>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TerminalCard title="Current Exposure">
          <div className="space-y-2 text-sm">
            <div>
              Open positions:{" "}
              <span className="font-mono">{openPositions}</span>
            </div>
            <div>
              Balance:{" "}
              <span className="font-mono">
                ${balance.toLocaleString()}
              </span>
            </div>
            <div>
              Equity:{" "}
              <span className="font-mono">
                ${equity.toLocaleString()}
              </span>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard title="Risk Alerts">
          <div className="space-y-2 text-sm">
            {ddPct > 70 && (
              <TagPill tone="amber">
                Drawdown proximity rising
              </TagPill>
            )}
            {ddPct > 90 && (
              <TagPill tone="red">
                Critical drawdown level
              </TagPill>
            )}
            {ddPct < 50 && (
              <TagPill tone="green">
                No immediate risk
              </TagPill>
            )}
          </div>
        </TerminalCard>

        <TerminalCard title="AI Suggestions (Live)">
          <div className="space-y-2 text-sm">
            {ddPct > 70 && <div>• Reduce position size</div>}
            {openPositions > 2 && <div>• Avoid overexposure</div>}
            {ddPct < 50 && <div>• Conditions stable</div>}
          </div>
        </TerminalCard>
      </div>

      {/* Footer */}
      <TerminalCard title="Live Stats">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-text-muted">Equity</div>
            <div className="font-mono">
              ${Math.round(equity).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">Balance</div>
            <div className="font-mono">
              ${Math.round(balance).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">Drawdown</div>
            <div className="font-mono">
              {ddPct.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">Positions</div>
            <div className="font-mono">
              {openPositions}
            </div>
          </div>
        </div>
      </TerminalCard>
    </div>
  )
}
