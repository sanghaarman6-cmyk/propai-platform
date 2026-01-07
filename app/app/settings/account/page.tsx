"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import clsx from "clsx"
import {
  User,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
} from "lucide-react"

export default function AccountSettingsPage() {
  const supabase = createClient()

  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setUserId(data.user?.id ?? null)
      setLoading(false)
    })
  }, [supabase])

  return (
    <div className="mx-auto max-w-5xl">
            <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      {/* Header */}
      <div className="mb-8">

<div className="text-xs font-semibold tracking-widest text-emerald-400">
  EDGELY.AI
</div>



        <h1 className="mt-2 text-2xl font-semibold text-white">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your personal and security information
        </p>
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {/* Profile */}
        <section className="rounded-2xl border border-border bg-bg-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/60 ring-1 ring-border">
              <User size={16} />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                Profile
              </div>
              <div className="text-xs text-text-muted">
                Basic account information
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={loading ? "Loading…" : email ?? ""}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm text-white/70 outline-none"
                />
              </div>
            </div>

            {/* User ID */}
            <div>
              <label className="mb-1 block text-xs text-text-muted">
                User ID
              </label>
              <div className="relative">
                <Fingerprint className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={loading ? "Loading…" : userId ?? ""}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2 text-sm font-mono text-white/70 outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-border bg-bg-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/60 ring-1 ring-border">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                Security
              </div>
              <div className="text-xs text-text-muted">
                Authentication and protection
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-black/40 px-4 py-3 ring-1 ring-border">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-400" />
                <div>
                  <div className="text-sm text-white">
                    Password authentication
                  </div>
                  <div className="text-xs text-text-muted">
                    Enabled
                  </div>
                </div>
              </div>

              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-400 ring-1 ring-emerald-400/20">
                Secure
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-black/40 px-4 py-3 ring-1 ring-border">
              <AlertTriangle size={16} className="text-yellow-400" />
              <div className="text-xs text-text-muted">
                Two-factor authentication is not enabled yet
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
