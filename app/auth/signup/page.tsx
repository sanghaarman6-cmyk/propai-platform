"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signup() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 🔑 FORCE SESSION (THIS IS THE KEY)
    const loginRes = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginRes.error) {
      setError("Signup succeeded but auto-login failed.")
      setLoading(false)
      return
    }

    const sessionCheck = await supabase.auth.getSession()
    console.log("✅ SESSION AFTER SIGNUP:", sessionCheck.data.session)

    if (!sessionCheck.data.session) {
      setError("Session not established after signup.")
      setLoading(false)
      return
    }

    router.push("/onboarding/connect-account")
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
      <GlowButton onClick={signup} disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </GlowButton>
    </div>
  )
}
