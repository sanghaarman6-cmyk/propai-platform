"use client"

import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import { useAccountHubStore } from "@/lib/accountHubStore"

import clsx from "clsx"

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Failed"
      ? "bg-red-500/10 text-red-400 border-red-500/30"
      : status === "Funded"
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"

  return (
    <span
      className={clsx(
        "rounded border px-2 py-0.5 text-xs font-medium",
        color
      )}
    >
      {status}
    </span>
  )
}

function FailureChip({ reason }: { reason: string }) {
  return (
    <span className="rounded bg-accent-cyan/10 px-2 py-0.5 text-xs text-accent-cyan">
      {reason}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-border">
      <div
        className="h-full bg-accent-cyan"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  )
}

export default function AccountsDashboardPage() {
  const { accounts } = useAccountHubStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-text-muted">Accounts</div>
          <h1 className="text-2xl font-semibold">Prop Accounts</h1>
        </div>
      </div>

      {accounts.length === 0 ? (
        <TerminalCard title="No accounts yet">
          <div className="text-sm text-text-muted">
            Add your first prop account to start receiving AI diagnostics.
          </div>
        </TerminalCard>
      ) : (
        <TerminalCard title="Your Accounts">
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="grid grid-cols-12 items-center gap-3 rounded border border-border bg-black/30 p-3 hover:bg-black/40"
              >
                {/* Firm */}
                <div className="col-span-2">
                  <div className="text-sm font-medium">{acc.firm_name}</div>
                  <div className="text-xs text-text-muted">
                    {acc.account_size
                      ? `$${acc.account_size.toLocaleString()}`
                      : "—"}
                  </div>
                </div>

                {/* Phase */}
                <div className="col-span-2 text-sm">
                  {acc.phase}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={acc.status} />
                </div>

                {/* Failure Reason */}
                <div className="col-span-3 space-x-1">
                  {acc.failure_analysis ? (
                    <FailureChip
                      reason={acc.failure_analysis.primary_reason}
                    />
                  ) : (
                    <span className="text-xs text-text-muted">
                      No diagnosis
                    </span>
                  )}
                </div>

                {/* Confidence */}
                <div className="col-span-3">
                  <ConfidenceBar value={acc.inferred.confidence} />
                  <div className="mt-1 text-[10px] text-text-muted">
                    Confidence {Math.round(acc.inferred.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TerminalCard>
      )}
    </motion.div>
  )
}
