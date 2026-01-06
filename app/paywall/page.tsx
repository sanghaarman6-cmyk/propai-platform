"use client"

import { useState } from "react"

export default function PaywallPage() {
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    try {
      setLoading(true)
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()

      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data?.error || "Failed to start checkout")
      }
    } catch (err) {
      alert("Checkout error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-panel text-white">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Upgrade Required</h1>
        <p className="mt-3 text-white/70">
          You need an active subscription to access the dashboard.
        </p>

        <button
          onClick={startCheckout}
          disabled={loading}
          className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Redirecting…" : "Start Trial / Subscribe"}
        </button>
      </div>
    </div>
  )
}
