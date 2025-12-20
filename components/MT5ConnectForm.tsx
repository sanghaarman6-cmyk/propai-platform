"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

import { useMT5Store } from "@/lib/mt5Store"
import GlowButton from "@/components/GlowButton"

export default function MT5ConnectForm() {
  const router = useRouter()
  const addOrUpdateAccount = useMT5Store(s => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store(s => s.setActiveAccount)

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("Not authenticated")


      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            login,
            password,
            server,
            userId: user.id, // 🔑 THIS FIXES EVERYTHING
        }),
        })


      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Connect failed")

      addOrUpdateAccount({
        id: String(data.login),
        login: data.login,
        server: data.server,
        name: data.name,
        balance: data.balance,
        equity: data.equity,
        currency: data.currency,
        baselineBalance: data.balance,
        status: "connected",
      })

      setActiveAccount(String(data.login))
      router.push("/app/dashboard")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <input
        placeholder="Login"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setLogin(e.target.value)}
      />
      <input
        type="password"
        placeholder="Investor Password"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        placeholder="Server"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setServer(e.target.value)}
      />

      {error && <div className="text-red-400">{error}</div>}

      <GlowButton onClick={connect} disabled={loading}>
        {loading ? "Connecting…" : "Connect Account"}
      </GlowButton>
    </div>
  )
}
