"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import GlowButton from "@/components/GlowButton"
import TerminalCard from "@/components/TerminalCard"
import { useMT5Store } from "@/lib/mt5Store"

/* -------------------------------------------------------------------------- */
/*                               UI Helpers                                   */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-border bg-bg-secondary">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-muted" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function ProgressBar({
  label,
  usedPct,
  remainingLabel,
}: {
  label: string
  usedPct: number
  remainingLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{usedPct}% used</span>
      </div>
      <div className="h-2 w-full rounded-full bg-bg-muted overflow-hidden">
        <div
          className={`h-full ${
            usedPct > 85
              ? "bg-red-500"
              : usedPct > 65
              ? "bg-yellow-400"
              : "bg-green-500"
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="text-xs text-text-muted">{remainingLabel}</div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status?: "safe" | "warn" | "danger"
}) {
  const color =
    status === "danger"
      ? "text-red-400"
      : status === "warn"
      ? "text-yellow-400"
      : "text-green-400"

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Page                                        */
/* -------------------------------------------------------------------------- */

export default function RulesPage() {
  const accounts = useMT5Store((s) => s.accounts)
  const activeAccountId = useMT5Store((s) => s.activeAccountId)

  const [selectedAccountId, setSelectedAccountId] = useState<
    string | "all"
  >(activeAccountId ?? "all")

  const [snapshot, setSnapshot] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAccount = useMemo(() => {
    if (selectedAccountId === "all") return null
    return accounts.find((a) => a.id === selectedAccountId) ?? null
  }, [accounts, selectedAccountId])

  async function loadSnapshot(accountId: string) {
    setLoading(true)
    setError(null)
    setSnapshot(null)

    try {
      const res = await fetch(
        `/api/rules/snapshot?accountId=${accountId}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load rules")
      setSnapshot(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">
            Prop Firm Rules
          </h1>
          <p className="text-sm text-text-muted">
            Understand your limits and stay compliant
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex flex-wrap gap-3">
          <GlowButton onClick={() => setSelectedAccountId("all")}>
            All Accounts
          </GlowButton>

          {accounts.map((a) => (
            <GlowButton
              key={a.id}
              onClick={() => {
                setSelectedAccountId(a.id)
                loadSnapshot(a.id)
              }}
            >
              {a.name ?? a.label ?? a.login}
            </GlowButton>
          ))}
        </div>

        {!selectedAccount && (
          <TerminalCard title="Rules">
            <div className="text-sm text-text-muted">
              Select an account to view rules.
            </div>
          </TerminalCard>
        )}

        {loading && (
          <div className="text-sm text-text-muted">
            Calculating rule compliance…
          </div>
        )}

        {error && <div className="text-sm text-red-400">{error}</div>}

        {snapshot && selectedAccount && (
          <>
            {/* Account Context */}
            <div className="rounded-xl border border-border bg-bg-secondary p-5">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    {snapshot.firm_key} · {snapshot.phase}
                  </div>
                  <div className="text-xs text-text-muted">
                    Account: {selectedAccount.name ?? selectedAccount.login}
                  </div>
                </div>
                <div className="text-sm text-green-400">● Compliant</div>
              </div>
            </div>

            {/* Risk Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBlock
                label="Max Drawdown Remaining"
                value={`$${snapshot.headroom.max_dd_remaining_usd?.toFixed(0)} (${snapshot.headroom.max_dd_remaining_pct?.toFixed(2)}%)`}
              />
              <StatBlock
                label="Daily Loss Remaining"
                value={`$${snapshot.headroom.daily_loss_remaining_usd?.toFixed(0)} (${snapshot.headroom.daily_loss_remaining_pct?.toFixed(2)}%)`}
                status="warn"
              />
              <StatBlock
                label="Consistency Status"
                value={snapshot.headroom.consistency_status.toUpperCase()}
                status="safe"
              />
            </div>

            {/* Sections */}
            <Section title="Account Survival Rules" defaultOpen>
              <div className="space-y-5">
                {snapshot.sections.survival.map((r: any) => (
                  <ProgressBar
                    key={r.id}
                    label={r.label}
                    usedPct={r.used_pct}
                    remainingLabel={r.remaining_label}
                  />
                ))}
              </div>
            </Section>

            <Section title="Trading Behaviour Rules" defaultOpen>
              <div className="space-y-3 text-sm">
                {snapshot.sections.behavior.map((r: any) => (
                  <div key={r.id}>
                    {r.label}:{" "}
                    <span className="text-text-muted">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* AI Insight */}
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
              <div className="text-sm font-medium text-yellow-400">
                AI Risk Insight
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {snapshot.ai_insight.message}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Recommendation: {snapshot.ai_insight.recommendation}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
