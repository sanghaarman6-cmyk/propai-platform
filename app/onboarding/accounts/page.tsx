"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import GlowButton from "@/components/GlowButton"
import Skeleton from "@/components/Skeleton"
import { useAccountStore } from "@/lib/accountStore"
import { useStrategyStore } from "@/lib/strategyStore"
import type { FailureAnalysis } from "@/lib/types"

type AIAccountResult = {
  firm_name?: string
  account_size?: number
  phase?: string
  status?: string
  rules?: Record<string, any>
  missing_info?: string[]
  confidence?: number
  failure_analysis?: {
    primary_reason: string
    secondary_factors: string[]
    psychological_pattern?: string
    preventable: boolean
    ai_verdict: string
  }
}


export default function AccountsOnboardingPage() {
  const router = useRouter()
  const { addAccount } = useAccountStore()
  const { profile: strategyProfile } = useStrategyStore()

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIAccountResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [followups, setFollowups] = useState<Record<string, string>>({})
  


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



  function normalizeFailureAnalysis(
    raw?: AIAccountResult["failure_analysis"]
  ): FailureAnalysis | undefined {
    if (!raw) return undefined

    const allowed: FailureAnalysis["primary_reason"][] = [
      "Daily Drawdown",
      "Max Drawdown",
      "Overtrading",
      "Rule Violation",
      "Poor Risk Management",
      "Psychological Tilt",
      "Unknown",
    ]

    const primary = allowed.includes(
      raw.primary_reason as FailureAnalysis["primary_reason"]
    )
      ? (raw.primary_reason as FailureAnalysis["primary_reason"])
      : "Unknown"

    return {
      primary_reason: primary,
      secondary_factors: raw.secondary_factors ?? [],
      psychological_pattern: raw.psychological_pattern ?? null,
      preventable: raw.preventable,
      ai_verdict: raw.ai_verdict,
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
        failure_analysis: normalizeFailureAnalysis(result.failure_analysis),
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
                <div className="space-y-3">
                    <div className="text-xs text-yellow-400">
                    I need a bit more info to be accurate:
                    </div>

                    {result.missing_info.map((q, i) => (
                    <div key={i} className="space-y-1">
                        <div className="text-xs text-text-muted">{q}</div>
                        <input
                        value={followups[q] || ""}
                        onChange={(e) =>
                            setFollowups((s) => ({ ...s, [q]: e.target.value }))
                        }
                        className="w-full rounded border border-border bg-black px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                        placeholder="Your answer..."
                        />
                    </div>
                    ))}

                    <div className="flex justify-end">
                    <GlowButton
                        onClick={async () => {
                        setLoading(true)
                        const res = await fetch("/api/ai/account-profile", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                            description: text,
                            strategy_profile: strategyProfile,
                            followup_answers: followups,
                            }),
                        })
                        const data = await res.json()
                        setResult(data)
                        setLoading(false)
                        }}
                    >
                        Update analysis
                    </GlowButton>
                    </div>
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
