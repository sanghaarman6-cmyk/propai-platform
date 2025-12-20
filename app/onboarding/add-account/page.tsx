"use client"

import { useRouter } from "next/navigation"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"

export default function AddAccountPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6">
      <TerminalCard title="Add Trading Account">
        <div className="space-y-4 text-sm">
          <p className="text-text-muted">
            Select the platform for your evaluation or funded account.
          </p>

          <GlowButton
            onClick={() => router.push("/onboarding/mt5-connect")}
            className="w-full"
          >
            Connect MT5 Account
          </GlowButton>

          <GlowButton
            disabled
            className="w-full opacity-40 cursor-not-allowed"
          >
            cTrader (Coming Soon)
          </GlowButton>
        </div>
      </TerminalCard>
    </div>
  )
}
