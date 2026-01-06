"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ArrowRight, X } from "lucide-react"
import clsx from "clsx"

export default function WelcomeModal({
  open,
  onClose,
  planLabel,
}: {
  open: boolean
  onClose: () => void
  planLabel?: string // e.g. "Trial started" or "Subscription active"
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* modal */}
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-[0_30px_120px_rgba(0,0,0,0.75)]"
          >
            {/* top glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

            <div className="relative p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    {planLabel || "Unlocked"}
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    Welcome to EDGELY.AI 👋
                  </h3>
                  <p className="mt-2 text-sm text-white/60">
                    You’re fully unlocked. Here’s the fastest way to get value in the next 3 minutes.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:bg-white/[0.07] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <Action
                  title="Connect a trading account"
                  desc="Import trades to unlock analytics and insights."
                  href="/app/accounts"
                  primary
                />
                <Action
                  title="Log your first trade"
                  desc="Journaling takes 20 seconds and improves consistency."
                  href="/app/journal"
                />
                <Action
                  title="Explore analytics"
                  desc="See what’s holding performance back — instantly."
                  href="/app/analytics"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="text-xs text-white/50 hover:text-white/80"
                >
                  Skip for now
                </button>

                <div className="text-xs text-white/40">
                  You can access this later from Settings.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Action({
  title,
  desc,
  href,
  primary,
}: {
  title: string
  desc: string
  href: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group rounded-2xl border p-4 transition",
        primary
          ? "border-emerald-400/25 bg-emerald-400/10 hover:bg-emerald-400/14"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/60">{desc}</div>
        </div>
        <ArrowRight className={clsx("mt-1 h-4 w-4", primary ? "text-emerald-200" : "text-white/40")} />
      </div>
    </Link>
  )
}
