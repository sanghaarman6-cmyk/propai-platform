"use client"

import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import { motion } from "framer-motion"
import ToastHost from "@/components/Toast"
import GuruAssistant from "@/components/GuruAssistant"
import { useStrategyStore } from "@/lib/strategyStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { confirmed } = useStrategyStore()

  useEffect(() => {
    if (!confirmed) {
      router.push("/onboarding/strategy")
    }
  }, [confirmed, router])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Global toasts */}
      <ToastHost />

      {/* Left sidebar */}
      <Sidebar />

      {/* Center column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <motion.main
          key="page"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 overflow-y-auto bg-bg-secondary p-6"
        >
          {children}
        </motion.main>
      </div>

      {/* Persistent Guru (desktop docked / mobile floating) */}
      <GuruAssistant />
    </div>
  )
}
