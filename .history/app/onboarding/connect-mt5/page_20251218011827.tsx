"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import { useMT5Store } from "@/lib/mt5Store"

export default function ConnectMT5Page() {
  const addAccount = useMT5Store((s) => s.addAccount)
  const updateAccount = useMT5Store((s) => s.updateAccount)


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

            <div className="text-xs text-text-muted">
              Read-only access. No trades can be placed.
            </div>
          </div>
        </TerminalCard>
      </motion.div>
    </div>
  )
}
