export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced"

type AIAccountResult = {
  firm_name?: string
  account_size?: number
  phase?: string
  status?: string
  rules?: Record<string, any>
  missing_info?: string[]
  confidence?: number
  failure_analysis?: {
    primary_reason: string
    secondary_factors: string[]
    psychological_pattern?: string
    preventable: boolean
    ai_verdict: string
  }
}


export type User = {
  id: string
  name: string
  email: string
  experienceLevel: ExperienceLevel
  timezone: string
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

export type RuleViolationType =
  | "daily_loss_limit"
  | "max_loss_limit"
  | "time_limit"
  | "min_days"
  | "instruments"
  | "news_trading"
  | "consistency"
  | "other"

export type RuleViolation = {
  id: string
  tsISO: string
  type: RuleViolationType
  title: string
  detail: string
  severity: "low" | "med" | "high"
  resolved?: boolean
}

export type ChallengeDay = {
  dayIndex: number // 1..N
  dateISO: string
  pnlUsd: number
  pnlPct: number
  trades: number
  note?: string
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
    ruleRiskScore: number // 0–100 (higher = riskier)
    tradingDaysCompleted: number
  }
  live?: {
    equityUsd: number
    dailyLossRemainingUsd: number
    maxLossBufferUsd: number
    profitTargetRemainingUsd: number
    timeRemainingDays: number
  }
  timeline: ChallengeDay[]
  violations: RuleViolation[]
}

export type FirmTemplate = {
  id: string
  name: string
  region?: string
  tags?: string[]
  defaultRules: ChallengeRules
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

export type FailureAnalysis = {
  primary_reason:
    | "Daily Drawdown"
    | "Max Drawdown"
    | "Overtrading"
    | "Rule Violation"
    | "Poor Risk Management"
    | "Psychological Tilt"
    | "Unknown"
  secondary_factors: string[]
  psychological_pattern: string | null
  preventable: boolean
  ai_verdict: string
}

export type Account = {
  id: string
  firm_name: string
  account_size: number | null
  phase: string
  status: string
  rules: Record<string, any>
  inferred: {
    confidence: number
    missing_info: string[]
  }
  failure_analysis?: FailureAnalysis   // 👈 THIS LINE
  notes: string
}
