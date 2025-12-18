"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import { useMT5Store } from "@/lib/mt5Store"

export default function ConnectMT5Page() {
  const addAccount = useMT5Store((s) => s.addAccount)
  const updateAccount = useMT5Store((s) => s.updateAccount)
  const accounts = useMT5Store((s) => s.accounts)

  useEffect(() => {
    if (accounts.length === 0) return

    const account = accounts[0] // single account for now
    if (account.status !== "connected") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/mt5/sync")
        if (!res.ok) return

        const data = await res.json()

        updateAccount(account.id, {
          positions: data.account.positions,
          history: data.account.history,
          balance: data.account.balance,
          equity: data.account.equity,
        })
      } catch {}
    }, 10_000)

    return () => clearInterval(interval)
  }, [accounts, updateAccount])



  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setError(null)
    setLoading(true)

    const id = crypto.randomUUID()

    addAccount({
      id,
      userId: "demo-user",
      status: "connecting",
    })


    try {
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
      })

      if (!res.ok) throw new Error("Connection failed")

      const data = await res.json()

      updateAccount(id, {
        status: "connected",
        login: data.login,
        server: data.server,
        name: data.name,
        balance: data.balance,
        equity: data.equity,
        currency: data.currency,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
      updateAccount(id, { status: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <TerminalCard title="Connect MT5 Account">
          <div className="space-y-4 text-sm">
            <p className="text-text-muted">
              This will connect to a live MT5 account via our secure bridge.
            </p>

            {error && (
              <div className="text-xs text-red-400">{error}</div>
            )}

            <GlowButton
              onClick={connect}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Connecting..." : "Test MT5 Connection"}
            </GlowButton>

            {accounts.length > 0 && (
              <div className="mt-4 space-y-2 text-xs">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="rounded border border-border bg-black/40 p-3"
                  >
                    <div>Status: {a.status}</div>

                    {a.status === "connected" && (
                      <>
                        <div className="text-text-muted">
                          {a.name}
                        </div>
                        <div>
                          Balance: {a.balance} {a.currency}
                        </div>
                        <div>
                          Equity: {a.equity}
                        </div>
                      </>
                    )}

                    {a.status === "error" && (
                      <div className="text-red-400">
                        Connection failed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}


            <div className="text-xs text-text-muted">
              Read-only access. No trades can be placed.
            </div>
          </div>
        </TerminalCard>
      </motion.div>
    </div>
  )
}
