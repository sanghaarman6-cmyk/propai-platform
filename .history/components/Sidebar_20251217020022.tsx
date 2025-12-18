"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Activity,
  List,
  BarChart3,
  Bot,
  Shield,
  Settings,
  BookOpen,
} from "lucide-react"
import clsx from "clsx"

const nav = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Live", href: "/app/live", icon: Activity },
  { label: "Challenges", href: "/app/challenges", icon: List },
  { label: "Journal", href: "/app/journal", icon: BookOpen },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "AI Guru", href: "/app/guru", icon: Bot },
  { label: "Rules", href: "/app/rules", icon: Shield },
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Trades", href: "/app/trades", icon: Settings},
  { label: "Analytics", href: "/app/analytics", icon: Settings }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 border-r border-border bg-bg-panel px-4 py-6">
      <div className="mb-8 font-mono text-lg">
        PropGuru<span className="text-accent-green">.AI</span>
      </div>

      <nav className="space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded px-3 py-2 text-sm transition",
                active
                  ? "bg-black text-white shadow-glow"
                  : "text-text-muted hover:bg-black hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
