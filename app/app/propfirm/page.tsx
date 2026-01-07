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
function FirmLogo({
  firmId,
  size = 44,
}: {
  firmId: string
  size?: number
}) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5"
      style={{ width: size, height: size }}
    >
      <Image
        src={`/prop-firms/${firmId}.svg`}
        alt={`${firmId} logo`}
        width={size * 0.7}
        height={size * 0.7}
        className="object-contain"
        onError={(e) => {
          // fallback if logo missing
          const target = e.currentTarget as HTMLImageElement
          target.style.display = "none"
        }}
      />
    </div>
  )
}

const FIRMS: Firm[] = [
  {
    id: "ftmo",
    name: "FTMO",
    website: "https://ftmo.com/",
    shortPitch:
      "One of the most recognized evaluations: clear drawdown rules, structured objectives, and a widely-known two-step process.",
    tags: ["2-Step", "Refundable fee", "Up to 90% split", "No time limit"],
    brand: { accentClass: "text-emerald-400"},
    highlights: [
      { label: "Core evaluation targets", value: "Challenge 10% / Verification 5%", tone: "neutral" },
      { label: "Drawdown rules", value: "Daily 5% / Max 10% (typical “Normal” model)", tone: "warn" },
      { label: "Time limit", value: "No time limit (indefinite)", tone: "good" },
      { label: "Min trading days", value: "4 trading days (evaluation)", tone: "neutral" },
    ],
    programs: [
      {
        id: "ftmo-normal-2step",
        name: "FTMO Challenge (Normal)",
        subtitle: "Classic two-step evaluation (Challenge → Verification)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT4/MT5 (varies by offering)", "cTrader (varies)"],
        payoutSplit: "Up to 90% (after funded)",
        timeLimit: "No time limit",
        minTradingDays: "4 trading days (each phase)",
        pricingTiers: [
          // NOTE: FTMO pricing is often in EUR and varies; keep as baseline placeholders.
          // Tip: replace these with your exact preferred tiers from FTMO checkout.
          { sizeLabel: "10K", price: { currency: "EUR", amount: 155 } },
          { sizeLabel: "25K", price: { currency: "EUR", amount: 250 } },
          { sizeLabel: "50K", price: { currency: "EUR", amount: 345 } },
          { sizeLabel: "100K", price: { currency: "EUR", amount: 540 } },
          { sizeLabel: "200K", price: { currency: "EUR", amount: 1080 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "10%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Max Daily Loss", value: "5% (equity-based)", tone: "warn" },
          { label: "Max Loss", value: "10% (equity-based)", tone: "bad" },
          { label: "Minimum Trading Days", value: "4 days (per phase)", tone: "neutral" },
        ],
        rules: [
          { label: "Time limit", value: "No time limit (indefinite)", tone: "good" },
          { label: "Fee refund", value: "Fee is typically refunded with first reward after funded", tone: "good" },
          { label: "Risk model", value: "Normal vs Aggressive exist (edit if you support both)", tone: "neutral" },
          { label: "Notes", value: "Exact platform/instrument availability depends on region & current offering", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (FTMO)",
            severity: "medium",
            bullets: [
              "Example: any execution-style restrictions you’ve learned",
              "Example: payout nuances, news policy nuance, IP/device checks, etc.",
            ],
          },
        ],
        sourcesInComments: [
          // https://ftmo.com/en/how-to-pass-ftmo-challenge/
          // https://ftmo.com/en/faq/step-1-ftmo-challenge/
          // https://academy.ftmo.com/lesson/minimum-trading-days/
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "Firm-level hidden notes (template)",
        severity: "low",
        bullets: ["Paste Discord/community findings here.", "Keep it short and punchy."],
      },
    ],
  },

  {
    id: "alpha-capital-group",
    name: "ALPHA CAPITAL GROUP",
    website: "https://alphacapitalgroup.uk/",
    shortPitch:
      "Popular UK-based prop evaluation with multiple program lines (Alpha Pro / Alpha One / Swing). Rules are straightforward but there are risk-management group behaviors to be aware of.",
    tags: ["UK", "1-Step & 2-Step", "MT5/cTrader/TradeLocker (varies)", "Risk groups"],
    brand: { accentClass: "text-sky-300"},
    highlights: [
      { label: "Program variety", value: "Alpha Pro / Alpha One / Swing", tone: "good" },
      { label: "Daily risk math", value: "Daily loss calculated from start-of-day (server day)", tone: "neutral" },
      { label: "Risk management group", value: "Accounts may be moved / leverage reduced in certain cases", tone: "warn" },
    ],
    programs: [
      {
        id: "acg-alpha-pro-2step",
        name: "Alpha Pro",
        subtitle: "2-Step evaluation (popular baseline)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker (varies by region/offer)"],
        payoutSplit: "Varies by plan (commonly 80%+)",
        timeLimit: "Varies (often no hard time limit on many modern offers)",
        minTradingDays: "Varies (often present)",
        pricingTiers: [
          { sizeLabel: "25K", price: { currency: "USD", amount: 197 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 297 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 497 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 997 } },
        ],
        objectives: [
          { label: "Typical profit targets", value: "Varies by program size/line (edit per your preferred spec)", tone: "neutral" },
          { label: "Daily loss limit", value: "Start-of-day based (server day)", tone: "warn" },
          { label: "Max drawdown", value: "Program-dependent (edit)", tone: "bad" },
        ],
        rules: [
          { label: "Risk management group", value: "Possible leverage reduction / monitoring (case dependent)", tone: "warn" },
          { label: "Trading day boundary", value: "Calculated from daily candle open (server time)", tone: "neutral" },
          { label: "Notes", value: "Keep this section aligned to whichever Alpha program(s) you officially support", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (Alpha)",
            severity: "high",
            bullets: [
              "Example: what behaviors trigger risk management group moves",
              "Example: lot size/exposure limitations you’ve seen in practice",
              "Example: payout review patterns",
            ],
          },
        ],
        sourcesInComments: [
          // https://alphacapitalgroup.uk/product
          // https://help.alphacapitalgroup.uk/en/articles/6934210-what-are-the-daily-risk-limits-and-how-do-they-work
          // https://help.alphacapitalgroup.uk/en/articles/9691161-risk-management-group-pro
        ],
      },
      {
        id: "acg-alpha-one-1step",
        name: "Alpha One",
        subtitle: "1-Step evaluation (simplified path)",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5", "cTrader", "TradeLocker (varies)"],
        payoutSplit: "Varies",
        timeLimit: "Varies",
        minTradingDays: "Varies",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 50 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 297 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 497 } },
        ],
        objectives: [
          { label: "Profit target", value: "Program-dependent (edit)", tone: "neutral" },
          { label: "Daily loss", value: "Start-of-day based (server day)", tone: "warn" },
          { label: "Max loss", value: "Program-dependent (edit)", tone: "bad" },
        ],
        rules: [
          { label: "Leverage", value: "Depends on account/risk group; reductions may apply", tone: "warn" },
          { label: "Notes", value: "If you want exact numbers, set them here and hide program variants you don’t want", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (Alpha One)",
            severity: "medium",
            bullets: ["Paste your community findings here."],
          },
        ],
      },
    ],
    firmLevelHiddenRules: [
      {
        title: "Firm-level hidden notes (template)",
        severity: "medium",
        bullets: ["Example: payouts + review timing behavior", "Example: device/IP consistency pitfalls"],
      },
    ],
  },

  {
    id: "fundednext",
    name: "FUNDEDNEXT",
    website: "https://fundednext.com/",
    shortPitch:
      "Known for multiple models (2-Step, 1-Step, Lite/Instant variants). Generally clear limits (often 5% daily / 10% max on 2-step) and published plan tables.",
    tags: ["Many models", "Up to 95% split (varies)", "Clear plan tables", "Promo-heavy"],
    brand: { accentClass: "text-fuchsia-300"},
    highlights: [
      { label: "Common 2-step limits", value: "Daily 5% / Max 10% (2-step)", tone: "warn" },
      { label: "Profit targets", value: "Commonly 8% then 5% (2-step)", tone: "neutral" },
      { label: "First withdrawal", value: "Often ~21 days (model-dependent)", tone: "neutral" },
    ],
    programs: [
      {
        id: "fn-stellar-2step",
        name: "Stellar (2-Step)",
        subtitle: "Phase 1 → Phase 2 evaluation",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5 (varies)", "cTrader (varies)"],
        payoutSplit: "Up to 95% (varies by model/reward rules)",
        timeLimit: "Published per model (often no strict time limit on modern offerings)",
        minTradingDays: "5 days (commonly)",
        pricingTiers: [
          { sizeLabel: "15K", price: { currency: "USD", amount: 119.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 199.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 299.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099.99 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8%", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "5%", tone: "neutral" },
          { label: "Daily Loss Limit", value: "5% (model-dependent)", tone: "warn" },
          { label: "Max Loss Limit", value: "10% (2-step)", tone: "bad" },
          { label: "Minimum Trading Days", value: "5 days (commonly)", tone: "neutral" },
        ],
        rules: [
          { label: "News trading", value: "Allowed on many models (confirm per program)", tone: "neutral" },
          { label: "Refundable fee", value: "Typically refunded per published rules after first payout", tone: "good" },
          { label: "Notes", value: "FundedNext has multiple variants (Lite/Instant/Express). Add them below as needed.", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (FundedNext)",
            severity: "medium",
            bullets: [
              "Example: any payout consistency/behavioral constraints you’ve seen",
              "Example: restricted strategies/EA handling",
            ],
          },
        ],
        sourcesInComments: [
          // https://fundednext.com/plan
          // https://fundednext.com/stellar-model
          // https://help.fundednext.com/en/articles/8019914-what-is-the-maximum-daily-loss-limit
          // https://help.fundednext.com/en/articles/8019915-what-is-the-maximum-loss-limit
        ],
      },
      {
        id: "fn-stellar-lite",
        name: "Stellar Lite",
        subtitle: "Lower targets / different limits (Lite model)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5 (varies)"],
        payoutSplit: "Varies",
        timeLimit: "Varies",
        minTradingDays: "5 days",
        pricingTiers: [
          { sizeLabel: "10K", price: { currency: "USD", amount: 59.99 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 139.99 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 229.99 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 399.99 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 798.99 } },
        ],
        objectives: [
          { label: "Profit Target (Phase 1)", value: "8% (Lite)", tone: "neutral" },
          { label: "Profit Target (Phase 2)", value: "4% (Lite)", tone: "neutral" },
          { label: "Daily Loss Limit", value: "4% (Lite)", tone: "warn" },
          { label: "Max Loss Limit", value: "8% (Lite)", tone: "bad" },
        ],
        rules: [
          { label: "First reward timing", value: "Model-dependent (often published)", tone: "neutral" },
          { label: "Notes", value: "Edit Lite specifics if you want to support it in-app", tone: "neutral" },
        ],
        hiddenRules: [
          { title: "ADD YOUR HIDDEN RULES (Lite)", severity: "low", bullets: ["Paste your notes here."] },
        ],
        sourcesInComments: [
          // https://fundednext.com/stellar-model
        ],
      },
    ],
    firmLevelHiddenRules: [],
  },

  {
    id: "e8",
    name: "E8",
    website: "https://e8markets.com/",
    shortPitch:
      "Multi-market prop evaluations (Forex/Futures/Crypto) with multiple account models. Public help center covers detailed objective math (EOD dynamic drawdown, payout caps, etc.).",
    tags: ["Multiple models", "Help center docs", "Forex/Futures/Crypto", "Configurable"],
    brand: { accentClass: "text-violet-300"},
    highlights: [
      { label: "Common drawdown style", value: "Model-dependent (EOD dynamic DD on some)", tone: "warn" },
      { label: "Help center depth", value: "Very detailed published docs for objectives & payout mechanics", tone: "good" },
    ],
    programs: [
      {
        id: "e8-classic",
        name: "E8 Classic",
        subtitle: "2-Step style (classic model; numbers vary by preset/checkout)",
        steps: 2,
        markets: ["Forex", "Futures (varies)", "Crypto (varies)"],
        platforms: ["Varies by market"],
        payoutSplit: "Varies (often 80–90%+ depending on chosen config)",
        timeLimit: "No time limit (commonly)",
        minTradingDays: "Model-dependent (some have none)",
        pricingTiers: [
          // E8 pricing changes and is configurable; treat as baseline placeholders.
          { sizeLabel: "10K", price: { currency: "USD", amount: 110 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 338 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 0, note: "Set exact from checkout" } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 0, note: "Set exact from checkout" } },
        ],
        objectives: [
          { label: "Profit target (Phase 2 example)", value: "4% (per E8 Classic doc example)", tone: "neutral" },
          { label: "Daily drawdown", value: "4% (example)", tone: "warn" },
          { label: "Max drawdown", value: "8% (example)", tone: "bad" },
          { label: "Time limit", value: "Unlimited (commonly)", tone: "good" },
        ],
        rules: [
          { label: "Customization", value: "E8 offers multiple models/configurations; keep your in-app spec consistent", tone: "neutral" },
          { label: "Inactivity", value: "Varies by model and market", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (E8 Classic)",
            severity: "medium",
            bullets: ["Example: consistency/profit-cap nuances", "Example: payout buffer implications in practice"],
          },
        ],
        sourcesInComments: [
          // https://help.e8markets.com/en/articles/12041696-e8-classic
        ],
      },
      {
        id: "e8-signature",
        name: "E8 Signature",
        subtitle: "One-step style with EOD dynamic drawdown & payout mechanics",
        steps: 1,
        markets: ["Forex", "Futures", "Crypto (varies)"],
        platforms: ["Varies"],
        payoutSplit: "Typically 80%+ (varies by config)",
        timeLimit: "Unlimited (commonly)",
        minTradingDays: "None (commonly on evaluation)",
        pricingTiers: [
          { sizeLabel: "50K", price: { currency: "USD", amount: 260 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 0, note: "Set exact from checkout" } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 0, note: "Set exact from checkout" } },
        ],
        objectives: [
          { label: "Profit target", value: "6% (Signature marketing/docs)", tone: "neutral" },
          { label: "EOD drawdown", value: "4% (Signature model)", tone: "warn" },
          { label: "Min trading days", value: "None (evaluation)", tone: "good" },
        ],
        rules: [
          { label: "Payout buffer", value: "Buffer applies before requesting payouts (model detail)", tone: "warn" },
          { label: "Payout caps", value: "Caps vary by account size (model detail)", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (E8 Signature)",
            severity: "high",
            bullets: [
              "Example: edge cases where EOD dynamic DD surprises traders",
              "Example: payout buffer + cap strategy guidance",
            ],
          },
        ],
        sourcesInComments: [
          // https://blog.e8markets.com/articles/the-new-era-e8-signature-account-and-crypto-markets-now-available
          // https://help.e8markets.com/en/articles/11940573-payout-caps-and-buffers-for-e8-signature-explained
        ],
      },
    ],
    firmLevelHiddenRules: [],
  },

  {
    id: "qt-funded",
    name: "QUANT TEKEL FUNDED",
    website: "https://qtfunded.quanttekel.com/",
    shortPitch:
      "QT Funded by Quant Tekel offers evaluation programs with published objectives and tiered pricing. Use this as a clean template and lock in your preferred program variant.",
    tags: ["QT Funded", "Up to 200K", "Multiple 2-step variants", "MT5/cTrader (varies)"],
    brand: { accentClass: "text-amber-300"},
    highlights: [
      { label: "Max funding (headline)", value: "Up to $200K (program dependent)", tone: "neutral" },
      { label: "Profit split (headline)", value: "Up to 90% (program dependent)", tone: "neutral" },
    ],
    programs: [
      {
        id: "qt-prime-2step",
        name: "QT PRIME (2-Step)",
        subtitle: "Two-step evaluation (set exact objectives you want to show)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["MT5 (likely)", "cTrader (likely)", "Varies"],
        payoutSplit: "Up to 90% (varies)",
        timeLimit: "Varies",
        minTradingDays: "Varies",
        pricingTiers: [
          { sizeLabel: "5K", price: { currency: "USD", amount: 50 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 80 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 180 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 300 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 590 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1100 } },
        ],
        objectives: [
          { label: "Profit targets", value: "Program-dependent (edit precisely from QT eval page)", tone: "neutral" },
          { label: "Daily loss", value: "Program-dependent (edit)", tone: "warn" },
          { label: "Max loss", value: "Program-dependent (edit)", tone: "bad" },
        ],
        rules: [
          { label: "Notes", value: "Pick ONE official QT model for your app, and hardcode the exact numbers here.", tone: "neutral" },
        ],
        hiddenRules: [
          { title: "ADD YOUR HIDDEN RULES (QT)", severity: "medium", bullets: ["Paste your research here."] },
        ],
        sourcesInComments: [
          // https://qtfunded.quanttekel.com/evaluations/
        ],
      },
    ],
    firmLevelHiddenRules: [],
  },

  {
    id: "funderpro",
    name: "FUNDERPRO",
    website: "https://funderpro.com/",
    shortPitch:
      "Known for multiple challenge types (One Phase, Classic, Pro). Public docs explain drawdown mechanics and examples; pricing often includes refunds/credits after first reward.",
    tags: ["One Phase", "Classic/Pro variants", "Drawdown examples", "Payout schedules vary"],
    brand: { accentClass: "text-lime-300"},
    highlights: [
      { label: "One Phase", value: "Single-step style challenge exists", tone: "good" },
      { label: "Drawdown examples", value: "Published examples for daily/max drawdown mechanics", tone: "good" },
    ],
    programs: [
      {
        id: "fp-one-phase",
        name: "One Phase",
        subtitle: "Single-step style challenge",
        steps: 1,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["Varies (MT5/TradeLocker/cTrader)"],
        payoutSplit: "Often 80% (varies)",
        timeLimit: "Unlimited (commonly)",
        minTradingDays: "Varies",
        pricingTiers: [
          { sizeLabel: "25K", price: { currency: "USD", amount: 249 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 349 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 549 } },
          { sizeLabel: "150K", price: { currency: "USD", amount: 819 } },
          { sizeLabel: "200K", price: { currency: "USD", amount: 1099 } },
        ],
        objectives: [
          { label: "Profit target", value: "10% (commonly shown for some tiers)", tone: "neutral" },
          { label: "Daily drawdown", value: "Program-dependent; see FunderPro rules (edit exact)", tone: "warn" },
          { label: "Max drawdown", value: "Program-dependent; some models have tighter max DD", tone: "bad" },
        ],
        rules: [
          { label: "Fee handling", value: "Challenge fee credited/refunded per program terms", tone: "good" },
          { label: "Inactivity", value: "Some offers close after X days inactivity (confirm)", tone: "neutral" },
        ],
        hiddenRules: [
          { title: "ADD YOUR HIDDEN RULES (FunderPro)", severity: "high", bullets: ["Paste your findings here."] },
        ],
        sourcesInComments: [
          // https://funderpro.com/trading-rules/
          // https://funderpro.com/the-challenge/
        ],
      },
    ],
    firmLevelHiddenRules: [],
  },

  {
    id: "fundingpips",
    name: "FUNDINGPIPS",
    website: "https://fundingpips.com/",
    shortPitch:
      "Multiple evaluation types and frequent promos. Public terms describe daily/overall limits and minimum profitable day definitions.",
    tags: ["2-Step", "1-Step", "Promos", "Terms define min profitable day"],
    brand: { accentClass: "text-rose-300"},
    highlights: [
      { label: "Risk limits (common)", value: "Often stated as ~5% daily / 10% overall for standard models", tone: "warn" },
      { label: "Min profitable day definition", value: "Terms define what counts as a profitable day", tone: "neutral" },
    ],
    programs: [
      {
        id: "fundingpips-2step",
        name: "FundingPips (2-Step)",
        subtitle: "Two-step evaluation (keep your in-app numbers consistent)",
        steps: 2,
        markets: ["Forex", "Indices", "Metals", "Commodities", "Crypto (CFD)"],
        platforms: ["Varies"],
        payoutSplit: "Varies",
        timeLimit: "Varies",
        minTradingDays: "Often 3 days (program dependent)",
        pricingTiers: [
          // Baseline from public site snippets/typical tiers; adjust for promos.
          { sizeLabel: "5K", price: { currency: "USD", amount: 32 } },
          { sizeLabel: "10K", price: { currency: "USD", amount: 60 } },
          { sizeLabel: "25K", price: { currency: "USD", amount: 139 } },
          { sizeLabel: "50K", price: { currency: "USD", amount: 239 } },
          { sizeLabel: "100K", price: { currency: "USD", amount: 399 } },
        ],
        objectives: [
          { label: "Daily loss limit", value: "Commonly ~5% (model dependent — set exact)", tone: "warn" },
          { label: "Overall loss limit", value: "Commonly ~10% (model dependent — set exact)", tone: "bad" },
          { label: "Minimum trading days", value: "Often 3 days (confirm exact per program)", tone: "neutral" },
        ],
        rules: [
          { label: "Profitable day definition", value: "Terms define what counts (e.g., minimum % profit)", tone: "neutral" },
          { label: "Time windows", value: "Some terms reference 30-day periods starting on first trade", tone: "neutral" },
          { label: "Notes", value: "FundingPips has multiple program lines; keep only what you want visible.", tone: "neutral" },
        ],
        hiddenRules: [
          {
            title: "ADD YOUR HIDDEN RULES (FundingPips)",
            severity: "high",
            bullets: [
              "Example: lot size caps you’ve seen",
              "Example: funded-stage profit cap/consistency nuances",
              "Example: payout denials patterns (if any) from community experience",
            ],
          },
        ],
        sourcesInComments: [
          // https://fundingpips.com/en/legal/terms-and-conditions
          // https://fundingpips.com/
        ],
      },
    ],
    firmLevelHiddenRules: [],
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
          <Pill tone="good">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              editable templates
            </span>
          </Pill>
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
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-140px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {topBar}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT: Firm grid */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="hidden md:block">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <SectionTitle
                  icon={Shield}
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
                          <div className="flex items-center gap-3">
                            <FirmLogo firmId={firm.id} size={44} />

                            <div>
                              <div className="text-sm font-semibold text-white">{firm.name}</div>
                              <div className="mt-0.5 line-clamp-2 text-xs text-white/55">{firm.shortPitch}</div>
                            </div>
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

              <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                <SectionTitle
                  icon={BookOpen}
                  title="How to edit quickly"
                  subtitle="Everything lives in a single object"
                />
                <div className="mt-3 space-y-2 text-xs text-white/55">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    Edit: <span className="font-semibold text-white/80">FIRMS → firm.programs → objectives/rules</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    Add your Discord insights in:{" "}
                    <span className="font-semibold text-white/80">hiddenRules</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    Want fewer variants? Delete programs you don’t support.
                  </div>
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
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs font-extrabold tracking-wide text-white",
                        activeFirm.brand.accentClass
                      )}
                    >
                      <FirmLogo firmId={activeFirm.id} size={52} />

                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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
                    right={
                      <Pill tone="good">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          editable
                        </span>
                      </Pill>
                    }
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
                            <FirmLogo firmId={firm.id} size={44} />

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

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start gap-2">
            <BadgeInfo className="mt-0.5 h-4 w-4 text-white/50" />
            <div className="text-xs text-white/55">
              Want perfect accuracy? Open the firm checkout and paste exact tiers here. The UI will auto-update.
            </div>
          </div>
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

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-white/50" />
            <div className="text-xs text-white/55">
              If you later want “rule cards” to be even more structured, convert <b>rules/objectives</b> into grouped
              sections (e.g. Drawdown, Targets, Payouts, Restrictions). The UI supports it easily.
            </div>
          </div>
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

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start gap-2">
            <BadgeInfo className="mt-0.5 h-4 w-4 text-white/50" />
            <div className="text-xs text-white/55">
              Recommended structure for “hidden rules”: <b>title</b> + 3–6 bullets + severity. Keeps the UI clean and
              scannable.
            </div>
          </div>
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
