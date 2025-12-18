"use client"

import { motion } from "framer-motion"
import clsx from "clsx"
import TerminalCard from "@/components/TerminalCard"
import { useAccountHubStore } from "@/lib/accountHubStore"

/* -------------------------
   UI helpers
-------------------------- */

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "breached"
      ? "bg-red-500/10 text-red-400 border-red-500/30"
      : status === "at_risk"
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
      : "bg-green-500/10 text-green-400 border-green-500/30"

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

/* -------------------------
   Page
-------------------------- */

export default function AccountsDashboardPage() {
  const accounts = useAccountHubStore((s) => s.accounts)
  const selectedId = useAccountHubStore((s) => s.selectedAccountId)
  const setSelected = useAccountHubStore((s) => s.setSelectedAccount)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="text-xs text-text-muted">Accounts</div>
        <h1 className="text-2xl font-semibold">MT5 Prop Accounts</h1>
      </div>

      {accounts.length === 0 ? (
        <TerminalCard title="No accounts connected">
          <div className="text-sm text-text-muted">
            Connect an MT5 account to start live tracking, risk monitoring,
            and AI coaching.
          </div>
        </TerminalCard>
      ) : (
        <TerminalCard title="Connected Accounts">
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelected(acc.id)}
                className={clsx(
                  "grid grid-cols-12 items-center gap-3 rounded border p-3 cursor-pointer transition",
                  selectedId === acc.id
                    ? "border-accent-cyan bg-accent-cyan/5"
                    : "border-border bg-black/30 hover:bg-black/40"
                )}
              >
                {/* Account / Firm */}
                <div className="col-span-3">
                  <div className="text-sm font-medium">
                    {acc.name ?? "MT5 Account"}
                  </div>
                  <div className="text-xs text-text-muted">
                    {acc.firmDetected ?? "Unknown prop firm"}
                  </div>
                </div>

                {/* Phase */}
                <div className="col-span-2 text-sm">
                  {acc.metrics.phase}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={acc.metrics.status} />
                </div>

                {/* Daily DD */}
                <div className="col-span-2 text-sm font-mono">
                  {acc.metrics.ddTodayPct !== undefined
                    ? `${acc.metrics.ddTodayPct.toFixed(1)}%`
                    : "—"}
                </div>

                {/* Max DD */}
                <div className="col-span-2 text-sm font-mono">
                  {acc.metrics.ddTotalPct !== undefined
                    ? `${acc.metrics.ddTotalPct.toFixed(1)}%`
                    : "—"}
                </div>

                {/* Equity */}
                <div className="col-span-1 text-sm font-mono">
                  {acc.metrics.equity
                    ? `$${acc.metrics.equity.toLocaleString()}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </TerminalCard>
      )}
    </motion.div>
  )
}
