"use client"

import { useState } from "react"
import MT5ConnectPage from "@/components/MT5ConnectPage"
// or wherever it lives
import TerminalCard from "@/components/TerminalCard"

export default function ConnectAccountPage() {
  const [platform, setPlatform] = useState<"mt5" | "ctrader" | null>(null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6">
      <TerminalCard title="Connect your trading account">
        {!platform && (
          <div className="space-y-4 text-sm">
            <p className="text-text-muted">
              Choose a platform to connect your evaluation or funded account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setPlatform("mt5")}
                className="rounded-md border px-4 py-2 text-sm hover:bg-bg-secondary"
              >
                MT5 (Live)
              </button>

              <button
                disabled
                className="rounded-md border px-4 py-2 text-sm opacity-40"
              >
                cTrader (Coming soon)
              </button>
            </div>
          </div>
        )}

        {platform === "mt5" && <MT5ConnectPage />}
      </TerminalCard>
    </div>
  )
}
