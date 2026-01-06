// lib/fundamentals/types.ts

export type Tone = "good" | "bad" | "neutral" | "warn" | "info"

export type AssetClass = "FX" | "Indices" | "Rates" | "Commodities" | "Metals" | "Crypto"
export type MarketRegime = "Risk-On" | "Risk-Off" | "Inflation" | "Disinflation" | "Growth" | "Recession"

export type SentimentLabel =
  | "Bullish"
  | "Bearish"
  | "Neutral"
  | "Risk-On"
  | "Risk-Off"
  | "Inflationary"
  | "Deflationary"

export type Impact = "Low" | "Medium" | "High" | "Extreme"

export type SourceKind = "News" | "Macro" | "CentralBank" | "Flow" | "Earnings" | "Onchain" | "Social"

export type VolatilityRegime = "Low" | "Normal" | "Elevated" | "High"

export type MarketState = {
  updatedAt: number

  // 0..100
  riskAppetite: number
  ratesPressure: number
  positioningStress: number

  volatility: {
    regime: VolatilityRegime
    score: number // 0..100
  }

  // helpful text for UI
  headline: string
  bullets: string[]
}

export type MarketEvent = {
  id: string
  ts: number
  title: string
  summary: string
  source: SourceKind
  impact: Impact
  assets: string[]
  tags: string[]
  sentiment: SentimentLabel
  confidence: number
  whyItMatters: string
  expected: string
  reactionPlan: string
  links?: { label: string; href: string }[]
}

export type CalendarEvent = {
  country: any
  id: string
  
  ts: number
  title: string
  source: string
  impact: "Low" | "Medium" | "High" |"Extreme"
  assets: string[]
  tags: string[]
}

export type UICalendarEvent = CalendarEvent & {
  region: string
  type: "Economic" | "Holiday" | "CentralBank"
  watch: string[]
  notes: string
}

export type CrossMarketRow = {
  symbol: string
  assetClass: AssetClass
  bias: "Long" | "Short" | "Neutral"
  confidence: number
  catalysts: string[]
  correlationNotes: string
  playbook: string
  keyLevels: { label: string; value: number }[]
  spark: number[]
}

export type Anomaly = {
  id: string
  ts: number
  name: string
  symbol: string
  severity: number
  category: "Volatility" | "Liquidity" | "CorrelationBreak" | "FlowSpike" | "EventShock" | "Positioning"
  detection: string
  implication: string
  suggestedAction: string
}

export type CBComm = {
  id: string
  ts: number
  bank: "Fed" | "ECB" | "BoE" | "BoJ" | "PBoC" | "RBA" | "BoC"
  speaker: string
  title: string
  hawkDove: number // -100..100
  keyQuotes: string[]
  summary: string
  watchlistImpacts: string[]
}

export type MacroSnapshot = {
  regime: MarketRegime
  headline: string
  marketPricing: {
    fedCutsNext12m: string
    terminalRate: string
    inflationBreakevens: string
    growthNowcast: string
    riskPremium: string
  }
  positioning: {
    usd: "Crowded Long" | "Neutral" | "Crowded Short"
    equities: "Overweight" | "Neutral" | "Underweight"
    bonds: "Long Duration" | "Neutral" | "Short Duration"
    gold: "Accumulation" | "Neutral" | "Distribution"
  }
  narrative: string
  reactionRules: { if: string; then: string; confidence: number }[]
  watch: string[]
}

export type FundamentalsSnapshot = {
  ts: number
  macro: MacroSnapshot
  events: MarketEvent[]
  calendar: UICalendarEvent[]
  anomalies: Anomaly[]
  centralBanks: CBComm[]
  crossMarket: CrossMarketRow[]
  marketState: MarketState
}
