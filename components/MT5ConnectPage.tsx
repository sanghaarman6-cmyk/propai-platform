"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import GlowButton from "@/components/GlowButton"

export default function MT5ConnectPage() {
  const router = useRouter()
  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setLoading(true)
    setError(null)

    try {
      // ✅ GET USER PROPERLY
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not logged in. Please login again.")
      }

      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, // ✅ NOW DEFINED
          login,
          password,
          server,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "MT5 connect failed")
      }

      // ✅ HYDRATE STORE
      addOrUpdateAccount({
        id: data.id,
        login: data.login,
        server: data.server,
        name: data.name,
        balance: Number(data.balance),
        equity: Number(data.equity),
        currency: data.currency,
        status: data.status,
      })

      setActiveAccount(data.id)
      router.push("/app/dashboard")
    } catch (e: any) {
      setError(e.message ?? "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={login}
        placeholder="Login"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setLogin(e.target.value)}
      />
      <input
        value={password}
        type="password"
        placeholder="Investor Password"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        value={server}
        placeholder="Server"
        className="w-full rounded bg-bg-secondary p-2"
        onChange={(e) => setServer(e.target.value)}
      />

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <GlowButton onClick={connect} disabled={loading}>
        {loading ? "Connecting…" : "Connect MT5 Account"}
      </GlowButton>
    </div>
  )
}
