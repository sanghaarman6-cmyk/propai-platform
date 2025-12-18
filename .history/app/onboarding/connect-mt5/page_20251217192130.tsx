"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import { useMT5Store } from "@/lib/mt5Store"

export default function ConnectMT5Page() {
  const addAccount = useMT5Store((s) => s.addAccount)
  const updateStatus = useMT5Store((s) => s.updateStatus)

  const [login, setLogin] = useState("")
  const [server, setServer] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setError(null)

    if (!login || !server || !password) {
      setError("All fields are required")
      return
    }

    const id = crypto.randomUUID()

    addAccount({
      id,
      userId: "demo-user",
      login,
      server,
      investorPassword: password,
      status: "connecting",
    })

    setLoading(true)

    try {
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          server,
          investorPassword: password,
        }),
      })

      if (!res.ok) throw new Error("Connection failed")

      updateStatus(id, "connected")
    } catch (e) {
      updateStatus(id, "error")
      setError("Failed to connect to MT5 account")
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
            <div>
              <label className="text-xs text-text-muted">MT5 Login</label>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-black px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted">Server</label>
              <input
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-black px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted">
                Investor Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-black px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400">{error}</div>
            )}

            <GlowButton
              onClick={connect}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Connecting..." : "Connect Account"}
            </GlowButton>

            <div className="text-xs text-text-muted">
              Investor password gives read-only access.
            </div>
          </div>
        </TerminalCard>
      </motion.div>
    </div>
  )
}
