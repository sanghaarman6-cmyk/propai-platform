"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import ToastHost from "@/components/Toast"
import GuruAssistant from "@/components/GuruAssistant"

import { useStrategyStore } from "@/lib/strategyStore"
import { useMT5Store } from "@/lib/mt5Store"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { confirmed } = useStrategyStore()

  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)

  // 🔒 Strategy gate
  useEffect(() => {
    if (!confirmed) {
      router.push("/onboarding/strategy")
    }
  }, [confirmed, router])

  // 🔁 MT5 auto-sync (every 10s)
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch("/api/mt5/sync", {
          cache: "no-store",
        })

        if (!res.ok) return

        const data = await res.json()

        addOrUpdateAccount({
          id: String(data.account.login), // 🔑 lock 1 account per login
          login: data.account.login,
          server: data.account.server,
          name: data.account.name,
          balance: data.account.balance,
          equity: data.account.equity,
          currency: data.account.currency,
          firmDetected: data.account.firmDetected,
          status: data.account.status,
          metrics: data.account.metrics,
          positions: data.positions,
          history: data.history,
        })
      } catch (e) {
        console.error("MT5 sync failed", e)
      }
    }

    sync()
    const interval = setInterval(sync, 10_000)
    return () => clearInterval(interval)
  }, [addOrUpdateAccount])

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
