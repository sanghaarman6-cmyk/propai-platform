"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Loader2, Mail, Lock, User } from "lucide-react"

/* ---------------------------------------------
   Password strength helper (UNCHANGED)
---------------------------------------------- */
function getPasswordStrength(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!password) return { label: null, isStrong: false }

  if (hasMinLength && hasUppercase && hasNumber) {
    return { label: "Strong", isStrong: true }
  }

  if (password.length >= 6) {
    return { label: "Medium", isStrong: false }
  }

  return { label: "Poor", isStrong: false }
}

export default function SignupPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agree, setAgree] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordCheck = getPasswordStrength(password)

  async function signup() {
    if (!passwordCheck.isStrong) {
      setError("Password does not meet security requirements.")
      return
    }

    if (!agree) {
      setError("You must agree to the terms & conditions.")
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const loginRes = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginRes.error) {
      setError("Signup succeeded but auto-login failed.")
      setLoading(false)
      return
    }

    router.replace("/app/fundamentals")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b bg-bg-panel p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold tracking-widest text-emerald-400">
            EDGELY.AI
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Start trading with confidence
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
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

{passwordCheck.label && (
  <div className="space-y-1">
    <div className="flex gap-1">
      {/* Poor */}
      <div
        className={clsx(
          "h-1.5 w-full rounded transition-all",
          passwordCheck.label === "Poor"
            ? "bg-red-500"
            : "bg-white/10"
        )}
      />

      {/* Medium */}
      <div
        className={clsx(
          "h-1.5 w-full rounded transition-all",
          passwordCheck.label === "Medium"
            ? "bg-yellow-400"
            : "bg-white/10"
        )}
      />

      {/* Strong */}
      <div
        className={clsx(
          "h-1.5 w-full rounded transition-all",
          passwordCheck.isStrong
            ? "bg-emerald-400"
            : "bg-white/10"
        )}
      />
    </div>

    <div className="text-xs text-white/50">
 
      <span
        className={clsx(
          passwordCheck.isStrong
            ? "text-emerald-400"
            : passwordCheck.label === "Medium"
            ? "text-yellow-400"
            : "text-red-400"
        )}
      >

      </span>
    </div>
  </div>
)}


          {/* Terms */}
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="accent-emerald-500"
            />
            I agree to the Terms & Conditions
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={signup}
            disabled={loading || !passwordCheck.isStrong || !agree}
            className={clsx(
              "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
              loading || !passwordCheck.isStrong || !agree
                ? "bg-white/10 text-white/40"
                : "bg-emerald-500 text-black hover:bg-emerald-400"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create account"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-white/50">
          Already have an account?{" "}
          <span
            className="cursor-pointer text-emerald-400 hover:underline"
            onClick={() => router.push("/auth/login")}
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  )
}
