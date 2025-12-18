"use client"

import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import { motion } from "framer-motion"
import ToastHost from "@/components/Toast"


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ToastHost />
      <Sidebar />

      <div className="flex flex-1 flex-col">
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
    </div>
  )
}
