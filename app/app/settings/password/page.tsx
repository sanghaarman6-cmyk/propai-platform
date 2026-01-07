"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import clsx from "clsx"
import { CheckCircle, Loader2, Lock } from "lucide-react"

/* ---------------------------------------------
   Password strength helper
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

  return { label: "Weak", isStrong: false }
}

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(password)

  async function handleChangePassword() {
    setError(null)
    setSuccess(false)

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

    setPassword("")
    setConfirm("")
    setSuccess(true)
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
            <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-widest text-emerald-400">
          EDGELY.AI
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Change Password
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Update your account password. Make sure it’s strong and unique.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0B0F14] to-[#070A0F] p-6 shadow-2xl">
        <div className="space-y-4">
          {/* New password */}
          <div>
            <label className="mb-1 block text-xs text-white/60">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Enter a strong password"
            />

            {strength.label && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div
                  className={clsx(
                    "h-1.5 w-16 rounded-full",
                    strength.isStrong
                      ? "bg-emerald-500"
                      : strength.label === "Medium"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  )}
                />
                <span className="text-white/60">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="Re-enter password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              Password updated successfully.
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleChangePassword}
            disabled={loading || !strength.isStrong || password !== confirm}
            className={clsx(
              "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
              loading || !strength.isStrong || password !== confirm
                ? "bg-white/10 text-white/40 cursor-not-allowed"
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
      </div>
    </div>
  )
}
