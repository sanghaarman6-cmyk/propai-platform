"use client"

import Link from "next/link"
import TerminalCard from "@/components/TerminalCard"
import ChallengeStatusBadge from "@/components/ChallengeStatusBadge"
import ChallengeTimeline from "@/components/ChallengeTimeline"
import ViolationsLog from "@/components/ViolationsLog"
import { useAppStore } from "@/lib/store"
import type { Challenge } from "@/lib/types"

function firmKey(c: Challenge) {
  return `${c.firmId}__${c.firmName}`
}

export default function ChallengesPage() {
  const { challenges, challengesUI, setChallengesUI, getSelectedChallenge } =
    useAppStore()

  const firms = Array.from(
    new Map(challenges.map((c) => [firmKey(c), { id: c.firmId, name: c.firmName }])).values()
  )

  const filtered = challengesUI.selectedFirmId === "All"
    ? challenges
    : challenges.filter((c) => c.firmId === challengesUI.selectedFirmId)

  const selected = getSelectedChallenge() || filtered[0] || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-text-muted">Challenges</div>
          <h1 className="text-2xl font-semibold">Challenge History</h1>
          <div className="mt-1 text-sm text-text-muted">
            Multi-firm, multi-challenge tracking with rule-aware diagnostics.
          </div>
        </div>

        <Link
          href="/app/challenges/new"
          className="rounded bg-accent-green px-4 py-2 text-black hover:shadow-glow"
        >
          Add new challenge
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: firms + challenges list */}
        <TerminalCard title="Firms & Challenges">
          <div className="flex items-center gap-2">
            <select
              value={challengesUI.selectedFirmId}
              onChange={(e) =>
                setChallengesUI({
                  selectedFirmId: e.target.value as any,
                  selectedChallengeId: null,
                })
              }
              className="w-full rounded border border-border bg-black px-2 py-1 text-xs"
            >
              <option value="All">All firms</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((c) => {
              const active = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setChallengesUI({ selectedChallengeId: c.id })}
                  className={`w-full rounded border p-3 text-left transition ${
                    active
                      ? "border-accent-green/40 bg-black/40"
                      : "border-border bg-black/30 hover:bg-black/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="mt-1 text-xs text-text-muted">
                        {c.firmName} · {c.phase}
                      </div>
                    </div>
                    <ChallengeStatusBadge status={c.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span className="font-mono">
                      {c.stats.pnlUsd >= 0 ? "+" : ""}
                      ${c.stats.pnlUsd.toLocaleString()}
                    </span>
                    <span className="font-mono">{c.stats.tradingDaysCompleted}d</span>
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="rounded border border-border bg-black/30 p-4 text-sm text-text-muted">
                No challenges found. Add your first challenge to begin tracking.
              </div>
            )}
          </div>
        </TerminalCard>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <TerminalCard title="Challenge Summary">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold">{selected.name}</div>
                    <div className="mt-1 text-sm text-text-muted">
                      {selected.firmName} · {selected.phase} · Started{" "}
                      <span className="font-mono">
                        {new Date(selected.startDateISO).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChallengeStatusBadge status={selected.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">PnL</div>
                    <div className="mt-1 font-mono text-lg">
                      {selected.stats.pnlUsd >= 0 ? "+" : ""}
                      ${selected.stats.pnlUsd.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Win rate</div>
                    <div className="mt-1 font-mono text-lg">{selected.stats.winRate}%</div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Profit factor</div>
                    <div className="mt-1 font-mono text-lg">{selected.stats.profitFactor.toFixed(2)}</div>
                  </div>
                  <div className="rounded border border-border bg-black/30 p-3">
                    <div className="text-xs text-text-muted">Rule risk</div>
                    <div className="mt-1 font-mono text-lg">{selected.stats.ruleRiskScore}</div>
                  </div>
                </div>
              </TerminalCard>

              <TerminalCard title="Timeline & Violations">
                <ChallengeTimeline days={selected.timeline} />

                <div className="mt-6">
                  <div className="mb-2 text-xs text-text-muted">Rule violations</div>
                  <ViolationsLog items={selected.violations} />
                </div>
              </TerminalCard>

              <TerminalCard title="Rules Snapshot">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <div className="text-xs text-text-muted">Account size</div>
                    <div className="font-mono">${selected.rules.accountSize.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Profit target</div>
                    <div className="font-mono">{selected.rules.profitTargetPct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Daily loss</div>
                    <div className="font-mono">{selected.rules.dailyLossLimitPct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Max loss</div>
                    <div className="font-mono">{selected.rules.maxLossLimitPct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Min days</div>
                    <div className="font-mono">{selected.rules.minTradingDays}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Time limit</div>
                    <div className="font-mono">{selected.rules.timeLimitDays}d</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-text-muted">
                  Instruments allowed:{" "}
                  <span className="font-mono text-text-primary">
                    {selected.rules.instrumentsAllowed.join(", ")}
                  </span>
                </div>
              </TerminalCard>
            </>
          ) : (
            <TerminalCard title="Select a challenge">
              <div className="text-sm text-text-muted">
                Choose a firm and challenge from the left to view details.
              </div>
            </TerminalCard>
          )}
        </div>
      </div>
    </div>
  )
}
