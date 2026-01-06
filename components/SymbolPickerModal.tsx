"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  open: boolean
  value: string
  onClose: () => void
  onSelect: (symbol: string) => void
}

const GROUPS: Record<string, string[]> = {
  Forex: [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "AUDUSD",
    "NZDUSD",
    "USDCAD",
    "USDCHF",
  ],
  Metals: ["XAUUSD"],
  Indices: ["NAS100", "SPX500", "US30"],
}

export default function SymbolPickerModal({
  open,
  value,
  onClose,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const filtered = useMemo(() => {
    if (!query) return GROUPS

    const q = query.toUpperCase()
    const out: Record<string, string[]> = {}

    for (const group in GROUPS) {
      const hits = GROUPS[group].filter((s) => s.includes(q))
      if (hits.length) out[group] = hits
    }

    return out
  }, [query])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md rounded-2xl bg-black border border-white/10 shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <input
              autoFocus
              placeholder="Search symbol…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="control bg-black/50"
            />
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto scroll-clean px-2 py-2">
            {Object.keys(filtered).length === 0 && (
              <div className="text-sm text-muted-foreground px-3 py-6">
                No symbols found
              </div>
            )}

            {Object.entries(filtered).map(([group, symbols]) => (
              <div key={group} className="mb-2">
                <div className="sticky top-0 z-10 px-3 py-2 text-[11px] uppercase tracking-widest
                text-muted-foreground bg-black/90 backdrop-blur
                border-b border-white/5">
                  {group}
                </div>

                {symbols.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onSelect(s)
                      onClose()
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition
                      ${
                        s === value
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "hover:bg-white/5"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
