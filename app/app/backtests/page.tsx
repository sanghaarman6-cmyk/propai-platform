"use client"

import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import React from "react"
import BacktestShelf from "@/components/backtests/BacktestShelf"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)



export default function BacktestsPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] px-4 sm:px-6 py-5 sm:py-6 text-white">
      {/* Background consistent with your app */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A0F]" />
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute left-[20%] top-[-180px] h-[420px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.18]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-lg font-semibold text-white/90">Backtests</div>
          <div className="mt-1 text-sm text-white/55">
            This page is a safe sandbox for saved backtests. Later we’ll embed this list directly under Notes on the Backtester page.
          </div>
        </div>

        <BacktestShelf title="Saved Backtests" maxHeightClass="max-h-[520px]" />
      </div>
    </div>
  )
}


