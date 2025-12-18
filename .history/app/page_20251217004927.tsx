"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import GlowButton from "@/components/GlowButton"
import TerminalCard from "@/components/TerminalCard"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-8 py-6">
        <div className="font-mono text-lg">
          PropGuru<span className="text-accent-green">.AI</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/auth/login" className="text-text-muted hover:text-white">
            Login
          </Link>
          <Link href="/auth/signup">
            <GlowButton>Get Started</GlowButton>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-8 py-28">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-semibold leading-tight"
        >
          Your prop-firm AI guru that helps you{" "}
          <span className="text-accent-green">pass — and stay funded</span>
        </motion.h1>

        <p className="mt-6 max-w-2xl text-lg text-text-muted">
          Always-on coaching across risk management, strategy optimization,
          psychology, and prop-firm rule compliance.
        </p>

        <div className="mt-10 flex gap-4">
          <Link href="/auth/login">
            <GlowButton>Try Demo Dashboard</GlowButton>
          </Link>
          <button className="rounded border border-border px-5 py-2 text-sm text-text-muted hover:text-white">
            Join Waitlist
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <h2 className="mb-12 text-2xl font-semibold">How it works</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            "Connect your trades",
            "Select prop-firm rules",
            "Track challenges live",
            "Get AI coaching daily",
          ].map((step, i) => (
            <TerminalCard key={i} title={`Step ${i + 1}`}>
              <p className="text-sm text-text-muted">{step}</p>
            </TerminalCard>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <h2 className="mb-12 text-2xl font-semibold">Core features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            "Prop-firm rule engine",
            "AI risk & psychology coach",
            "Live challenge tracking",
            "Trade diagnostics",
            "Journaling replacement",
            "Improvement plans",
          ].map((feature) => (
            <TerminalCard key={feature}>
              <p className="text-sm">{feature}</p>
            </TerminalCard>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <h2 className="mb-12 text-2xl font-semibold">Traders using PropGuru</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            "“Passed my first FTMO challenge with zero rule violations.”",
            "“Finally understood why I kept failing Phase 1.”",
            "“Feels like a mentor watching every trade.”",
          ].map((quote, i) => (
            <TerminalCard key={i}>
              <p className="text-sm text-text-muted">{quote}</p>
            </TerminalCard>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <h2 className="mb-12 text-2xl font-semibold">Pricing</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Starter", price: "$29" },
            { name: "Pro", price: "$59" },
            { name: "Elite", price: "$99" },
          ].map((tier) => (
            <TerminalCard key={tier.name} title={tier.name}>
              <p className="font-mono text-xl">{tier.price}/mo</p>
              <p className="mt-2 text-sm text-text-muted">
                Full AI coaching & analytics
              </p>
            </TerminalCard>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-10 text-sm text-text-muted">
        © 2025 PropGuru AI · Built for serious prop traders
      </footer>
    </div>
  )
}
