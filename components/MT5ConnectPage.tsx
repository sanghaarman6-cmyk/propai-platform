"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import GlowButton from "@/components/GlowButton"
type MT5ConnectPageProps = {
  onSuccess?: () => void
}

export default function MT5ConnectPage({ onSuccess }: MT5ConnectPageProps) {
  const bumpRefresh = useMT5Store((s) => s.bumpRefresh)

  const router = useRouter()
  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)

  const [label, setLabel] = useState("")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ----------------------------
     PROGRESS BAR STATE
  ----------------------------- */
  const [progress, setProgress] = useState(0)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  function startProgress() {
    setProgress(0)

    let value = 0
    progressTimer.current = setInterval(() => {
      value += Math.random() * 2.5 + 0.8

      if (value >= 88) value = 88
      setProgress(value)
    }, 800)
  }

  function finishProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setProgress(100)
  }

  function resetProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setProgress(0)
  }

  /* ----------------------------
     CONNECT FLOW
  ----------------------------- */
  async function connect() {
    if (loading) return

    setLoading(true)
    setError(null)
    startProgress()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")

      /* 2️⃣ SAVE ACCOUNT */
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          label: label.trim() || null,
          login: login.trim(),
          password,
          server: server.trim(),
        }),
      })

      const account = await res.json()
      if (!res.ok) {
        throw new Error(account?.error ?? "Failed to save account")
      }

      addOrUpdateAccount({
        id: account.id,
        userId: account.user_id,
        label: account.label,
        login: account.login,
        server: account.server,
        name: account.name,
        balance: account.balance,
        equity: account.equity,
        currency: account.currency,
        status: account.status,
      })

      setActiveAccount(account.id)

      /* 3️⃣ SYNC MT5 DATA */
      const syncRes = await fetch("/api/mt5/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          forceReconnect: true, // 🔑 CRITICAL
        }),
      })


      const syncData = await syncRes.json()
      if (!syncRes.ok || syncData?.ok === false) {
        throw new Error(syncData?.error ?? "MT5 sync failed")
      }

      addOrUpdateAccount({
        id: account.id,

        // ✅ ALWAYS update these after sync
        balance: syncData.account?.balance ?? account.balance,
        equity: syncData.account?.equity ?? account.equity,

        // ✅ keep all your metadata
        firmDetected: syncData.account?.firmDetected,
        firmKey: syncData.account?.firmKey,
        firmName: syncData.account?.firmName,
        leverage: syncData.account?.leverage,
        phase: syncData.account?.phase,

        // ✅ baseline logic (prefer real baseline, then balance)
        baselineBalance:
          syncData.baseline_balance ??
          syncData.account?.baseline_balance ??
          syncData.account?.balance ??
          account.balance ??
          null,

        status: "connected",
        lastSync: Date.now(),
      })


      bumpRefresh() // 🔥 THIS IS THE MISSING SIGNAL

      // ✅ Initialize baseline balance ONCE (if missing)
      if (
        syncData.account?.balance &&
        syncData.account.balance > 0 &&
        !syncData.account.baseline_balance
      ) {
        await fetch("/api/accounts/init-baseline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: account.id,
            baselineBalance: syncData.account.balance,
          }),
        })
      }

      finishProgress()
      onSuccess?.()





    } catch (e: any) {
      resetProgress()
      setError(e.message ?? "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 🔒 BLOCKING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[420px] rounded-xl bg-bg-secondary p-6 shadow-2xl text-center space-y-4">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />

            <h2 className="text-lg font-semibold text-text-primary">
              Connecting to MetaTrader 5
            </h2>

            <p className="text-sm text-text-muted">
              This may take <span className="font-medium text-text-primary">30–60 seconds</span>.
              <br />
              Please keep this window open.
            </p>

            {/* ✅ GREEN PROGRESS BAR */}
            <div className="w-full h-2 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-[3200ms] ease-in-out animate-pulse"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-text-muted">
              🔒 Securely validating your trading account
            </p>
          </div>
        </div>
      )}

      {/* 🧾 FORM */}
      <div className="space-y-3">
        <input
          value={label}
          placeholder="Label (optional)"
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <input
          value={login}
          placeholder="Login"
          onChange={(e) => setLogin(e.target.value)}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <input
          value={password}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <input
          value={server}
          placeholder="Server (e.g. ACGMarkets-Main)"
          onChange={(e) => setServer(e.target.value)}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}

        <GlowButton onClick={connect} disabled={loading}>
          {loading ? "Connecting…" : "Connect MT5 Account"}
        </GlowButton>
      </div>
    </>
  )
}
