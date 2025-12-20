"use client"

import TerminalCard from "@/components/TerminalCard"
import ProgressMeter from "@/components/ProgressMeter"
import TagPill from "@/components/TagPill"
import { useActiveAccount } from "@/lib/selectors/useActiveAccount"
import { computeDrawdownMetrics } from "@/lib/metrics/drawdown"
import { useAuthGuard } from "@/lib/hooks/useAuthGuard"


export default function LivePage() {
  /* ---------------------------------------------
     ROUTE + STATE HOOKS (ALWAYS FIRST)
  --------------------------------------------- */
  
  
  const account = useActiveAccount()

  /* ---------------------------------------------
     SAFE NORMALIZED VALUES
  --------------------------------------------- */
  const balance = account?.balance ?? 0
  const equity = account?.equity ?? 0
  const baseline = account?.baselineBalance ?? balance
  const currency = account?.currency ?? "USD"
  const positions = Array.isArray(account?.positions)
    ? account!.positions
    : []

  const history = Array.isArray(account?.history)
    ? account!.history
    : []

  /* ---------------------------------------------
     DERIVED METRICS (SAFE)
  --------------------------------------------- */
  const { ddUsd, ddPct } = computeDrawdownMetrics(
    history,
    balance
  )

  const openPositions = positions.length

  const ddTone =
    ddPct > 80 ? "red" : ddPct > 60 ? "amber" : "green"

  /* ---------------------------------------------
     EARLY RETURN (AFTER ALL HOOKS)
  --------------------------------------------- */
  if (!account) {
    return (
      <TerminalCard title="Live">
        <div className="text-sm text-text-muted">
          No active MT5 account connected.
        </div>
      </TerminalCard>
    )
  }

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-text-muted">
          Mission Control
        </div>
        <h1 className="text-2xl font-semibold">
          Live Account
        </h1>
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
            max={baseline}
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
              <span className="font-mono">
                {openPositions}
              </span>
            </div>
            <div>
              Balance:{" "}
              <span className="font-mono">
                {balance.toLocaleString()} {currency}
              </span>
            </div>
            <div>
              Equity:{" "}
              <span className="font-mono">
                {equity.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard title="Risk Alerts">
          <div className="space-y-2 text-sm">
            {ddPct > 90 && (
              <TagPill tone="red">
                Critical drawdown level
              </TagPill>
            )}
            {ddPct > 70 && ddPct <= 90 && (
              <TagPill tone="amber">
                Drawdown proximity rising
              </TagPill>
            )}
            {ddPct <= 50 && (
              <TagPill tone="green">
                No immediate risk
              </TagPill>
            )}
          </div>
        </TerminalCard>

        <TerminalCard title="AI Suggestions (Live)">
          <div className="space-y-2 text-sm">
            {ddPct > 70 && <div>• Reduce position size</div>}
            {openPositions > 2 && (
              <div>• Avoid overexposure</div>
            )}
            {ddPct < 50 && <div>• Conditions stable</div>}
          </div>
        </TerminalCard>
      </div>

      {/* Footer */}
      <TerminalCard title="Live Stats">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-text-muted">
              Equity
            </div>
            <div className="font-mono">
              {Math.round(equity).toLocaleString()}{" "}
              {currency}
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">
              Balance
            </div>
            <div className="font-mono">
              {Math.round(balance).toLocaleString()}{" "}
              {currency}
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">
              Drawdown
            </div>
            <div className="font-mono">
              {ddPct.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">
              Positions
            </div>
            <div className="font-mono">
              {openPositions}
            </div>
          </div>
        </div>
      </TerminalCard>
    </div>
  )
}
