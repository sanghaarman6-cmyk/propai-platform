"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function login() {
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    // 🔑 After login, check if user already has MT5 accounts
    const user = data.user
    if (!user) {
      router.push("/onboarding/connect-account")
      return
    }

    const res = await fetch(`/api/accounts?userId=${user.id}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      router.push("/onboarding/connect-account")
      return
    }

    const accounts = await res.json()

    if (accounts.length > 0) {
      router.push("/app/dashboard")
    } else {
      router.push("/onboarding/connect-account")
    }
  }


  return (
    <div className="space-y-4">
      <input
        className="w-full rounded bg-bg-secondary p-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full rounded bg-bg-secondary p-2"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <GlowButton onClick={login} disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </GlowButton>
    </div>
  )
}
