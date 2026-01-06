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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

      {/* ✅ Sidebar stays clickable */}
      <Sidebar />

      {/* ✅ Content area only */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
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
