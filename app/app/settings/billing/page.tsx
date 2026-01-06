"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import clsx from "clsx"
import { CreditCard, ExternalLink, Loader2, Receipt, Shield, X } from "lucide-react"

type Profile = {
  subscription_status: string | null
  trial_end: string | null
  current_period_end: string | null
  plan: string | null
}

type InvoiceRow = {
  id: string
  number: string | null
  status: string | null
  currency: string
  amount_due: number
  amount_paid: number
  created: number
  hosted_invoice_url: string | null
  invoice_pdf: string | null
}

function fmtMoney(amountMinor: number, currency: string) {
  const amount = amountMinor / 100
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`
  }
}

function fmtDate(tsSeconds: number) {
  return new Date(tsSeconds * 1000).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

function fmtDateISO(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

function diffHuman(targetISO: string) {
  const now = Date.now()
  const t = new Date(targetISO).getTime()
  const delta = t - now
  const abs = Math.abs(delta)

  const mins = Math.floor(abs / (60 * 1000))
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  const remHours = hours % 24

  if (days > 0) return `${days}d ${remHours}h`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<null | "portal">(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setErr(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setErr("You must be logged in.")
        setLoading(false)
        return
      }

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("subscription_status, trial_end, current_period_end, plan")
        .eq("id", user.id)
        .single()

      if (!mounted) return

      if (pErr) {
        setErr(pErr.message)
        setLoading(false)
        return
      }

      setProfile(p as Profile)

      // Load invoices from our API
      const invRes = await fetch("/api/stripe/invoices", { method: "GET" })
      const invJson = await invRes.json()
      setInvoices(invJson?.invoices ?? [])

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const status = profile?.subscription_status ?? "inactive"

  const stateBadge = useMemo(() => {
    if (status === "trialing")
      return {
        label: "Free Trial",
        tone: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
        icon: Shield,
      }
    if (status === "active")
      return {
        label: "Active",
        tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
        icon: Shield,
      }
    if (status === "past_due")
      return {
        label: "Payment issue",
        tone: "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
        icon: X,
      }
    return {
      label: "Locked",
      tone: "bg-white/5 text-white/60 ring-1 ring-white/10",
      icon: Shield,
    }
  }, [status])

  const headline = useMemo(() => {
    if (!profile) return null

    if (status === "trialing" && profile.trial_end) {
      return {
        title: "You’re on a free trial",
        sub: `Trial ends in ${diffHuman(profile.trial_end)} · ${fmtDateISO(
          profile.trial_end
        )}`,
      }
    }

    if (status === "active" && profile.current_period_end) {
      return {
        title: "Subscription active",
        sub: `Renews in ${diffHuman(profile.current_period_end)} · ${fmtDateISO(
          profile.current_period_end
        )}`,
      }
    }

    if (status === "past_due") {
      return {
        title: "Payment issue",
        sub: "Update your payment method to restore access.",
      }
    }

    return {
      title: "Subscription required",
      sub: "Start your 7-day free trial to unlock EDGELY.",
    }
  }, [profile, status])

  async function openPortal() {
    try {
      setActionLoading("portal")
      setErr(null)

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/app/settings/billing`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to open billing portal")
      }

      window.location.href = data.url
    } catch (e: any) {
      setErr(e.message || "Failed to open billing portal")
      setActionLoading(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-widest text-emerald-400">
            EDGELY.AI
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Billing
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Manage your subscription, payment method, and invoices.
          </p>
        </div>

        <div
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
            stateBadge.tone
          )}
        >
          <stateBadge.icon className="h-4 w-4" />
          {stateBadge.label}
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* Status Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0B0F14] to-[#070A0F] p-6 shadow-2xl">
        {loading || !headline ? (
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading billing…
          </div>
        ) : (
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-semibold text-white">
                {headline.title}
              </div>
              <div className="mt-1 text-sm text-white/60">{headline.sub}</div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  £10 / month
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  Cancel anytime
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  7-day free trial
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto">
              <button
                onClick={openPortal}
                disabled={actionLoading === "portal"}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  "bg-emerald-500 text-black hover:bg-emerald-400",
                  actionLoading === "portal" && "opacity-70"
                )}
              >
                {actionLoading === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Manage Billing
              </button>

              <div className="text-center text-[11px] text-white/35">
                Update card · Cancel subscription · View invoices
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border border-white/10 bg-bg-panel p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Billing History</div>
          <button
            onClick={openPortal}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10 hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Open Stripe Portal
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-white/10">
          <div className="grid grid-cols-12 bg-black/30 px-4 py-2 text-[11px] text-white/50">
            <div className="col-span-3">Date</div>
            <div className="col-span-4">Invoice</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-right">Link</div>
          </div>

          <div className="max-h-[420px] overflow-y-auto bg-black/10">
            {loading ? (
              <div className="px-4 py-4 text-sm text-white/60">
                Loading invoices…
              </div>
            ) : invoices.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                No invoices yet.
              </div>
            ) : (
              invoices.map((inv) => {
                const amount =
                  inv.amount_paid > 0 ? inv.amount_paid : inv.amount_due

                return (
                  <div
                    key={inv.id}
                    className="grid grid-cols-12 items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                  >
                    <div className="col-span-3 text-white/70">
                      {fmtDate(inv.created)}
                    </div>
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-white/40" />
                        <span className="font-medium">
                          {inv.number ?? inv.id.slice(-10)}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-[11px] ring-1",
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
                            : inv.status === "open"
                            ? "bg-amber-500/10 text-amber-200 ring-amber-500/20"
                            : "bg-white/5 text-white/60 ring-white/10"
                        )}
                      >
                        {inv.status ?? "unknown"}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {fmtMoney(amount, inv.currency)}
                    </div>
                    <div className="col-span-1 text-right">
                      {inv.hosted_invoice_url ? (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-end text-white/60 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-white/40">
          For card updates, cancellations, and full invoice details, use the Stripe Portal.
        </div>
      </div>
    </div>
  )
}
