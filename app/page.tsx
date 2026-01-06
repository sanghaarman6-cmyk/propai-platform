"use client"

/**
 * EDGELY.AI — Landing Page (ready-to-publish)
 * ------------------------------------------------------------
 * - Completely fresh redesign (no reuse of your previous landing code/components)
 * - Premium dark + emerald aesthetic consistent with your auth pages
 * - “Tradexella-style” feature switcher (click features → preview changes)
 * - 14-day free trial capture block (email input → redirects to signup)
 * - 500+ lines on purpose so you can keep iterating in one file
 *
 * NOTE:
 * - Preview images are “mock screenshots” built with gradients + UI skeleton blocks.
 *   Replace <FeaturePreviewMock/> blocks later with real <Image/> screenshots if you want.
 */

import Link from "next/link"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import {
  ArrowRight,
  Check,
  ShieldAlert,
  Sparkles,
  BarChart3,
  BookOpen,
  Calculator,
  FlaskConical,
  Newspaper,
  Globe2,
  Lock,
  Zap,
  Shield,
  LineChart,
  Layers,
  Timer,
  BadgeCheck,
  HeartHandshake,
  ChevronRight,
  ChevronDown,
  Star,
  PhoneCall,
} from "lucide-react"

/* -------------------------------------------------------------------------------------------------
 * Small UI Helpers (local-only)
 * ------------------------------------------------------------------------------------------------ */
import Image from "next/image"

function FeaturePreviewImage({ feature }: { feature: Feature }) {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-3 rounded-3xl bg-emerald-500/10 blur-2xl" />

      {/* Frame */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-white">
              {feature.previewTitle}
            </div>
            <div className="text-xs text-white/50">
              {feature.previewSubtitle}
            </div>
          </div>
          <div className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={feature.image}
            alt={`${feature.name} preview`}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  )
}

function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-6xl px-6 md:px-10", className)}>
      {children}
    </div>
  )
}

function Pill({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode
  tone?: "emerald" | "neutral" | "yellow" | "red"
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "yellow"
      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
      : tone === "red"
      ? "border-red-400/20 bg-red-400/10 text-red-200"
      : "border-white/10 bg-white/5 text-white/70"

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        toneClass
      )}
    >
      {children}
    </span>
  )
}

function SoftCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_70px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {children}
    </div>
  )
}

function PrimaryButton({
  children,
  className,
  as = "button",
  href,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  className?: string
  as?: "button" | "link"
  href?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
  const state = disabled
    ? "bg-white/10 text-white/40"
    : "bg-emerald-500 text-black hover:bg-emerald-400"

  if (as === "link") {
    return (
      <Link href={href || "/auth/signup"} className={clsx(base, state, className)}>
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, state, className)}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  href,
  className,
}: {
  children: React.ReactNode
  href: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white",
        className
      )}
    >
      {children}
    </Link>
  )
}

function Divider({ className }: { className?: string }) {
  return <div className={clsx("h-px w-full bg-white/10", className)} />
}

/* -------------------------------------------------------------------------------------------------
 * Feature definitions
 * ------------------------------------------------------------------------------------------------ */

type FeatureKey =
  | "analytics"
  | "journal"
  | "calculators"
  | "backtester"
  | "calendar"
  | "fundamentals"

type Feature = {
  key: FeatureKey
  image: string
  name: string
  icon: any
  tagline: string
  bullets: string[]
  outcomes: string[]
  previewTitle: string
  previewSubtitle: string
  colorHint: "emerald" | "blue" | "yellow" | "purple" | "red"
}

const FEATURES: Feature[] = [
  {
    key: "analytics",
    name: "Analytics (AI-Powered)",
    icon: BarChart3,
    tagline:
      "See what you're missing — instantly. No fluff, no gimmicks, just the truth.",
    bullets: [
      "AI highlights the real reason your trades underperform",
      "Session + setup breakdowns with clear “do more / do less”",
      "Clean KPIs that matter (not 100 useless metrics)",
      "Actionable improvement prompts you can execute today",
    ],
    outcomes: [
      "Stop repeating the same mistakes",
      "Identify the setups that actually pay",
      "Build a repeatable edge with clarity",
    ],
    previewTitle: "AI Analytics",
    previewSubtitle: "Pinpoint why you’re leaking performance in 30 seconds.",
    colorHint: "emerald",
    image: "/ANALYTICS1.png",
  },
  {
    key: "journal",
    name: "Journal",
    icon: BookOpen,
    tagline:
      "A journal that gets the job done. Minimal, clean, fast — built for traders.",
    bullets: [
      "Tag mistakes, setups, habits in seconds",
      "No clutter, no noise, no endless fields",
      "Quick reflections that actually stick",
      "Your data stays usable (not buried in UI)",
    ],
    outcomes: [
      "Lower friction = higher consistency",
      "Cleaner habits and tighter execution",
      "Faster learning from repetition",
    ],
    previewTitle: "Simple Journal",
    previewSubtitle: "A few clicks → a trade is fully documented.",
    colorHint: "blue",
    image: "/JOURNAL1.png",
  },
  {
    key: "calculators",
    name: "Calculators",
    icon: Calculator,
    tagline:
      "Margin + position sizing in one place. No more 10 tabs and 5 websites.",
    bullets: [
      "All-in-one: margin, risk %, position size",
      "Designed to be fast & obvious",
      "Clean presets, fewer mistakes",
      "Extremely low price compared to paying for multiple tools",
    ],
    outcomes: [
      "Position size correctly every time",
      "Reduce errors under pressure",
      "Trade with consistent risk",
    ],
    previewTitle: "Calculator Hub",
    previewSubtitle: "Everything risk-related in one tight interface.",
    colorHint: "yellow",
    image: "/MARGIN1.png",
  },
  {
    key: "backtester",
    name: "Backtester",
    icon: FlaskConical,
    tagline:
      "A backtesting tool that does what it should: collect data with zero friction.",
    bullets: [
      "Fast trade logging for backtest data",
      "No 100-step workflows",
      "Clean dataset output you can trust",
      "Focus on repetition and accuracy",
    ],
    outcomes: [
      "Backtest more in less time",
      "Keep data consistent",
      "Validate edge without burnout",
    ],
    previewTitle: "Backtesting",
    previewSubtitle: "Log quickly → gather data → refine your edge.",
    colorHint: "purple",
    image: "/BACKTESTER1.png",
  },
  {
    key: "calendar",
    name: "News Calendar",
    icon: Newspaper,
    tagline:
      "High-impact news in one place — with clear symbol warnings for when to avoid trading.",
    bullets: [
      "No ForexFactory tabs or extensions",
      "Filter by symbols you actually trade",
      "Clear “safe to trade” indicators",
      "Designed to prevent stupid losses",
    ],
    outcomes: [
      "Avoid trading into landmines",
      "Trade with confidence",
      "Cleaner performance around news",
    ],
    previewTitle: "Economic Calendar",
    previewSubtitle: "Know when NOT to trade — instantly per symbol.",
    colorHint: "red",
    image: "/NEWS1.png",
  },
  {
    key: "fundamentals",
    name: "Fundamentals",
    icon: Globe2,
    tagline:
      "So easy even technical traders can use them — and understand why technicals failed.",
    bullets: [
      "AI-driven insights on major releases",
      "Quick context: what mattered, what changed",
      "Learn why the market moved (not just that it moved)",
      "Turn fundamentals into a practical edge",
    ],
    outcomes: [
      "Fewer ‘random’ stop-outs",
      "Better trade timing & context",
      "Higher conviction execution",
    ],
    previewTitle: "Fundamental Context",
    previewSubtitle: "Translate macro events into trader decisions.",
    colorHint: "emerald",
    image: "/FUNDAMENTALS1.png",
  },
]

/* -------------------------------------------------------------------------------------------------
 * Mock Preview Components (replace with real screenshots later)
 * ------------------------------------------------------------------------------------------------ */

function PreviewFrame({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string
  subtitle: string
  hint: Feature["colorHint"]
  children: React.ReactNode
}) {
  const ring =
    hint === "emerald"
      ? "ring-emerald-400/20"
      : hint === "blue"
      ? "ring-sky-400/20"
      : hint === "yellow"
      ? "ring-yellow-400/20"
      : hint === "purple"
      ? "ring-purple-400/20"
      : "ring-red-400/20"

  const glow =
    hint === "emerald"
      ? "from-emerald-500/10"
      : hint === "blue"
      ? "from-sky-500/10"
      : hint === "yellow"
      ? "from-yellow-500/10"
      : hint === "purple"
      ? "from-purple-500/10"
      : "from-red-500/10"

  return (
    <div className="relative">
      <div
        className={clsx(
          "absolute -inset-1 rounded-3xl bg-gradient-to-b to-transparent blur-xl",
          glow
        )}
      />
      <div
        className={clsx(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_30px_90px_rgba(0,0,0,0.7)] ring-1",
          ring
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs text-white/50">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function SkeletonLine({ w = "w-full" }: { w?: string }) {
  return <div className={clsx("h-3 rounded bg-white/10", w)} />
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  )
}

function FeaturePreviewMock({ feature }: { feature: Feature }) {
  // Different layouts per feature for visual variety
  if (feature.key === "analytics") {
    return (
      <PreviewFrame
        title={feature.previewTitle}
        subtitle={feature.previewSubtitle}
        hint={feature.colorHint}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">Edge Snapshot</div>
              <Chip>AI</Chip>
            </div>
            <div className="text-2xl font-semibold text-white">+1.84R</div>
            <div className="mt-2 text-xs text-white/50">
              Most consistent setup this week
            </div>
            <div className="mt-4 space-y-2">
              <SkeletonLine w="w-4/5" />
              <SkeletonLine w="w-3/5" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">What you’re missing</div>
              <Chip>Action plan</Chip>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                <div className="text-sm font-semibold text-emerald-200">
                  Reduce entries in chop
                </div>
                <div className="mt-1 text-xs text-emerald-100/70">
                  Your losses cluster during low volatility between sessions.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-sm font-semibold text-white">
                  Increase focus on Setup A
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Highest expectancy. Best when aligned with news calendar.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Winrate</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    57%
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Avg R</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    0.42
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Max DD</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    -2.1%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (feature.key === "journal") {
    return (
      <PreviewFrame
        title={feature.previewTitle}
        subtitle={feature.previewSubtitle}
        hint={feature.colorHint}
      >
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <div className="text-xs text-white/60">Tags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>mistake: late entry</Chip>
              <Chip>setup: gap &amp; go</Chip>
              <Chip>habit: slept well</Chip>
              <Chip>emotion: impatience</Chip>
              <Chip>rule: news proximity</Chip>
            </div>
            <div className="mt-4 space-y-2">
              <SkeletonLine w="w-full" />
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-3/4" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">Reflection</div>
              <Chip>2 min</Chip>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-4">
              <SkeletonLine w="w-5/6" />
              <div className="mt-2 space-y-2">
                <SkeletonLine w="w-full" />
                <SkeletonLine w="w-11/12" />
                <SkeletonLine w="w-10/12" />
                <SkeletonLine w="w-9/12" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Setup</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Pullback
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Grade</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  B+
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Next time</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Wait confirm
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (feature.key === "calculators") {
    return (
      <PreviewFrame
        title={feature.previewTitle}
        subtitle={feature.previewSubtitle}
        hint={feature.colorHint}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">Position Size</div>
              <Chip>fast</Chip>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Symbol</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  EURUSD
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Risk</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    1%
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Stop</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    18 pips
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                <div className="text-xs text-yellow-100/70">Result</div>
                <div className="mt-1 text-lg font-semibold text-yellow-200">
                  0.55 lots
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">Margin</div>
              <Chip>one place</Chip>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Leverage</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    1:500
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Size</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    1.0
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50">Price</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    1.0924
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs text-white/50">Required margin</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  $218.40
                </div>
                <div className="mt-1 text-xs text-white/50">
                  Keep it simple. Know your limits.
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (feature.key === "backtester") {
    return (
      <PreviewFrame
        title={feature.previewTitle}
        subtitle={feature.previewSubtitle}
        hint={feature.colorHint}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">Trade Log</div>
              <Chip>0 friction</Chip>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-black/40 p-3"
                >
                  <div className="text-xs text-white/50">Entry</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {i % 2 ? "Breakout" : "Pullback"}
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    R: {i % 3 === 0 ? "+1.2" : i % 3 === 1 ? "-0.6" : "+0.3"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Dataset</div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Trades logged</div>
                <div className="mt-1 text-lg font-semibold text-white">142</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/50">Avg R</div>
                <div className="mt-1 text-lg font-semibold text-white">0.41</div>
              </div>
              <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-3">
                <div className="text-xs text-purple-100/70">Best setup</div>
                <div className="mt-1 text-sm font-semibold known text-purple-200">
                  London pullback
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  if (feature.key === "calendar") {
    return (
      <PreviewFrame
        title={feature.previewTitle}
        subtitle={feature.previewSubtitle}
        hint={feature.colorHint}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-white/60">High impact events</div>
              <Chip>filtered</Chip>
            </div>

            <div className="space-y-2">
              {[
                { t: "CPI (US)", c: "USD", i: "High", ok: false },
                { t: "BoE Rate Decision", c: "GBP", i: "High", ok: false },
                { t: "Retail Sales (AU)", c: "AUD", i: "Medium", ok: true },
                { t: "Unemployment (CA)", c: "CAD", i: "High", ok: false },
              ].map((e) => (
                <div
                  key={e.t}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {e.t}
                    </div>
                    <div className="mt-0.5 text-xs text-white/50">
                      Currency: {e.c} · Impact: {e.i}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "ml-3 shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                      e.ok
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-red-400/20 bg-red-400/10 text-red-200"
                    )}
                  >
                    {e.ok ? "OK" : "AVOID"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Your symbols</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>EURUSD</Chip>
              <Chip>GBPUSD</Chip>
              <Chip>NAS100</Chip>
              <Chip>XAUUSD</Chip>
              <Chip>US30</Chip>
            </div>

            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3">
              <div className="text-xs text-red-100/70">Warning</div>
              <div className="mt-1 text-sm font-semibold text-red-200">
                High-impact USD event soon
              </div>
              <div className="mt-1 text-xs text-red-100/60">
                Avoid USD pairs during release window.
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <SkeletonLine w="w-full" />
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  // fundamentals
  return (
    <PreviewFrame
      title={feature.previewTitle}
      subtitle={feature.previewSubtitle}
      hint={feature.colorHint}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-white/60">Release summary</div>
            <Chip>AI</Chip>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
            <div className="text-sm font-semibold text-emerald-200">
              CPI came in hotter than expected
            </div>
            <div className="mt-1 text-xs text-emerald-100/70">
              Higher inflation increases rate-hike probability.
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Market reaction</div>
              <div className="mt-1 text-sm font-semibold text-white">
                USD strength · risk-off
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Implication</div>
              <div className="mt-1 text-sm font-semibold text-white">
                Expect volatility on USD pairs
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-white/60">Why your technical failed</div>
            <Chip>context</Chip>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <SkeletonLine w="w-5/6" />
            <div className="mt-3 space-y-2">
              <SkeletonLine w="w-full" />
              <SkeletonLine w="w-11/12" />
              <SkeletonLine w="w-10/12" />
              <SkeletonLine w="w-9/12" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip>liquidity</Chip>
            <Chip>expectations</Chip>
            <Chip>rate path</Chip>
            <Chip>risk sentiment</Chip>
          </div>
        </div>
      </div>
    </PreviewFrame>
  )
}

/* -------------------------------------------------------------------------------------------------
 * FAQ
 * ------------------------------------------------------------------------------------------------ */

type FAQ = { q: string; a: string }

const FAQS: FAQ[] = [
  {
    q: "Is EDGELY.AI a signal service?",
    a: "No. EDGELY.AI is a performance system: analytics, rules, journaling, calculators, backtesting, and news/fundamental context. It helps you avoid mistakes and improve execution — it doesn’t sell signals.",
  },
  {
    q: "Do I need to be an advanced trader?",
    a: "No. The whole point is simplicity. EDGELY.AI is designed to remove clutter and focus on what actually moves performance: risk, rule compliance, and repeatable execution.",
  },
  {
    q: "Does it work for futures and CFDs?",
    a: "Yes. The toolkit is built around the workflows traders actually use. You can apply the same clarity, risk rules, and analysis regardless of instrument type.",
  },
  {
    q: "What do I get in the 14-day free trial?",
    a: "Full access to the platform. You can explore features, run your tools, and evaluate whether it fits your workflow. Cancel anytime.",
  },
  {
    q: "Will this replace my journal or spreadsheets?",
    a: "For most traders, yes. EDGELY.AI aims to simplify journaling and data collection so you don’t live in spreadsheets — without losing what matters.",
  },
]

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="text-sm font-semibold text-white">{item.q}</div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-white/60 transition",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-white/60">{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Landing Page
 * ------------------------------------------------------------------------------------------------ */

export default function LandingPage() {
  const [activeKey, setActiveKey] = useState<FeatureKey>("analytics")
  const [trialEmail, setTrialEmail] = useState("")
  const active = useMemo(
    () => FEATURES.find((f) => f.key === activeKey) || FEATURES[0],
    [activeKey]
  )

  function buildSignupHref(email?: string) {
    const base = "/auth/signup"
    if (!email) return base
    const e = email.trim()
    if (!e) return base
    const qs = new URLSearchParams({ email: e })
    return `${base}?${qs.toString()}`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/75 backdrop-blur">
        <Container className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <div>
              <div className="text-s font-semibold tracking-widest text-emerald-400">
                EDGELY.AI
              </div>
              <div className="text-xs text-white/50">
                All In One AI Prop Toolkit
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-5 text-sm md:flex">
            <a href="#features" className="text-white/60 hover:text-white">
              Features
            </a>
            <a href="#how" className="text-white/60 hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="text-white/60 hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="text-white/60 hover:text-white">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/60 hover:text-white">
              Login
            </Link>
            <PrimaryButton as="link" href={buildSignupHref(trialEmail)}>
              Start free trial <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="pt-16 md:pt-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="emerald">
                  <Sparkles className="h-3.5 w-3.5" />
                  14-day free trial
                </Pill>
                <Pill tone="neutral">
                  <Shield className="h-3.5 w-3.5" />
                  Built for clarity — not clutter
                </Pill>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-5 text-4xl font-semibold leading-tight md:text-5xl"
              >
                Stop guessing.
                <span className="text-emerald-400"> Fix what’s wrong</span> with your
                trading — fast.
              </motion.h1>

              <p className="mt-5 max-w-xl text-lg text-white/60">
                EDGELY.AI is a simplified trading toolkit: AI-driven analytics,
                a clean journal, all-in-one calculators, frictionless backtesting,
                a news calendar with symbol warnings, and fundamentals made easy.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton as="link" href={buildSignupHref(trialEmail)} className="px-6">
                  Start 14-day free trial <ArrowRight className="h-4 w-4" />
                </PrimaryButton>

              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  14 Days free trial
                </span>
                <span className="inline-flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5" />
                  Set up in minutes
                </span>
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Built to reduce mistakes
                </span>
              </div>
           </div>
          </div>
        </Container>
      </section>

      {/* Social proof / Values */}
      <section className="mt-16 border-y border-white/10 bg-white/[0.02] py-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: ShieldAlert,
                title: "No clutter",
                desc: "Built to remove noise and keep traders consistent.",
              },
              {
                icon: LineChart,
                title: "Only what matters",
                desc: "No 100-metric dashboards. Just performance truth.",
              },
              {
                icon: Layers,
                title: "All-in-one",
                desc: "Journal + analytics + calculators + calendar.",
              },
              {
                icon: HeartHandshake,
                title: "Low price",
                desc: "Stop paying for multiple tools and subscriptions.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <v.icon className="h-5 w-5 text-emerald-400" />
                <div className="mt-3 text-sm font-semibold">{v.title}</div>
                <div className="mt-1 text-sm text-white/60">{v.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tradexella-style feature switcher */}
      <section id="features" className="py-20 md:py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-semibold tracking-widest text-emerald-400">
                FEATURES
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Click a feature. See the vibe.
              </h2>
              <p className="mt-3 max-w-2xl text-white/60">
                Everything is designed to be fast, clean, and practical — the opposite
                of overcrowded competitor platforms.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill tone="neutral">No bloat</Pill>
              <Pill tone="neutral">No distractions</Pill>
              <Pill tone="neutral">Simple workflows</Pill>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            {/* Left selector */}
            <div className="lg:col-span-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                {FEATURES.map((f) => {
                  const isActive = f.key === activeKey
                  const Icon = f.icon
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveKey(f.key)}
                      className={clsx(
                        "group flex w-full items-start gap-3 rounded-2xl p-4 text-left transition",
                        isActive
                          ? "border border-emerald-400/20 bg-emerald-400/10"
                          : "border border-transparent hover:bg-white/[0.03]"
                      )}
                    >
                      <div
                        className={clsx(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                          isActive
                            ? "border-emerald-400/20 bg-emerald-400/10"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <Icon
                          className={clsx(
                            "h-4 w-4",
                            isActive ? "text-emerald-200" : "text-white/60"
                          )}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={clsx(
                              "truncate text-sm font-semibold",
                              isActive ? "text-white" : "text-white/80"
                            )}
                          >
                            {f.name}
                          </div>
                          <ChevronRight
                            className={clsx(
                              "h-4 w-4 shrink-0 transition",
                              isActive
                                ? "text-emerald-200"
                                : "text-white/30 group-hover:text-white/60"
                            )}
                          />
                        </div>
                        <div
                          className={clsx(
                            "mt-1 text-xs leading-relaxed",
                            isActive ? "text-white/60" : "text-white/45"
                          )}
                        >
                          {f.tagline}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Outcomes */}
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-sm font-semibold">What you get</div>
                <div className="mt-3 space-y-2">
                  {active.outcomes.map((o) => (
                    <div key={o} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>{o}</span>
                    </div>
                  ))}
                </div>

                <Divider className="my-5" />

                <Link
                  href={buildSignupHref(trialEmail)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right preview */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <FeaturePreviewImage feature={active} />
              </motion.div>
            </AnimatePresence>

              {/* Bullets */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {active.bullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                        {idx + 1}
                      </span>
                      <div className="text-sm text-white/70">{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/10 bg-white/[0.02] py-20 md:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="text-xs font-semibold tracking-widest text-emerald-400">
                HOW IT WORKS
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                A workflow you’ll actually maintain
              </h2>
              <p className="mt-3 text-white/60">
                EDGELY.AI is built for execution: fewer steps, cleaner screens, and
                useful insights — so you stay consistent.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill tone="neutral">Fast inputs</Pill>
                <Pill tone="neutral">Clear outputs</Pill>
                <Pill tone="neutral">Less mental load</Pill>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    icon: Zap,
                    title: "1) Use the tools daily",
                    desc: "Position size, journal quickly, check calendar warnings.",
                  },
                  {
                    icon: BarChart3,
                    title: "2) Review what matters",
                    desc: "Analytics show patterns, not noise. Focus on correction.",
                  },
                  {
                    icon: Sparkles,
                    title: "3) Get AI clarity",
                    desc: "See where you leak edge — and what to do next.",
                  },
                  {
                    icon: Shield,
                    title: "4) Trade with discipline",
                    desc: "The platform nudges you away from common failure zones.",
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="rounded-3xl border border-white/10 bg-black/40 p-6"
                  >
                    <s.icon className="h-5 w-5 text-emerald-400" />
                    <div className="mt-3 text-sm font-semibold">{s.title}</div>
                    <div className="mt-1 text-sm text-white/60">{s.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-emerald-200">
                      Designed to be the last toolkit you open
                    </div>
                    <div className="mt-1 text-sm text-emerald-100/70">
                      Analytics, journal, calculators, backtesting, calendar, fundamentals —
                      simplified so you can focus on trading.
                    </div>
                  </div>
                  <Star className="h-5 w-5 text-emerald-200" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing */}
      {/* Pricing */}
<section id="pricing" className="py-20 md:py-24">
  <Container>
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-xs font-semibold tracking-widest text-emerald-400">
        PRICING
      </div>

      <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
        Simple pricing. Full access.
      </h2>

      <p className="mt-4 text-lg text-white/60">
        No tiers. No feature limits. Everything EDGELY.AI offers —
        for one low monthly price.
      </p>
    </div>

    <div className="mx-auto mt-12 max-w-xl">
      <div className="relative rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
        {/* Badge */}
        <div className="absolute right-6 top-6 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          14-day free trial
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-emerald-100/80">
            EDGELY.AI — Full Access
          </div>

          <div className="mt-4 flex items-end justify-center gap-2">
            <span className="text-5xl font-semibold text-white">£10</span>
            <span className="pb-1 text-lg text-emerald-100/70">/ month</span>
          </div>

          <p className="mt-3 text-sm text-emerald-100/70">
            Start with a free 14-day trial. Cancel anytime.
          </p>
        </div>

        <div className="mt-8 space-y-3 text-sm text-emerald-100/80">
          {[
            "AI-powered analytics (no fluff)",
            "Clean, fast trade journal",
            "All-in-one calculators (risk & margin)",
            "Frictionless backtesting",
            "News calendar with symbol warnings",
            "Fundamentals made simple with AI insights",
            "All future updates included",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <PrimaryButton
            as="link"
            href={buildSignupHref(trialEmail)}
            className="w-full py-4 text-base"
          >
            Start 14-day free trial
          </PrimaryButton>

          <div className="text-center text-xs text-emerald-100/60">
            No charge during trial
          </div>
        </div>
      </div>
    </div>
  </Container>
</section>


      {/* FAQ */}
      <section id="faq" className="border-t border-white/10 bg-white/[0.02] py-20 md:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="text-xs font-semibold tracking-widest text-emerald-400">
                FAQ
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Simple answers
              </h2>
              <p className="mt-3 text-white/60">
                If you want a clean toolkit to improve faster and trade safer,
                EDGELY.AI is built for you.
              </p>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold">Need help?</div>
                    <div className="text-xs text-white/50">
                      Start the trial, then message support from inside the app.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-4">
                {FAQS.map((f) => (
                  <FAQItem key={f.q} item={f} />
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-emerald-200">
                      Ready to simplify your trading workflow?
                    </div>
                    <div className="mt-1 text-sm text-emerald-100/70">
                      Start the 14-day free trial. No charge during trial.
                    </div>
                  </div>
                  <PrimaryButton as="link" href={buildSignupHref(trialEmail)}>
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <Container>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-emerald-400">
                EDGELY.AI
              </div>
              <div className="mt-2 max-w-sm text-sm text-white/60">
                Simplified trading tools: AI analytics, clean journaling, all-in-one
                calculators, frictionless backtesting, news calendar warnings, and
                fundamentals made easy.
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Privacy-minded
                </span>
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> Built for discipline
                </span>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <div className="text-sm font-semibold">Product</div>
                <div className="mt-3 space-y-2 text-sm text-white/60">
                  <a href="#features" className="block hover:text-white">
                    Features
                  </a>
                  <a href="#how" className="block hover:text-white">
                    How it works
                  </a>
                  <a href="#pricing" className="block hover:text-white">
                    Pricing
                  </a>
                  <a href="#faq" className="block hover:text-white">
                    FAQ
                  </a>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Account</div>
                <div className="mt-3 space-y-2 text-sm text-white/60">
                  <Link href="/auth/login" className="block hover:text-white">
                    Login
                  </Link>
                  <Link href="/auth/signup" className="block hover:text-white">
                    Start trial
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Legal</div>
                <div className="mt-3 space-y-2 text-sm text-white/60">
                  <span className="block text-white/40">Terms (add later)</span>
                  <span className="block text-white/40">Privacy (add later)</span>
                  <span className="block text-white/40">Disclaimer (add later)</span>
                </div>
              </div>
            </div>
          </div>

          <Divider className="my-10" />

          <div className="flex flex-col gap-3 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} EDGELY.AI. All rights reserved.</div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2">
                <Star className="h-3.5 w-3.5" /> Built for serious traders
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" /> No signals. No hype.
              </span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
