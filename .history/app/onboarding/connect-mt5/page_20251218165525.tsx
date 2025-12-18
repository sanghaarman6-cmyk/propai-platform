"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import { useMT5Store } from "@/lib/mt5Store"

const ConnectMT5Page = () => {
  const addOrUpdateAccount = useMT5Store(
    (s) => s.addOrUpdateAccount
  )
  const accounts = useMT5Store((s) => s.accounts)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length === 0) return
    const account = accounts[0]
    if (account.status !== "connected") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/mt5/sync")
        if (!res.ok) return
        const data = await res.json()

        addOrUpdateAccount({
          id: account.id,
          balance: data.account.balance,
          equity: data.account.equity,
          positions: data.account.positions,
          history: data.account.history,
        } as any)
      } catch {}
    }, 10_000)

    return () => clearInterval(interval)
  }, [accounts, addOrUpdateAccount])

  async function connect() {
    setError(null)
    setLoading(true)

    const existing = accounts[0]
    const id = existing?.id ?? crypto.randomUUID()

    if (!existing) {
      addOrUpdateAccount({
        id,
        status: "connecting",
      } as any)
    }

    try {
      const res = await fetch("/api/mt5/connect", { method: "POST" })
      if (!res.ok) throw new Error("Connection failed")
      const data = await res.json()

      addOrUpdateAccount({
        id,
        status: "connected",
        login: data.login,
        server: data.server,
        name: data.name,
        balance: data.balance,
        equity: data.equity,
        currency: data.currency,
      } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
      addOrUpdateAccount({
        id,
        status: "error",
      } as any)
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

            {error && <div className="text-xs text-red-400">{error}</div>}

            <GlowButton onClick={connect} disabled={loading} className="w-full">
              {loading ? "Connecting..." : "Test MT5 Connection"}
            </GlowButton>
          </div>
        </TerminalCard>
      </motion.div>
    </div>
  )
}

export default ConnectMT5Page
