"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Loader2, Mail, Lock } from "lucide-react"
type View = "login" | "reset_sent"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [view, setView] = useState<View>("login")

  async function login() {
    setError(null)
    setInfo(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push("/app/dashboard")
  }

  async function sendReset() {
    setError(null)
    setInfo(null)
    setResetting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setResetting(false)

    if (error) {
      setError(error.message)
      return
    }

    setView("reset_sent")
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b bg-bg-panel p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold tracking-widest text-emerald-400">
            EDGELY.AI
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Sign in to your trading dashboard
          </p>
        </div>

        {view === "login" ? (
  <div className="space-y-4">
    <div className="relative">
      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
    </div>

    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm text-white outline-none focus:border-emerald-400"
      />
    </div>

    {error && (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {error}
      </div>
    )}

    <button
      onClick={login}
      disabled={loading}
      className={clsx(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
        loading
          ? "bg-white/10 text-white/40"
          : "bg-emerald-500 text-black hover:bg-emerald-400"
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
    </button>

    <button
      onClick={sendReset}
      disabled={!email || resetting}
      className="w-full text-center text-xs text-white/50 hover:text-white"
    >
      {resetting ? "Sending reset email…" : "Forgot password?"}
    </button>
  </div>
) : (
  <div className="space-y-4 text-center">
    <p className="text-sm text-white/70">
      We’ve sent a password reset link to:
    </p>

    <div className="rounded-xl bg-black/40 px-3 py-2 text-sm font-medium text-white">
      {email}
    </div>

    <p className="text-xs text-white/50">
      Open the email and follow the link to reset your password.
    </p>

    <button
      onClick={sendReset}
      className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
    >
      Resend email
    </button>

    <button
      onClick={() => setView("login")}
      className="w-full text-xs text-white/50 hover:text-white"
    >
      Back to login
    </button>
  </div>
)}
{/* Footer */}
<div className="mt-6 text-center text-xs text-white/50">
  Don’t have an account?{" "}
  <span
    className="cursor-pointer text-emerald-400 hover:underline"
    onClick={() => router.push("/auth/signup")}
  >
    Sign up
  </span>
</div>


      </div>
    </div>
  )
}
