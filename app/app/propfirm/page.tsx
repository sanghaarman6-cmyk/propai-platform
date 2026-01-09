"use client"

import React, { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import clsx from "clsx"
import {
  ArrowUpRight,
  BadgeInfo,
  Banknote,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Filter,
  Gem,
  Info,
  Lock,
  Search,
  Shield,
  Sparkles,
  Target,
  X,
} from "lucide-react"
import Image from "next/image"

/**
 * ============================================================================
 * PROP FIRMS PAGE — page.tsx (copy/paste ready)
 * ----------------------------------------------------------------------------
 * Goal:
 * - Premium prop-firm directory UI (cards -> details -> programs -> rules)
 * - Everything is editable via a single data object (FIRMS) below.
 * - Includes “Hidden Rules” section as a clearly editable template.
 *
 * Notes on data:
 * - “Public rules” below are filled from each firm’s own public docs/pages
 *   wherever possible (and widely-known published objectives).
 * - Pricing changes often (discount codes, promos, regional pricing),
 *   so treat pricing as “baseline” and edit easily in FIRMS.
 *
 * Tip:
 * - You can later pull “hidden rules” from your Discord research and paste
 *   into the `hiddenRules` arrays per program or per firm.
 * ============================================================================
 */

/* --------------------------------- Types --------------------------------- */

type Money = {
  currency: "USD" | "EUR" | "GBP"
  amount: number
  note?: string
}

type RuleItem = {
  label: string
  value: string
  tone?: "neutral" | "good" | "warn" | "bad"
  hint?: string
}

type Program = {
  id: string
  name: string
  subtitle?: string
  steps: number
  markets: string[] // e.g. ["Forex", "Indices", "Metals", "Crypto"]
  platforms?: string[] // e.g. ["MT5", "cTrader", "TradeLocker"]
  payoutSplit?: string // e.g. "Up to 90%" or "80%"
  timeLimit?: string // e.g. "No time limit" / "30 days"
  minTradingDays?: string // e.g. "4 days" / "5 days"
  pricingTiers: Array<{
    sizeLabel: string // "10K", "50K", "100K"
    price: Money
    promoNote?: string
  }>
  objectives: RuleItem[] // profit targets, DD, etc.
  rules: RuleItem[] // trading restrictions, news/weekend, inactivity, etc.
  hiddenRules: Array<{
    title: string
    bullets: string[]
    severity?: "low" | "medium" | "high"
  }>
  sourcesInComments?: string[] // put URLs in comments (optional)
}

type Firm = {
  id: string
  name: string
  countryHint?: string
  website: string
  shortPitch: string
  tags: string[]
  brand: {
    accentClass: string // tailwind text/bg accent
  }
  highlights: RuleItem[]
  programs: Program[]
  firmLevelHiddenRules: Array<{
    title: string
    bullets: string[]
    severity?: "low" | "medium" | "high"
  }>
}

/* ------------------------------- Firm Data --------------------------------
 * EDIT HERE:
 * - Add/remove firms
 * - Update pricing, rules, hidden rules
 * - Add more programs per firm
 *
 * If you want “one truth table”:
 * - Keep everything inside FIRMS and never touch the UI.
 * ------------------------------------------------------------------------- */
function FirmMark({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")

  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-[11px] font-extrabold tracking-widest text-white/90"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </div>
  )
}

const FIRMS: Firm[] = [
  {
    id: "ftmo",
    name: "FTMO",
    website: "https://ftmo.com/",
    shortPitch:
      "Top-tier two-step evaluation with strict equity-based risk limits, unlimited time, and highly standardized objective enforcement.",
    tags: ["2-Step", "Refundable fee", "Up to 90% split", "No time limit"],
    brand: { accentClass: "text-emerald-400" },
    highlights: [
      { label: "Evaluation targets", value: "10% / 5%", tone: "neutral" },
      { label: "Drawdown rules", value: "5% daily / 10% max", tone: "warn" },
      { label: "Time limit", value: "Unlimited", tone: "good" },
      { label: "Min trading days", value: "4 per phase", tone: "neutral" },
    ],
    programs: [
      {
        id: "ftmo-normal-2step",
        name: "FTMO Challenge (Normal)",
        subtitle: "Classic two-step evaluation (Challenge → Verification)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5", "cTrader"],
        payoutSplit: "80%–90%",
        timeLimit: "No time limit",
        minTradingDays: "4 trading days per phase",
        pricingTiers: [
          { sizeLabel: "10K", price: { currency: "EUR", amount: 155 } },
          { sizeLabel: "25K", price: { currency: "EUR", amount: 250 } },
          { sizeLabel: "50K", price: { currency: "EUR", amount: 345 } },
          { sizeLabel: "100K", price: { currency: "EUR", amount: 540 } },
          { sizeLabel: "200K", price: { currency: "EUR", amount: 1080 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Loss", value: "5%", tone: "warn" },
          { label: "Max Loss", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "4 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Time limit", value: "Unlimited", tone: "good" },
          { label: "Fee refund", value: "Refunded after first payout", tone: "good" },
          { label: "Drawdown basis", value: "Equity-based enforcement", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Commonly missed enforcement mechanics",
            severity: "medium",
            bullets: [
              "Daily loss breaches fail instantly even if equity later recovers.",
              "Max loss is enforced on equity at all times during evaluation.",
            ],
          },
        ],
      },
      {
        id: "ftmo-swing-2step",
        name: "FTMO Challenge (Swing)",
        subtitle: "Two-step evaluation designed to support swing/longer holding behavior",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5", "cTrader"],
        payoutSplit: "80%–90%",
        timeLimit: "No time limit",
        minTradingDays: "4 trading days per phase",
        pricingTiers: [
          { sizeLabel: "10K", price: { currency: "EUR", amount: 155 } },
          { sizeLabel: "25K", price: { currency: "EUR", amount: 250 } },
          { sizeLabel: "50K", price: { currency: "EUR", amount: 345 } },
          { sizeLabel: "100K", price: { currency: "EUR", amount: 540 } },
          { sizeLabel: "200K", price: { currency: "EUR", amount: 1080 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Loss", value: "5%", tone: "warn" },
          { label: "Max Loss", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "4 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Weekend holding", value: "Allowed on Swing", tone: "good" },
          { label: "Time limit", value: "Unlimited", tone: "good" },
          { label: "Drawdown basis", value: "Equity-based enforcement", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Swing realities",
            severity: "low",
            bullets: ["Swap/financing costs can materially affect drawdown usage on longer holds."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "FTMO funded phase expectations",
        severity: "low",
        bullets: ["Once funded, drawdown objectives remain the primary hard constraints; profit targets are not required."],
      },
    ],
  },

  {
    id: "alpha-capital-group",
    name: "ALPHA CAPITAL GROUP",
    website: "https://alphacapitalgroup.uk/",
    shortPitch:
      "UK-based firm with multiple program lines (Pro, One, Swing) featuring no maximum trading days and clear published risk limits.",
    tags: ["UK", "1-Step & 2-Step", "No max days", "Multiple lines"],
    brand: { accentClass: "text-sky-300" },
    highlights: [
      { label: "No max days", value: "Unlimited assessment duration", tone: "good" },
      { label: "Inactivity", value: "30 days", tone: "warn" },
      { label: "Program variety", value: "Pro / One / Swing", tone: "good" },
    ],
    programs: [
      {
        id: "acg-alpha-pro-8-2step",
        name: "Alpha Pro (8%)",
        subtitle: "2-Step evaluation with 8% target in Phase 1",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker"],
        payoutSplit: "80%",
        timeLimit: "No maximum trading days",
        minTradingDays: "3 trading days per phase",
        pricingTiers: [
          { sizeLabel: "25K", price: { currency: "USD", amount: 197 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 297 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 497 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 997 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "4%", tone: "warn" },
          { label: "Max Drawdown", value: "8%", tone: "bad" },
          { label: "Minimum Trading Days", value: "3 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Assessment duration", value: "Unlimited", tone: "good" },
          { label: "Inactivity", value: "30-day inactivity rule", tone: "warn" },
          { label: "Leverage (headline)", value: "Up to 1:100 (asset-class dependent)", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "Model awareness",
            severity: "medium",
            bullets: [
              "Pro 8% and Pro 10% use different daily/max drawdown limits.",
              "No max days does not override inactivity enforcement.",
            ],
          },
        ],
      },
      {
        id: "acg-alpha-pro-10-2step",
        name: "Alpha Pro (10%)",
        subtitle: "2-Step evaluation with 10% target in Phase 1",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker"],
        payoutSplit: "80%",
        timeLimit: "No maximum trading days",
        minTradingDays: "3 trading days per phase",
        pricingTiers: [
          { sizeLabel: "25K", price: { currency: "USD", amount: 197 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 297 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 497 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 997 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "5%", tone: "warn" },
          { label: "Max Drawdown", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "3 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Assessment duration", value: "Unlimited", tone: "good" },
          { label: "Inactivity", value: "30-day inactivity rule", tone: "warn" },
          { label: "Leverage (headline)", value: "Up to 1:100 (asset-class dependent)", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "DD sensitivity",
            severity: "low",
            bullets: ["This variant has looser targets but the daily/max drawdown constraints expand versus Pro 8%."],
          },
        ],
      },
      {
        id: "acg-alpha-one-1step",
        name: "Alpha One",
        subtitle: "1-Step evaluation",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker"],
        payoutSplit: "80%",
        timeLimit: "No maximum trading days",
        minTradingDays: "3 trading days",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 297 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 497 } },
        ],
        objectives: [
          { label: "Profit Target", value: "10%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "5%", tone: "warn" },
          { label: "Max Drawdown", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "3", tone: "neutral" },
        ],
        rules: [
          { label: "Assessment duration", value: "Unlimited", tone: "good" },
          { label: "Inactivity", value: "30-day inactivity rule", tone: "warn" },
          { label: "Leverage (headline)", value: "Asset-class dependent", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "Leverage differs by asset",
            severity: "medium",
            bullets: ["FX leverage is higher than indices/crypto; risk engines should be instrument-aware if you model margin impact."],
          },
        ],
      },
      {
        id: "acg-alpha-swing-2step",
        name: "Alpha Swing",
        subtitle: "2-Step evaluation designed for longer-term/swing strategies",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker"],
        payoutSplit: "80%",
        timeLimit: "No maximum trading days",
        minTradingDays: "3 trading days per phase",
        pricingTiers: [{ sizeLabel: "100K", price: { currency: "USD", amount: 577 } }],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "5%", tone: "warn" },
          { label: "Max Drawdown", value: "10%", tone: "bad" },
        ],
        rules: [
          { label: "Assessment duration", value: "Unlimited", tone: "good" },
          { label: "Inactivity", value: "30-day inactivity rule", tone: "warn" },
          { label: "Designed for holds", value: "Swing-friendly constraints", tone: "good" },
        ],
        hiddenRules: [
          {
            title: "Separate ruleset",
            severity: "low",
            bullets: ["Treat Swing as its own ruleset in your UI and rule-checker; don’t assume Pro parity."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "Alpha firm-level constraints",
        severity: "medium",
        bullets: ["No maximum trading days does not override inactivity enforcement; inactivity remains a practical hard rule."],
      },
    ],
  },

  {
    id: "fundednext",
    name: "FUNDEDNEXT",
    website: "https://fundednext.com/",
    shortPitch:
      "Multiple CFD models (Stellar 2-Step, 1-Step, Lite) plus Instant access, published in a plan selector with clear targets and drawdowns.",
    tags: ["Many models", "Up to 95% reward", "No time limit", "Instant option"],
    brand: { accentClass: "text-fuchsia-300" },
    highlights: [
      { label: "Stellar 2-Step DD", value: "5% daily / 10% overall", tone: "warn" },
      { label: "Stellar 1-Step DD", value: "3% daily / 6% overall", tone: "warn" },
      { label: "Time limit", value: "No time limit (Stellar)", tone: "good" },
    ],
    programs: [
      {
        id: "fn-stellar-2step",
        name: "Stellar (2-Step)",
        subtitle: "Phase 1 → Phase 2 evaluation",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5", "cTrader"],
        payoutSplit: "Up to 95%",
        timeLimit: "No time limit",
        minTradingDays: "5 trading days per phase",
        pricingTiers: [
          { sizeLabel: "6K", price: { currency: "USD", amount: 59.99 } },
          { sizeLabel: "15K", price: { currency: "USD", amount: 119.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 199.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 299.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099.99 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Daily Loss Limit", value: "5% (balance-based)", tone: "warn" },
          { label: "Overall Loss Limit", value: "10% (balance-based)", tone: "bad" },
          { label: "Minimum Trading Days", value: "5 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Time limit", value: "Unlimited", tone: "good" },
          { label: "Reward cadence", value: "Bi-weekly", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "Common compliance pitfalls",
            severity: "medium",
            bullets: ["Treat daily loss as a hard intraday stop; breaches fail regardless of recovery later in the day."],
          },
        ],
      },
      {
        id: "fn-stellar-1step",
        name: "Stellar (1-Step)",
        subtitle: "Single-step evaluation",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5", "cTrader"],
        payoutSplit: "Up to 95%",
        timeLimit: "No time limit",
        minTradingDays: "2 trading days",
        pricingTiers: [
          { sizeLabel: "6K", price: { currency: "USD", amount: 59.99 } },
          { sizeLabel: "15K", price: { currency: "USD", amount: 119.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 199.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 299.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099.99 } },
        ],
        objectives: [
          { label: "Profit Target", value: "10%", tone: "neutral" },
          { label: "Daily Loss Limit", value: "3% (balance-based)", tone: "warn" },
          { label: "Overall Loss Limit", value: "6% (balance-based)", tone: "bad" },
          { label: "Minimum Trading Days", value: "2", tone: "neutral" },
        ],
        rules: [
          { label: "Time limit", value: "Unlimited", tone: "good" },
          { label: "Reward cadence", value: "Every 5 business days", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "1-Step risk compression",
            severity: "medium",
            bullets: ["Tighter daily/overall loss limits make this model significantly less forgiving than 2-Step."],
          },
        ],
      },
      {
        id: "fn-stellar-lite",
        name: "Stellar Lite",
        subtitle: "2-Step evaluation with reduced limits",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5"],
        payoutSplit: "Up to 95%",
        timeLimit: "No time limit",
        minTradingDays: "5 trading days per phase",
        pricingTiers: [
          { sizeLabel: "6K", price: { currency: "USD", amount: 59.99 } },
          { sizeLabel: "15K", price: { currency: "USD", amount: 119.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 199.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 299.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099.99 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "4%", tone: "neutral" },
          { label: "Daily Loss Limit", value: "4% (balance-based)", tone: "warn" },
          { label: "Overall Loss Limit", value: "8% (balance-based)", tone: "bad" },
          { label: "Minimum Trading Days", value: "5 per phase", tone: "neutral" },
        ],
        rules: [
          { label: "Time limit", value: "Unlimited", tone: "good" },
          { label: "Reward cadence", value: "Bi-weekly", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "Lite tradeoffs",
            severity: "low",
            bullets: ["Lower Phase 2 target comes with tighter overall constraints compared to 2-Step."],
          },
        ],
      },
      {
        id: "fn-stellar-instant",
        name: "Stellar Instant",
        subtitle: "Instant access model (no evaluation)",
        steps: 0,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4", "MT5"],
        payoutSplit: "60%–80%",
        timeLimit: "N/A",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "6K", price: { currency: "USD", amount: 59.99 } },
          { sizeLabel: "15K", price: { currency: "USD", amount: 119.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 199.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 299.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099.99 } },
        ],
        objectives: [
          { label: "Profit threshold to request reward", value: "5%", tone: "neutral" },
          { label: "Daily loss limit", value: "None", tone: "good" },
          { label: "Max loss limit", value: "6%", tone: "bad" },
          { label: "Minimum trading days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Instant model", value: "No evaluation; trade from day one", tone: "good" },
        ],
        hiddenRules: [
          {
            title: "Hard stop emphasis",
            severity: "medium",
            bullets: ["No daily limit means the max loss is the only hard stop—risk can accelerate fast."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "FundedNext firm-level reminders",
        severity: "low",
        bullets: ["Keep program-specific drawdowns visible; FundedNext models differ materially across 1-Step/2-Step/Lite/Instant."],
      },
    ],
  },

  {
    id: "e8",
    name: "E8",
    website: "https://e8markets.com/",
    shortPitch:
      "Multi-model prop firm with strong documentation and strict intraday drawdown mechanics; different tracks vary widely (Classic, One, Track, Signature).",
    tags: ["Multiple models", "Help center docs", "Best-day mechanics", "Inactivity enforcement"],
    brand: { accentClass: "text-violet-300" },
    highlights: [
      { label: "Inactivity", value: "1 closed trade every 60 days", tone: "warn" },
      { label: "DD style", value: "Floating loss counts on many models", tone: "warn" },
      { label: "Model variety", value: "Classic / One / Track / Signature", tone: "good" },
    ],
    programs: [
      {
        id: "e8-classic",
        name: "E8 Classic",
        subtitle: "Original two-phase evaluation",
        steps: 2,
        markets: ["Forex", "Futures", "Crypto"],
        platforms: ["Varies by market/offer"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 168 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 298 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 418 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "4%", tone: "neutral" },
          { label: "Daily Drawdown", value: "4% (includes floating loss)", tone: "warn" },
          { label: "Maximum Drawdown", value: "8% (includes floating loss)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Inactivity", value: "At least 1 closed trade every 60 days", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Classic ‘gotchas’",
            severity: "high",
            bullets: [
              "Daily drawdown includes floating loss; a spike can fail the account even if later recovered.",
              "Unlimited time does not override inactivity enforcement.",
            ],
          },
        ],
      },
      {
        id: "e8-one",
        name: "E8 One",
        subtitle: "Single-step evaluation with best-day mechanics on trader stage",
        steps: 1,
        markets: ["Forex", "Futures", "Crypto"],
        platforms: ["Varies by market/offer"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 198 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 398 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 548 } },
        ],
        objectives: [
          { label: "Profit Target", value: "8%", tone: "neutral" },
          { label: "Daily Drawdown", value: "3% (includes floating loss)", tone: "warn" },
          { label: "Dynamic / Trailing Drawdown", value: "4% (model-defined)", tone: "warn" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Inactivity", value: "At least 1 closed trade every 60 days", tone: "warn" },
          { label: "Best-day rule", value: "40% cap on best day (applies on trader stage)", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "E8 One high-impact pitfalls",
            severity: "high",
            bullets: [
              "Best-day cap can invalidate performance if one day dominates the profit curve.",
              "Trailing/dynamic DD means withdrawals require buffer awareness.",
            ],
          },
        ],
      },
      {
        id: "e8-track",
        name: "E8 Track",
        subtitle: "Multi-phase progression model",
        steps: 3,
        markets: ["Forex", "Futures", "Crypto"],
        platforms: ["Varies by market/offer"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 188 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 338 } },
        ],
        objectives: [
          { label: "Profit Targets", value: "Phase-based (multi-step)", tone: "neutral" },
          { label: "Daily Drawdown", value: "4% (includes floating loss)", tone: "warn" },
          { label: "Maximum Drawdown", value: "8% (includes floating loss)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Inactivity", value: "At least 1 closed trade every 60 days", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Track risk",
            severity: "medium",
            bullets: ["Floating drawdown mechanics make risk spikes especially punitive across longer progressions."],
          },
        ],
      },
      {
        id: "e8-signature-forex",
        name: "E8 Signature",
        subtitle: "One-step style with trailing mechanics and payout buffers",
        steps: 1,
        markets: ["Forex", "Futures", "Crypto"],
        platforms: ["Varies by market/offer"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 98 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 178 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 298 } },
        ],
        objectives: [
          { label: "Profit Target", value: "8%", tone: "neutral" },
          { label: "Trailing drawdown", value: "Model-defined (buffer required)", tone: "warn" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Payout buffer", value: "Buffer required to maintain trailing DD", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Signature withdrawal trap",
            severity: "high",
            bullets: ["Withdrawing too aggressively can collapse the buffer and trigger trailing DD failure."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "E8 firm-level priorities",
        severity: "medium",
        bullets: [
          "Surface floating-loss drawdown definitions prominently; many traders assume closed-loss-only and get liquidated.",
          "Inactivity is a real enforcement rule despite unlimited time.",
        ],
      },
    ],
  },

  {
    id: "qt-funded",
    name: "QUANT TEKEL FUNDED",
    website: "https://qtfunded.quanttekel.com/",
    shortPitch:
      "Quant Tekel’s QT Funded offering spans instant-style evaluation and multi-step programs with tight static risk limits and tiered pricing.",
    tags: ["QT Instant", "QT Prime", "QT Power", "Static DD"],
    brand: { accentClass: "text-amber-300" },
    highlights: [
      { label: "Risk style", value: "Static daily + max drawdown", tone: "warn" },
      { label: "Program variety", value: "Instant + multi-step", tone: "good" },
    ],
    programs: [
      {
        id: "qt-instant-eval",
        name: "QT Instant Evaluation",
        subtitle: "Single-step style evaluation with tight static limits",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader"],
        payoutSplit: "80%–90%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "2.5K", price: { currency: "USD", amount: 25 } },
          { sizeLabel: "5K", price: { currency: "USD", amount: 50 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 80 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 180 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 300 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 590 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1100 } },
        ],
        objectives: [
          { label: "Profit Target", value: "8%", tone: "neutral" },
          { label: "Daily Drawdown", value: "3% (static)", tone: "warn" },
          { label: "Max Drawdown", value: "6% (static)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [{ label: "Static DD", value: "Daily/max limits are fixed and strict", tone: "warn" }],
        hiddenRules: [
          {
            title: "Tight limits warning",
            severity: "medium",
            bullets: ["Static 3%/6% limits punish volatility; position sizing must be conservative."],
          },
        ],
      },
      {
        id: "qt-prime-2step",
        name: "QT Prime (2-Step)",
        subtitle: "Two-step evaluation with broader sizing tiers",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader"],
        payoutSplit: "80%–90%",
        timeLimit: "Unlimited",
        minTradingDays: "3 per phase",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 50 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 80 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 180 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 300 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 590 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1100 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Daily Drawdown", value: "5% (static)", tone: "warn" },
          { label: "Max Drawdown", value: "10% (static)", tone: "bad" },
          { label: "Minimum Trading Days", value: "3 per phase", tone: "neutral" },
        ],
        rules: [{ label: "Assessment duration", value: "Unlimited", tone: "good" }],
        hiddenRules: [
          {
            title: "Model separation",
            severity: "low",
            bullets: ["Keep QT Prime distinct from QT Instant; drawdowns and targets are not interchangeable."],
          },
        ],
      },
      {
        id: "qt-power-2step",
        name: "QT Power (2-Step)",
        subtitle: "Lower fee structure with similar two-step path",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader"],
        payoutSplit: "80%–90%",
        timeLimit: "Unlimited",
        minTradingDays: "3 per phase",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 26 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 52 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 105 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 210 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 400 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Daily Drawdown", value: "5% (static)", tone: "warn" },
          { label: "Max Drawdown", value: "10% (static)", tone: "bad" },
          { label: "Minimum Trading Days", value: "3 per phase", tone: "neutral" },
        ],
        rules: [{ label: "Assessment duration", value: "Unlimited", tone: "good" }],
        hiddenRules: [
          {
            title: "Pricing vs constraints",
            severity: "low",
            bullets: ["Lower entry price doesn’t imply looser risk rules—limits remain strict."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "QT firm-level reminder",
        severity: "low",
        bullets: ["Static drawdowns require robust UI warnings for intraday risk spikes and floating-loss exposure."],
      },
    ],
  },

  {
    id: "funderpro",
    name: "FUNDERPRO",
    website: "https://funderpro.com/",
    shortPitch:
      "Multiple challenge types with fixed drawdown math and official tables by model: One Phase (1-Phase), Pro (2-Phase), Classic (2-Phase).",
    tags: ["1-Phase", "2-Phase", "Fixed DD", "Unlimited duration"],
    brand: { accentClass: "text-lime-300" },
    highlights: [
      { label: "2-Phase targets", value: "10% / 8%", tone: "neutral" },
      { label: "2-Phase DD", value: "5% daily / 10% overall", tone: "warn" },
      { label: "1-Phase DD", value: "3% daily / 6% overall", tone: "warn" },
    ],
    programs: [
      {
        id: "fp-one-phase-1phase",
        name: "One Phase (1-Phase)",
        subtitle: "Single-step path with tighter risk limits and a consistency cap",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto", "Stocks"],
        platforms: ["Varies"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 69 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 89 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 149 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 259 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 459 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 659 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 989 } },
        ],
        objectives: [
          { label: "Profit Target", value: "10%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "3% (balance-based)", tone: "warn" },
          { label: "Max Overall Drawdown", value: "6% (fixed)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Consistency rule", value: "Best day ≤ 40% of total profit (challenge only)", tone: "warn" },
          { label: "Inactivity", value: "Account terminated after 30 consecutive inactive days", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Consistency math reality",
            severity: "medium",
            bullets: ["Although no min days are required, the 40% best-day cap effectively forces multi-day profit distribution."],
          },
        ],
      },
      {
        id: "fp-pro-2phase",
        name: "Pro (2-Phase)",
        subtitle: "Two-step evaluation with higher leverage and fewer restrictions",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto", "Stocks"],
        platforms: ["Varies"],
        payoutSplit: "80% (up to 90% with scaling)",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 79 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 159 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 279 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 499 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 699 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 999 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "8%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "5% (balance-based)", tone: "warn" },
          { label: "Max Overall Drawdown", value: "10% (fixed)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Daily DD reset", value: "Calculated at start-of-day (server-time based)", tone: "neutral" },
          { label: "Inactivity", value: "Account terminated after 30 consecutive inactive days", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Daily DD enforcement",
            severity: "medium",
            bullets: ["Daily drawdown breaches are final even if balance later recovers within the same server day."],
          },
        ],
      },
      {
        id: "fp-classic-2phase",
        name: "Classic (2-Phase)",
        subtitle: "Two-step evaluation with a more structured rule set",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto", "Stocks"],
        platforms: ["Varies"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "None",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 75 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 95 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 155 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 269 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 489 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 689 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 989 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "8%", tone: "neutral" },
          { label: "Max Daily Drawdown", value: "5% (balance-based)", tone: "warn" },
          { label: "Max Overall Drawdown", value: "10% (fixed)", tone: "bad" },
          { label: "Minimum Trading Days", value: "None", tone: "good" },
        ],
        rules: [
          { label: "Inactivity", value: "Account terminated after 30 consecutive inactive days", tone: "warn" },
        ],
        hiddenRules: [
          {
            title: "Classic vs Pro",
            severity: "low",
            bullets: ["Classic and Pro share core targets and DD, but traders should choose based on restriction profile and leverage."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "FunderPro firm-level notes",
        severity: "low",
        bullets: ["Daily drawdown is balance-based; overall drawdown is fixed to the initial account value."],
      },
    ],
  },

  {
    id: "fundingpips",
    name: "FUNDINGPIPS",
    website: "https://www.fundingpips.com/",
    shortPitch:
      "Evaluation-focused firm offering multiple models (1-Step, 2-Step, 2-Step Pro) with terms-driven definitions and distinct risk profiles per model.",
    tags: ["1-Step", "2-Step", "2-Step Pro", "Terms-driven rules"],
    brand: { accentClass: "text-rose-300" },
    highlights: [
      { label: "2-Step targets", value: "8% / 5%", tone: "neutral" },
      { label: "2-Step DD", value: "5% daily / 10% max", tone: "warn" },
      { label: "Pro DD", value: "3% daily / 6% max", tone: "warn" },
    ],
    programs: [
      {
        id: "fundingpips-1step",
        name: "1-Step Evaluation",
        subtitle: "Single-phase evaluation",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "3",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 32 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 49 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 179 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 329 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 599 } },
        ],
        objectives: [
          { label: "Profit Target", value: "10%", tone: "neutral" },
          { label: "Maximum Daily Loss", value: "5%", tone: "warn" },
          { label: "Maximum Loss", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "3", tone: "neutral" },
        ],
        rules: [{ label: "Model-aware enforcement", value: "Use model-specific limits for checks", tone: "neutral" }],
        hiddenRules: [
          {
            title: "Don’t cross-apply limits",
            severity: "medium",
            bullets: ["1-Step, 2-Step, and 2-Step Pro have different risk tolerances; your UI should prevent accidental confusion."],
          },
        ],
      },
      {
        id: "fundingpips-2step",
        name: "2-Step Evaluation",
        subtitle: "Two-phase evaluation",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "3 per phase",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 36 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 55 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 109 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 199 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 369 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 679 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Maximum Daily Loss", value: "5%", tone: "warn" },
          { label: "Maximum Loss", value: "10%", tone: "bad" },
          { label: "Minimum Trading Days", value: "3 per phase", tone: "neutral" },
        ],
        rules: [{ label: "Terms-driven", value: "Minimum days and definitions are enforced per model", tone: "neutral" }],
        hiddenRules: [
          {
            title: "Min-days enforcement",
            severity: "medium",
            bullets: ["Minimum trading days are a hard rule; passing early still requires day separation."],
          },
        ],
      },
      {
        id: "fundingpips-2step-pro",
        name: "2-Step Pro Evaluation",
        subtitle: "Two-phase Pro variant with tighter drawdowns and lower targets",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5"],
        payoutSplit: "80%",
        timeLimit: "Unlimited",
        minTradingDays: "1 per phase",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 29 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 45 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 89 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 169 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 309 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 569 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "6%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "6%", tone: "neutral" },
          { label: "Maximum Daily Loss", value: "3%", tone: "warn" },
          { label: "Maximum Loss", value: "6%", tone: "bad" },
          { label: "Minimum Trading Days", value: "1 per phase", tone: "neutral" },
        ],
        rules: [{ label: "Risk compression", value: "Lower targets, much tighter drawdowns", tone: "warn" }],
        hiddenRules: [
          {
            title: "Pro variant danger",
            severity: "high",
            bullets: ["With 3%/6% limits, even small volatility spikes can breach the account; sizing must be significantly reduced."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "FundingPips firm-level note",
        severity: "low",
        bullets: ["Keep the user on the correct model—program switching without resetting expectations is a common failure mode."],
      },
    ],
  },
]




/* --------------------------------- UI Bits -------------------------------- */

function moneyToString(m: Money) {
  const sym = m.currency === "USD" ? "$" : m.currency === "EUR" ? "€" : "£"
  const amt = m.amount === 0 ? "—" : `${sym}${m.amount.toLocaleString()}`
  return m.note ? `${amt} • ${m.note}` : amt
}

function ToneDot({ tone }: { tone?: RuleItem["tone"] }) {
  const c =
    tone === "good"
      ? "bg-emerald-400/80"
      : tone === "warn"
        ? "bg-amber-400/80"
        : tone === "bad"
          ? "bg-rose-400/80"
          : "bg-white/25"
  return <span className={clsx("h-2 w-2 rounded-full", c)} />
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: any
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-white/50">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const cls =
    tone === "good"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
        : "border-white/10 bg-white/5 text-white/70"
  return <span className={clsx("rounded-full border px-2.5 py-1 text-[11px] font-medium", cls)}>{children}</span>
}

function KpiRow({ items }: { items: RuleItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-white/10 bg-black/20 p-3"
          title={it.hint ?? ""}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold text-white/60">{it.label}</div>
            <div className="flex items-center gap-2">
              <ToneDot tone={it.tone} />
              <div className="text-xs font-semibold text-white">{it.value}</div>
            </div>
          </div>
          {it.hint ? <div className="mt-1 text-[11px] text-white/45">{it.hint}</div> : null}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
        <Info className="h-6 w-6 text-white/70" />
      </div>
      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-white/55">{desc}</div>
    </div>
  )
}

/* --------------------------------- Page --------------------------------- */

type TabKey = "programs" | "rules" | "hidden"

export default function PropFirmsPage() {
  const [query, setQuery] = useState("")
  const [activeFirmId, setActiveFirmId] = useState<string>(FIRMS[0]?.id ?? "")
  const [activeProgramId, setActiveProgramId] = useState<string>("")
  const [tab, setTab] = useState<TabKey>("programs")
  const [mobileOpen, setMobileOpen] = useState(false)

  const firms = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FIRMS
    return FIRMS.filter((f) => {
      const inName = f.name.toLowerCase().includes(q)
      const inTags = f.tags.some((t) => t.toLowerCase().includes(q))
      const inPrograms = f.programs.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subtitle ?? "").toLowerCase().includes(q) ||
          p.markets.some((m) => m.toLowerCase().includes(q))
      )
      return inName || inTags || inPrograms
    })
  }, [query])

  const activeFirm = useMemo(() => firms.find((f) => f.id === activeFirmId) ?? firms[0], [firms, activeFirmId])

  const programs = activeFirm?.programs ?? []
  const activeProgram = useMemo(() => {
    if (!activeFirm) return undefined
    const fallback = activeFirm.programs[0]
    const found = activeFirm.programs.find((p) => p.id === activeProgramId)
    return found ?? fallback
  }, [activeFirm, activeProgramId])

  const topBar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-white">Prop Firms</div>

        </div>
        <div className="mt-1 text-xs text-white/55">
          Click a firm → explore programs, public rules, and your “Hidden Rules” notes.
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full md:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search firm / program / market…"
            className="h-10 w-full rounded-2xl border border-white/10 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-white/20"
          />
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/80 hover:bg-white/10 md:hidden"
        >
          <Filter className="h-4 w-4" />
          Firms
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
        <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {topBar}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT: Firm grid */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="hidden md:block">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <SectionTitle
                  icon={Gem}
                  title="Firms"
                  subtitle="Pick a firm to see programs & rule breakdown"
                  right={<Pill>{firms.length} listed</Pill>}
                />

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {firms.map((firm) => {
                    const active = firm.id === activeFirm?.id
                    return (
                      <button
                        key={firm.id}
                        onClick={() => {
                          setActiveFirmId(firm.id)
                          setActiveProgramId("")
                          setTab("programs")
                        }}
                        className={clsx(
                          "group w-full rounded-3xl border p-4 text-left transition",
                          active
                            ? "border-white/20 bg-black/40"
                            : "border-white/10 bg-black/20 hover:border-white/15 hover:bg-black/30"
                        )}
                      >
<div className="flex items-start justify-between gap-3">
  <div className="min-w-0">
    <div className="flex items-center gap-2">
      <div className="text-sm font-semibold text-white">{firm.name}</div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">
        {firm.programs.length} programs
      </span>
    </div>
    <div className="mt-1 line-clamp-2 text-xs text-white/55">{firm.shortPitch}</div>
  </div>

  <ChevronRight
    className={clsx(
      "mt-1 h-4 w-4 text-white/30 transition group-hover:text-white/60",
      active ? "text-white/70" : ""
    )}
  />
</div>


                        <div className="mt-3 flex flex-wrap gap-2">
                          {firm.tags.slice(0, 3).map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Mobile hint */}
            <div className="md:hidden">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <SectionTitle icon={Filter} title="Pick a firm" subtitle="Tap “Firms” to browse the list" />
              </div>
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="lg:col-span-7 xl:col-span-8">
            {!activeFirm ? (
              <EmptyState title="No firm selected" desc="Pick a firm from the list to see its programs." />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
  <div className="flex flex-wrap items-center gap-2">
    <div className="text-base font-semibold text-white">{activeFirm.name}</div>
    <a
      href={activeFirm.website}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
    >
      Website <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  </div>

  <div className="mt-1 text-xs text-white/55">{activeFirm.shortPitch}</div>

  <div className="mt-2 flex flex-wrap gap-2">
    {activeFirm.tags.map((t) => (
      <Pill key={t}>{t}</Pill>
    ))}
  </div>
</div>


                  {/* Tabs */}
                  <div className="flex items-center gap-2">
                    <TabButton active={tab === "programs"} onClick={() => setTab("programs")}>
                      Programs
                    </TabButton>
                    <TabButton active={tab === "rules"} onClick={() => setTab("rules")}>
                      Rules
                    </TabButton>
                    <TabButton active={tab === "hidden"} onClick={() => setTab("hidden")}>
                      Hidden Rules
                    </TabButton>
                  </div>
                </div>

                <div className="mt-4">
                  <KpiRow items={activeFirm.highlights} />
                </div>

                {/* Program selector */}
                <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                  <SectionTitle
                    icon={Target}
                    title="Programs"
                    subtitle="Select a program to view tiers, objectives, and rules"
                  />

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {programs.map((p) => {
                      const active = p.id === activeProgram?.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProgramId(p.id)
                            setTab("programs")
                          }}
                          className={clsx(
                            "w-full rounded-3xl border p-4 text-left transition",
                            active
                              ? "border-white/20 bg-black/40"
                              : "border-white/10 bg-black/20 hover:border-white/15 hover:bg-black/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{p.name}</div>
                              {p.subtitle ? <div className="mt-0.5 text-xs text-white/55">{p.subtitle}</div> : null}
                            </div>
                            <Pill tone={p.steps === 1 ? "warn" : "neutral"}>{p.steps}-Step</Pill>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Pill>{p.markets.slice(0, 2).join(" • ")}</Pill>
                            {p.payoutSplit ? <Pill tone="good">{p.payoutSplit}</Pill> : null}
                            {p.timeLimit ? <Pill>{p.timeLimit}</Pill> : null}
                            {p.minTradingDays ? <Pill>{p.minTradingDays}</Pill> : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {!activeProgram ? (
                    <div className="mt-4">
                      <EmptyState title="No program selected" desc="Choose a program above to see details." />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeProgram.id + tab}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {tab === "programs" ? (
                            <ProgramTab program={activeProgram} />
                          ) : tab === "rules" ? (
                            <RulesTab program={activeProgram} />
                          ) : (
                            <HiddenTab firm={activeFirm} program={activeProgram} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer: firm selector */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              aria-label="Close"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[82vh] overflow-hidden rounded-t-3xl border border-white/10 bg-[#070A0F] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="text-sm font-semibold text-white">Firms</div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(82vh-64px)] overflow-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                  {firms.map((firm) => {
                    const active = firm.id === activeFirmId
                    return (
                      <button
                        key={firm.id}
                        onClick={() => {
                          setActiveFirmId(firm.id)
                          setActiveProgramId("")
                          setTab("programs")
                          setMobileOpen(false)
                        }}
                        className={clsx(
                          "w-full rounded-3xl border p-4 text-left transition",
                          active
                            ? "border-white/20 bg-black/40"
                            : "border-white/10 bg-black/20 hover:border-white/15 hover:bg-black/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-extrabold tracking-wide text-white",
                              firm.brand.accentClass
                            )}
                          >
                            <FirmMark name={firm.name} size={44} />


                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{firm.name}</div>
                            <div className="mt-0.5 line-clamp-2 text-xs text-white/55">{firm.shortPitch}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {firm.tags.slice(0, 3).map((t) => (
                                <Pill key={t}>{t}</Pill>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------- Tabs UI -------------------------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-semibold transition",
        active ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  )
}

function ProgramTab({ program }: { program: Program }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle
          icon={Banknote}
          title="Pricing tiers"
          subtitle="Baseline prices (edit for promos / region / latest checkout)"
        />
        <div className="mt-4 space-y-2">
          {program.pricingTiers.map((t) => (
            <div
              key={t.sizeLabel}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="text-xs font-semibold text-white">{t.sizeLabel}</div>
              <div className="text-xs font-semibold text-white/80">{moneyToString(t.price)}</div>
            </div>
          ))}
        </div>

        
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle icon={Target} title="Objectives snapshot" subtitle="What you must hit to pass" />
        <div className="mt-4 space-y-2">
          {program.objectives.map((it) => (
            <div key={it.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-white/60">{it.label}</div>
                <div className="flex items-center gap-2">
                  <ToneDot tone={it.tone} />
                  <div className="text-xs font-semibold text-white">{it.value}</div>
                </div>
              </div>
              {it.hint ? <div className="mt-1 text-[11px] text-white/45">{it.hint}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RulesTab({ program }: { program: Program }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle icon={Shield} title="Public rules" subtitle="Constraints and mechanics (edit to your exact spec)" />
        <div className="mt-4 space-y-2">
          {program.rules.map((it) => (
            <div key={it.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-white/60">{it.label}</div>
                <div className="flex items-center gap-2">
                  <ToneDot tone={it.tone} />
                  <div className="text-xs font-semibold text-white">{it.value}</div>
                </div>
              </div>
              {it.hint ? <div className="mt-1 text-[11px] text-white/45">{it.hint}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle icon={BookOpen} title="Metadata" subtitle="Helpful context for traders" />
        <div className="mt-4 space-y-2">
          <MetaRow label="Steps" value={`${program.steps}`} />
          <MetaRow label="Markets" value={program.markets.join(", ")} />
          <MetaRow label="Platforms" value={(program.platforms ?? ["—"]).join(", ")} />
          <MetaRow label="Payout split" value={program.payoutSplit ?? "—"} />
          <MetaRow label="Time limit" value={program.timeLimit ?? "—"} />
          <MetaRow label="Min trading days" value={program.minTradingDays ?? "—"} />
        </div>

        
      </div>
    </div>
  )
}

function HiddenTab({ firm, program }: { firm: Firm; program: Program }) {
  const firmHidden = firm.firmLevelHiddenRules ?? []
  const progHidden = program.hiddenRules ?? []

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle
          icon={Lock}
          title="Hidden rules (program)"
          subtitle="Your Discord + trader experience notes (not public docs)"
          right={<Pill tone="warn">manual</Pill>}
        />
        <div className="mt-4 space-y-3">
          {progHidden.length ? (
            progHidden.map((h, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{h.title}</div>
                  <Pill tone={h.severity === "high" ? "warn" : "neutral"}>{h.severity ?? "notes"}</Pill>
                </div>
                <ul className="mt-3 space-y-2">
                  {h.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-white/60">
                      • {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <EmptyState title="No hidden rules yet" desc="Add notes in program.hiddenRules inside FIRMS." />
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <SectionTitle
          icon={Lock}
          title="Hidden notes (firm-level)"
          subtitle="Applies across all programs for this firm"
          right={<Pill tone="warn">manual</Pill>}
        />
        <div className="mt-4 space-y-3">
          {firmHidden.length ? (
            firmHidden.map((h, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{h.title}</div>
                  <Pill tone={h.severity === "high" ? "warn" : "neutral"}>{h.severity ?? "notes"}</Pill>
                </div>
                <ul className="mt-3 space-y-2">
                  {h.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-white/60">
                      • {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <EmptyState title="No firm-level notes yet" desc="Add firm.firmLevelHiddenRules inside FIRMS." />
          )}
        </div>

        
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[11px] font-semibold text-white/60">{label}</div>
      <div className="text-xs font-semibold text-white/80">{value}</div>
    </div>
  )
}
