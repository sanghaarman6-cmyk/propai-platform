"use client"

import { motion } from "framer-motion"

import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import ToastHost from "@/components/Toast"
import GuruAssistant from "@/components/GuruAssistant"

import { useLoadAccounts } from "@/lib/hooks/useLoadAccounts"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Load user accounts ONCE after login
  useLoadAccounts()

  return (
    <div className="flex h-screen overflow-hidden">
      <ToastHost />

      <Sidebar />

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

      <GuruAssistant />
    </div>
  )
}
