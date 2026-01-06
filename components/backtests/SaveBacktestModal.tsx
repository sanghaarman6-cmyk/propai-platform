"use client"

import React, { useEffect, useState } from "react"
import { useBacktestSessionStore } from "@/lib/stores/useBacktestSessionStore"

type ExistingBacktest = {
  id: string
  name: string
}

export function SaveBacktestModal({
  open,
  existing,
  onClose,
  onConfirm,
}: {
  open: boolean
  existing: ExistingBacktest[]
  onClose: () => void
  onConfirm: (opts: { mode: "create" | "overwrite" }) => void
}) {
  const { name, notes, setName, setNotes } = useBacktestSessionStore()

  const [conflict, setConflict] = useState<ExistingBacktest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setConflict(null)
      setError(null)
    }
  }, [open])

  if (!open) return null

  function save() {
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    const match = existing.find(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (match) {
      setConflict(match)
      return
    }

    onConfirm({ mode: "create" })
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0f14]">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-sm font-semibold text-white/90">Save Backtest</div>
          <div className="text-xs text-white/55">
            Backtests are live-linked and resumable
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Backtest name"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes (optional)"
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />

          {error && <div className="text-xs text-rose-300">{error}</div>}

          {conflict && (
            <div className="text-xs text-amber-300">
              A backtest named <b>{conflict.name}</b> already exists.
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex justify-end gap-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
          >
            Cancel
          </button>

          {!conflict ? (
            <button
              onClick={save}
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-xs text-emerald-200"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => onConfirm({ mode: "overwrite" })}
              className="rounded-xl border border-rose-400/20 bg-rose-500/15 px-4 py-2 text-xs text-rose-200"
            >
              Overwrite
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
