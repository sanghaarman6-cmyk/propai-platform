"use client"

import { useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Drawer from "@/components/Drawer"
import TagPill from "@/components/TagPill"
import GlowButton from "@/components/GlowButton"
import { useAppStore } from "@/lib/store"
import { useGuruStore } from "@/lib/guruStore"
import { buildContextChips, generateGuruReply } from "@/lib/guru"

export default function GuruAssistant() {
  const { activeChallenge, recentTrades } = useAppStore()
  const {
    desktopCollapsed,
    mobileOpen,
    setDesktopCollapsed,
    setMobileOpen,
    messages,
    pushUser,
    pushGuru,
    suggestedPrompts,
  } = useGuruStore()

  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const chips = useMemo(
    () => buildContextChips(activeChallenge),
    [activeChallenge]
  )

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    pushUser(trimmed)

    const reply = generateGuruReply({
      prompt: trimmed,
      activeChallenge,
      recentTrades,
    })
    pushGuru(reply)

    setInput("")
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    )
  }

  const Panel = (
    <div className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">
          Guru <span className="text-text-muted">· always-on</span>
        </div>
        <button
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="hidden text-xs text-text-muted hover:text-white lg:inline-flex"
        >
          {desktopCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <TagPill key={c.label} tone={c.tone as any}>
            {c.label}
          </TagPill>
        ))}
      </div>

      <div className="h-[52vh] overflow-y-auto rounded border border-border bg-black/30 p-3">
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <div className="font-mono text-[11px] text-text-muted">
                {m.role === "guru" ? "GURU" : "YOU"} ·{" "}
                {new Date(m.tsISO).toLocaleTimeString()}
              </div>
              <div
                className={`whitespace-pre-line rounded border p-3 text-sm ${
                  m.role === "guru"
                    ? "border-accent-cyan/30 bg-black/40"
                    : "border-border bg-black/25"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 text-xs text-text-muted">Suggested prompts</div>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded border border-border bg-black/30 px-2 py-1 text-xs text-text-muted hover:text-white"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask the Guru…"
          className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />
        <GlowButton onClick={() => send(input)}>Send</GlowButton>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <motion.aside
          className="h-full border-l border-border bg-bg-panel p-4"
          animate={{ width: desktopCollapsed ? 72 : 420 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {desktopCollapsed ? (
            <div className="flex h-full flex-col items-center justify-between">
              <div className="mt-10 rotate-90 font-mono text-xs text-text-muted">
                GURU
              </div>
              <button
                onClick={() => setDesktopCollapsed(false)}
                className="mb-4 rounded border border-border bg-black/30 px-3 py-2 text-xs text-text-muted hover:text-white"
              >
                Open
              </button>
            </div>
          ) : (
            Panel
          )}
        </motion.aside>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <AnimatePresence>
          {!mobileOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              onClick={() => setMobileOpen(true)}
              className="fixed bottom-5 right-5 z-40 rounded-full bg-accent-green px-4 py-3 text-sm text-black shadow-glow"
            >
              Guru
            </motion.button>
          )}
        </AnimatePresence>

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Guru"
        >
          {Panel}
        </Drawer>
      </div>
    </>
  )
}
