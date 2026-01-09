"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils" // or copy cn if needed

export default function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-[980px]",
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  widthClass?: string
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center px-3 sm:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/65 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Card */}
        <motion.div
          onMouseDown={(e) => e.stopPropagation()}
          initial={{ y: 14, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "relative w-full overflow-hidden rounded-3xl bg-[#0b0b0b]/95 text-white",
            "shadow-2xl shadow-black/60",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.10)_inset]",
            widthClass
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold tracking-tight">
                {title}
              </div>
              {subtitle && (
                <div className="mt-1 text-sm text-neutral-400">
                  {subtitle}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-5">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
