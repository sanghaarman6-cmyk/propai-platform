"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import GlowButton from "@/components/GlowButton"
import TerminalCard from "@/components/TerminalCard"
import Skeleton from "@/components/Skeleton"
import { useStrategyStore } from "@/lib/strategyStore"

export default function StrategyOnboardingPage() {
  const router = useRouter()
  const {
    setRawText,
    setProfile,
    confirm,
  } = useStrategyStore()

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  async function submit() {
    if (text.trim().length < 50) {
      setError("Please describe your strategy in more detail.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/strategy-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        throw new Error("AI failed to analyze strategy.")
      }

      const data = await res.json()
      setRawText(text)
      setProfile(data.profile)
      setResult(data.profile)
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  function accept() {
    confirm()
    router.push("/onboarding/accounts")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-3xl"
      >
        <TerminalCard title="Before we begin">
          <div className="space-y-4 text-sm text-text-muted">
            <p>
              Describe your <strong>full trading strategy</strong> in as much
              detail as possible.
            </p>
            <p>
              Include timeframes, sessions, entries, exits, risk rules, and
              anything you consider part of your edge.
            </p>
          </div>

          {!result && (
            <div className="mt-6 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="I trade London session EURUSD using..."
                className="w-full rounded border border-border bg-black p-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan"
              />

              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}

              <div className="flex justify-end">
                <GlowButton onClick={submit} disabled={loading}>
                  Analyze strategy
                </GlowButton>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="text-sm font-medium">
                Here’s how I understand your strategy:
              </div>

              <pre className="max-h-80 overflow-y-auto rounded border border-border bg-black/40 p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>

              <div className="flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  Confidence score:{" "}
                  <span className="font-mono text-text-primary">
                    {typeof result.confidence_score === "number"
                      ? `${Math.round(result.confidence_score * 100)}%`
                      : "—"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setResult(null)}
                    className="rounded border border-border px-3 py-2 text-xs hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <GlowButton onClick={accept}>
                    This is accurate
                  </GlowButton>
                </div>
              </div>
            </div>
          )}
        </TerminalCard>
      </motion.div>
    </div>
  )
}
