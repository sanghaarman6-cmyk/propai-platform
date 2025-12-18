"use client"

import { motion, AnimatePresence } from "framer-motion"

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border bg-bg-panel p-4"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{title}</div>
              <button
                onClick={onClose}
                className="text-xs text-text-muted hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
