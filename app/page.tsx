
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
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import {
  ArrowRight,
  Check,
  Mail,
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
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/60 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">



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

  colorHint: "emerald" | "blue" | "yellow" | "purple" | "red"
}

const FEATURES: Feature[] = [
  {
    key: "analytics",
    name: "Analytics",
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
    colorHint: "emerald",
    image: "/ANALYTICS.png",
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

    colorHint: "blue",
    image: "/JOURNAL.png",
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

    colorHint: "yellow",
    image: "/MARGIN.png",
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

    colorHint: "purple",
    image: "/BACKTESTER.png",
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

    colorHint: "red",
    image: "/NEWS.png",
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

    colorHint: "emerald",
    image: "/FUNDAMENTALS.png",
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

function FeatureSlider({
  activeKey,
  onChange,
}: {
  activeKey: FeatureKey
  onChange: (k: FeatureKey) => void
}) {
  return (
    <div className="relative">
      <div className="
        flex gap-5
        overflow-x-auto scrollbar-hide px-2
        md:justify-center md:overflow-visible md:px-0
      ">
        {FEATURES.map((f) => {
          const Icon = f.icon
          const active = f.key === activeKey

          return (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className="
                group shrink-0
                flex flex-col items-center gap-2
                focus:outline-none
              "
            >
              {/* Icon button */}
              <div
                className={clsx(
                  "flex items-center justify-center rounded-2xl border transition-all",
                  // 📱 Mobile size
                  "h-14 w-14",
                  // 🖥 Desktop size
                  "md:h-24 md:w-24",
                  active
                    ? "border-emerald-400/40 bg-emerald-400/15"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                )}
              >
                <div
                  className={clsx(
                    "flex items-center justify-center rounded-xl border transition-all",
                    // 📱 Mobile
                    "h-9 w-9",
                    // 🖥 Desktop
                    "md:h-16 md:w-16",
                    active
                      ? "border-emerald-400/40 bg-emerald-400/15"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  <Icon
                    className={clsx(
                      // 📱 Mobile
                      "h-5 w-5",
                      // 🖥 Desktop
                      "md:h-8 md:w-8",
                      active ? "text-emerald-300" : "text-white/70"
                    )}
                  />
                </div>
              </div>

              {/* Label */}
              <span
                className={clsx(
                  // 📱 Mobile label
                  "text-xs",
                  // 🖥 Desktop label
                  "md:text-sm",
                  "font-medium whitespace-nowrap transition",
                  active ? "text-white" : "text-white/60"
                )}
              >
                {f.name}
              </span>

              {/* Active indicator */}
              {active && (
                <span className="h-0.5 w-5 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile fade hints */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black to-transparent md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black to-transparent md:hidden" />
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
<section className="mt-16 border-y border-white/10 bg-white/[0.02] py-12">
  <Container>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          icon: ShieldAlert,
          title: "No clutter",
          desc: "Designed to remove noise and keep execution consistent.",
        },
        {
          icon: LineChart,
          title: "Only what matters",
          desc: "No bloated dashboards. Just performance truth.",
        },
        {
          icon: Layers,
          title: "All-in-one",
          desc: "Journal, analytics, calculators, calendar — together.",
        },
        {
          icon: HeartHandshake,
          title: "Fair pricing",
          desc: "One tool instead of multiple subscriptions.",
        },
      ].map((v) => (
        <div
          key={v.title}
          className="rounded-2xl border border-white/10 bg-black/40 p-5"
        >
          <v.icon className="h-5 w-5 text-emerald-400" />
          <div className="mt-3 text-sm font-semibold text-white">
            {v.title}
          </div>
          <div className="mt-1 text-sm text-white/60">
            {v.desc}
          </div>
        </div>
      ))}
    </div>
  </Container>
</section>

{/* Feature switcher */}
<section id="features" className="py-20 md:py-24">
  <Container>
    {/* Header */}
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="text-xs font-semibold tracking-widest text-emerald-400">
          FEATURES
        </div>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
          Click a feature. See the vibe.
        </h2>
        <p className="mt-3 max-w-2xl text-white/60">
          Everything is built to be fast, clean, and practical — the opposite
          of overcrowded trading platforms.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill tone="neutral">No bloat</Pill>
        <Pill tone="neutral">No distractions</Pill>
        <Pill tone="neutral">Simple workflows</Pill>
      </div>
    </div>

    {/* Content */}
    <div className="mt-6 space-y-6">
      {/* Feature slider rail */}
      <div className="rounded-2xl border border-black bg-white/[0.02] px-4 py-3">
        <FeatureSlider
          activeKey={activeKey}
          onChange={setActiveKey}
        />
      </div>

      {/* Sliding preview */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <FeaturePreviewImage feature={active} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feature bullets */}
      <div className="grid gap-4 md:grid-cols-2">
        {active.bullets.map((b, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                {idx + 1}
              </span>
              <div className="text-sm text-white/70">
                {b}
              </div>
            </div>
          </div>
        ))}
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
      <div className="relative rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-6 md:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">

        {/* Badge */}
        {/* Badge */}
{/* Badge */}
<div className="mb-5 flex justify-center md:absolute md:right-6 md:top-6 md:mb-0">
  <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
    14-day free trial
  </div>
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
    <Mail className="h-5 w-5 text-emerald-400" />
    <div>
      <div className="text-sm font-semibold">Need help?</div>
      <div className="text-xs text-white/50">
        Email us at{" "}
        <a
          href="mailto:support@edgely.ai"
          className="font-medium text-emerald-300 hover:text-emerald-200"
        >
          support@edgely.ai
        </a>
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
                      <Link href="/terms" className="block hover:text-white">
                        Terms of Service
                      </Link>
                      <Link href="/privacy" className="block hover:text-white">
                        Privacy Policy
                      </Link>
                      <Link href="/disclaimer" className="block hover:text-white">
                        Disclaimer
                      </Link>
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
