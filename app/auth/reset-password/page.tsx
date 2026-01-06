"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import clsx from "clsx"
import { Lock, Loader2, CheckCircle } from "lucide-react"

/* password strength helper */
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

  return { label: "Weak", isStrong: false }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = getPasswordStrength(password)

  async function handleReset() {
    setError(null)

    if (!strength.isStrong) {
      setError("Password does not meet security requirements.")
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-panel p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold tracking-widest text-emerald-400">
            EDGELY.AI
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Choose a new password for your account.
          </p>
        </div>

        {!success ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading || !strength.isStrong || password !== confirm}
              className={clsx(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                loading
                  ? "bg-white/10 text-white/40"
                  : "bg-emerald-500 text-black hover:bg-emerald-400"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Update password
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
            <p className="text-sm text-white/70">
              Your password has been updated.
            </p>
            <a
              href="/auth/login"
              className="mt-2 text-sm text-emerald-400 hover:underline"
            >
              Back to login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
