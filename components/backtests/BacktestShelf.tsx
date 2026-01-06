"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { BacktestSnapshotV1 } from "@/lib/types/backtests"
import { useBacktestSessionStore } from "@/lib/stores/useBacktestSessionStore"

/* -------------------------------------------------------------------------- */
/*                               Supabase Client                               */
/* -------------------------------------------------------------------------- */

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type BacktestRow = {
  id: string
  user_id: string
  name: string
  notes: string | null
  snapshot: BacktestSnapshotV1 | null
  created_at: string
  updated_at: string
}


/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function fmtPct(p: number, digits = 2) {
  if (!Number.isFinite(p)) return "—"
  return `${(p * 100).toFixed(digits)}%`
}

function fmtMoney(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—"
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  return `${sign}$${abs.toFixed(digits)}`
}

function deriveStats(snapshot: BacktestSnapshotV1 | null) {
  if (!snapshot) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      bes: 0,
      pnlAbs: NaN,
      pnlPct: NaN,
      winrate: NaN,
    }
  }

  const trades = snapshot.trades ?? []
  const initial = snapshot.config?.initial ?? 0

  const total = trades.length
  const wins = trades.filter((t) => t.result === "win").length
  const losses = trades.filter((t) => t.result === "loss").length
  const bes = trades.filter((t) => t.result === "breakeven").length

  const endEq =
    total > 0
      ? trades[trades.length - 1]?.equityAfter ?? initial
      : initial

  const pnlAbs = endEq - initial
  const pnlPct = initial > 0 ? pnlAbs / initial : NaN
  const winrate = wins + losses > 0 ? wins / (wins + losses) : NaN

  return { total, wins, losses, bes, pnlAbs, pnlPct, winrate }
}


/* -------------------------------------------------------------------------- */
/*                              Backtest Shelf                                 */
/* -------------------------------------------------------------------------- */

export default function BacktestShelf({
  className,
  title = "Saved Backtests",
  maxHeightClass = "max-h-[320px]",
}: {
  className?: string
  title?: string
  maxHeightClass?: string
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BacktestRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function fetchBacktests() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setRows([])
        return
      }

      const { data, error } = await supabase
        .from("backtests")
        .select("id,user_id,name,notes,snapshot,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error

      setRows((data ?? []) as BacktestRow[])
    } catch (e: any) {
      console.error(e)
      setError("Failed to load backtests")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBacktests()
  }, [])

  function openBacktest(bt: BacktestRow) {
    const snapshot = bt.snapshot

    if (!snapshot || !snapshot.config || !Array.isArray(snapshot.trades)) {
      console.error("Invalid backtest snapshot", bt)
      alert("This backtest is corrupted or from an older version.")
      return
    }

    useBacktestSessionStore.getState().hydrateFromDb({
      id: bt.id,
      name: bt.name,
      notes: bt.notes ?? "",
      config: snapshot.config,
      trades: snapshot.trades,
    })

    router.push("/app/backtester")
  }


  async function deleteBacktest(id: string) {
    await supabase.from("backtests").delete().eq("id", id)
    setRows((r) => r.filter((x) => x.id !== id))
  }

  const body = useMemo(() => {
    if (loading) {
      return <div className="px-3 py-4 text-sm text-white/45">Loading…</div>
    }

    if (error) {
      return <div className="px-3 py-4 text-sm text-rose-300">{error}</div>
    }

    if (!rows.length) {
      return <div className="px-3 py-4 text-sm text-white/45">No saved backtests yet.</div>
    }

    return (
      <div className={cn("overflow-y-auto scroll-clean", maxHeightClass)}>
        <div className="divide-y divide-white/5">
          {rows.map((bt) => {
            const s = deriveStats(bt.snapshot)
            const pnlColor =
              s.pnlPct > 0
                ? "text-emerald-300"
                : s.pnlPct < 0
                ? "text-rose-300"
                : "text-white/70"

            return (
              <div key={bt.id} className="px-3 py-3 hover:bg-white/5 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/90">
                      {bt.name}
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-white/45">Winrate</div>
                        <div>{s.total ? fmtPct(s.winrate, 0) : "—"}</div>
                      </div>

                      <div>
                        <div className="text-white/45">PnL</div>
                        <div className={pnlColor}>
                          {s.total ? fmtPct(s.pnlPct, 2) : "—"}
                        </div>
                        <div className="text-white/45">
                          {s.total ? fmtMoney(s.pnlAbs, 2) : ""}
                        </div>
                      </div>

                      <div>
                        <div className="text-white/45">W / L</div>
                        <div>{s.total ? `${s.wins} / ${s.losses}` : "—"}</div>
                      </div>

                      <div>
                        <div className="text-white/45">BE</div>
                        <div>{s.total ? s.bes : "—"}</div>
                      </div>
                    </div>

                    {bt.notes && (
                      <div className="mt-2 text-[11px] text-white/45">
                        {bt.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openBacktest(bt)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => deleteBacktest(bt.id)}
                      className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [loading, error, rows, maxHeightClass])

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm font-semibold text-white/85">{title}</div>
        <button
          onClick={fetchBacktests}
          className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white/70"
        >
          Refresh
        </button>
      </div>

      <div className="p-3">{body}</div>
    </div>
  )
}
