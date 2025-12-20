"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useMT5Store } from "@/lib/mt5Store"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  )
}

export default function AccountsPage() {
  const router = useRouter()

  const accounts = useMT5Store((s) => s.accounts)
  const activeId = useMT5Store((s) => s.activeAccountId)
  const setActive = useMT5Store((s) => s.setActiveAccount)
  const removeAccount = useMT5Store((s) => s.removeAccount)

  async function handleDelete(id: string, isActive: boolean) {
    if (isActive) {
      alert("You cannot delete the active account.")
      return
    }

    if (!id || !isUuid(id)) {
      alert(
        "This account is not a persisted Supabase account and cannot be deleted."
      )
      return
    }

    const ok = confirm(
      "Delete this trading account? This cannot be undone."
    )
    if (!ok) return

    const res = await fetch(`/api/accounts/${id}`, {
      method: "DELETE",
    })

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      alert(payload?.error || "Delete failed")
      return
    }

    removeAccount(id)
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            Trading Accounts
          </h1>

          <GlowButton
            onClick={() =>
              router.push("/onboarding/connect-account")
            }
          >
            + Add Account
          </GlowButton>
        </div>

        {accounts.length === 0 && (
          <TerminalCard title="No Accounts">
            <p className="text-text-muted text-sm">
              You haven’t added any trading accounts yet.
            </p>
          </TerminalCard>
        )}

        {accounts.map((account) => {
          const isActive = account.id === activeId

          return (
            <TerminalCard
              key={account.id}
              title={
                <div className="flex items-center justify-between gap-3">
                  <span>{account.firmDetected ?? "Unknown Firm"}</span>

                  <div className="flex items-center gap-3">
                    {isActive && (
                      <span className="text-xs text-green-400">
                        ACTIVE
                      </span>
                    )}

                    <button
                      disabled={isActive}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(account.id, isActive)
                      }}
                      className={`text-xs ${
                        isActive
                          ? "cursor-not-allowed text-gray-500"
                          : "text-red-400 hover:text-red-300"
                      }`}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Account</p>
                  <p className="text-white">{account.name ?? "—"}</p>
                </div>

                <div>
                  <p className="text-text-muted">Login</p>
                  <p className="text-white">{account.login ?? "—"}</p>
                </div>

                <div>
                  <p className="text-text-muted">Balance</p>
                  <p className="text-white">
                    {account.balance?.toLocaleString() ?? "—"}{" "}
                    {account.currency}
                  </p>
                </div>

                <div>
                  <p className="text-text-muted">Equity</p>
                  <p className="text-white">
                    {account.equity?.toLocaleString() ?? "—"}{" "}
                    {account.currency}
                  </p>
                </div>

                <div>
                  <p className="text-text-muted">Status</p>
                  <p
                    className={
                      account.status === "connected"
                        ? "text-green-400"
                        : account.status === "error"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {account.status ?? "unknown"}
                  </p>
                </div>
              </div>

              {!isActive && (
                <div className="mt-4">
                  <GlowButton
                    onClick={() => setActive(account.id)}
                  >
                    Switch to this account
                  </GlowButton>
                </div>
              )}
            </TerminalCard>
          )
        })}
      </motion.div>
    </div>
  )
}
