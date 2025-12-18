"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import Skeleton from "@/components/Skeleton"
import { useAccountStore } from "@/lib/accountStore"
import { useStrategyStore } from "@/lib/strategyStore"

type AIAccountResult = {
  firm_name?: string
  account_size?: number
  phase?: string
  status?: string
  rules?: Record<string, any>
  missing_info?: string[]
  confidence?: number
}

export default function AccountsOnboardingPage() {
  const router = useRouter()
  const { addAccount } = useAccountStore()
  const { profile: strategyProfile } = useStrategyStore()

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIAccountResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (text.trim().length < 10) {
      setError("Please describe the account in more detail.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/account-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          strategy_profile: strategyProfile,
        }),
      })

      if (!res.ok) throw new Error("AI failed to analyze account")

      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function saveAccount() {
    if (!result) return

    addAccount({
      id: crypto.randomUUID(),
      firm_name: result.firm_name ?? "Unknown",
      account_size: result.account_size ?? null,
      phase: (result.phase as any) ?? "Unknown",
      status: (result.status as any) ?? "Unknown",
      rules: result.rules ?? {},
      inferred: {
        confidence: result.confidence ?? 0,
        missing_info: result.missing_info ?? [],
      },
      notes: text,
    })

    setText("")
    setResult(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl"
      >
        <TerminalCard title="Add your trading accounts">
          <div className="space-y-3 text-sm text-text-muted">
            <p>
              Describe a prop firm account you’ve traded.
            </p>
            <p>
              Example: “FTMO 100k account, failed Phase 1 after hitting daily
              drawdown twice.”
            </p>
          </div>

          {!result && (
            <div className="mt-6 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Describe the account..."
                className="w-full rounded border border-border bg-black p-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan"
              />

              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => router.push("/app/dashboard")}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Skip for now
                </button>

                <GlowButton onClick={analyze} disabled={loading}>
                  Analyze account
                </GlowButton>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="text-sm font-medium">
                Here’s what I understand about this account:
              </div>

              <pre className="max-h-64 overflow-y-auto rounded border border-border bg-black/40 p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.missing_info?.length ? (
                <div className="text-xs text-yellow-400">
                  Missing info:
                  <ul className="mt-1 list-disc pl-4">
                    {result.missing_info.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex justify-between">
                <button
                  onClick={() => setResult(null)}
                  className="rounded border border-border px-3 py-2 text-xs hover:bg-white/5"
                >
                  Edit
                </button>

                <GlowButton onClick={saveAccount}>
                  Save account
                </GlowButton>
              </div>
            </div>
          )}
        </TerminalCard>
      </motion.div>
    </div>
  )
}
