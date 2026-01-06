"use client"

import { usePathname } from "next/navigation"
import { useBillingStatus } from "@/lib/hooks/useBillingStatus"


export default function PaywallOverlay() {
  const { hasAccess } = useBillingStatus()   // ✅ THIS LINE
  const pathname = usePathname()

  const allowWithoutAccess =
    pathname.startsWith("/app/settings/billing") ||
    pathname.startsWith("/app/settings/account") ||
    pathname.startsWith("/app/settings/password")

  if (allowWithoutAccess) return null

  // 🔑 Only show overlay if access is explicitly false
  if (hasAccess !== false) return null

  return (
    <div className="absolute inset-0 z-40">
      {/* Blur content immediately */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-bg-panel p-8 text-center shadow-2xl">
  <div className="mb-4 text-xs font-semibold tracking-widest text-emerald-400">
    EDGELY.AI
  </div>

  <h2 className="text-3xl font-semibold text-white">
    Unlock Your Trading Edge
  </h2>

  <p className="mt-3 text-sm text-white/70">
    The all-in-one prop firm trader toolkit built to
    protect capital and maximise consistency.
  </p>

  <ul className="mt-6 space-y-3 text-left text-sm text-white/80">
    <li>✔ Automatic trade journaling</li>
    <li>✔ Advanced performance analytics</li>
    <li>✔ Prop firm rules & drawdown tracking</li>
    <li>✔ Risk & position size calculators</li>
    <li>✔ AI insights (early access)</li>
  </ul>

  <button
    className="mt-8 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-black transition hover:bg-emerald-400"
    onClick={async () => {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
  })

  const data = await res.json()

  if (data.url) {
    window.location.href = data.url
  }
}}

  >
    Start 14-Day Free Trial
  </button>

  <div className="mt-3 text-xs text-white/40">
    £10 / month after · Cancel anytime
  </div>

  <div className="mt-1 text-[11px] text-white/30">
    No charge during trial
  </div>
</div>

      </div>
    </div>
  )
}
