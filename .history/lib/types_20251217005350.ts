export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced"

export type User = {
  id: string
  name: string
  email: string
  experienceLevel: ExperienceLevel
  timezone: string
}

export type FirmTemplate = {
  id: string
  name: string
  region?: string
}

export type ChallengeStatus = "in_progress" | "passed" | "failed"

export type ChallengeRules = {
  accountSize: number
  profitTargetPct: number
  dailyLossLimitPct: number
  maxLossLimitPct: number
  minTradingDays: number
  timeLimitDays: number
  leverage: string
  instrumentsAllowed: string[]
}

export type Challenge = {
  id: string
  firmId: string
  firmName: string
  name: string
  phase: "Phase 1" | "Phase 2" | "Funded"
  status: ChallengeStatus
  startDateISO: string
  rules: ChallengeRules
  stats: {
    pnlUsd: number
    pnlPct: number
    winRate: number
    profitFactor: number
    maxDrawdownPct: number
    consistencyScore: number
    ruleRiskScore: number // 0–100
    tradingDaysCompleted: number
  }
  live: {
    equityUsd: number
    dailyLossRemainingUsd: number
    maxLossBufferUsd: number
    profitTargetRemainingUsd: number
    timeRemainingDays: number
  }
}

export type TradeDirection = "Long" | "Short"
export type TradeOutcome = "Win" | "Loss" | "BE"

export type Trade = {
  id: string
  tsISO: string
  instrument: string
  direction: TradeDirection
  entry: number
  exit: number
  rMultiple: number
  durationMin: number
  session: "Asia" | "London" | "NY" | "Off-hours"
  setupTag: string
  outcome: TradeOutcome
}

export type AiInsight = {
  id: string
  title: string
  severity: "low" | "med" | "high"
  detail: string
  suggestedAction: string
  relatedMetric?: string
}

export type NextAction = {
  id: string
  label: string
  done: boolean
}
