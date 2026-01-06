"use client"
import { useBillingStatus } from "@/lib/hooks/useBillingStatus"
import MobileWarningGate from "@/components/MobileWarningGate"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"

import Sidebar from "@/components/Sidebar"
import ToastHost from "@/components/Toast"
import PaywallOverlay from "@/components/PaywallOverlay"

import { useLoadAccounts } from "@/lib/hooks/useLoadAccounts"
import { useIsAuthed } from "@/lib/auth/useIsAuthed"
import { useState } from "react"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import { Menu } from "lucide-react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const { hasAccess } = useBillingStatus()

  const { isAuthed, loading } = useIsAuthed()
  useLoadAccounts()

  useEffect(() => {
    if (loading || isAuthed === null) return
    if (!isAuthed) router.replace("/")
  }, [loading, isAuthed, router])

  return (
    <MobileWarningGate>
      <div className="flex h-screen overflow-hidden">
        <ToastHost />

        {/* 🖥 Desktop sidebar */}
        {!isMobile && (
          <aside className="shrink-0">
            <Sidebar />
          </aside>
        )}

        {/* 📱 Mobile sidebar drawer */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur"
              onClick={() => setSidebarOpen(false)}
            />

            {/* drawer */}
            <aside className="relative z-50 w-64 bg-bg-panel">
              <Sidebar />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {isMobile && (
  <div className="flex items-center gap-3 border-b border-border bg-bg-panel px-4 py-3">
    <button
      onClick={() => setSidebarOpen(true)}
      className="rounded-xl border border-border bg-black/40 p-2"
    >
      <Menu size={18} />
    </button>

    <span className="text-xs font-semibold tracking-widest text-emerald-400">
      EDGELY.AI
    </span>
  </div>
)}

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`
            relative flex-1 bg-bg-secondary p-6
            ${hasAccess ? "overflow-y-auto" : "overflow-hidden"}
          `}
        >
          {children}

          <PaywallOverlay />
        </motion.main>

      </div>
    </div>
    </MobileWarningGate>
  )
}
