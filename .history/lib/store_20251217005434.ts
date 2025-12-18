import type { AiInsight, Challenge, NextAction, Trade, User } from "./types"

export const mockUser: User = {
  id: "u_demo_001",
  name: "Demo Trader",
  email: "demo@propguru.ai",
  experienceLevel: "Intermediate",
  timezone: "Europe/London",
}

export const mockActiveChallenge: Challenge = {
  id: "c_001",
  firmId: "f_001",
  firmName: "Apex-style Futures",
  name: "50K Challenge",
  phase: "Phase 1",
  status: "in_progress",
  startDateISO: "2025-12-01T09:00:00Z",
  rules: {
    accountSize: 50000,
    profitTargetPct: 8,
    dailyLossLimitPct: 2,
    maxLossLimitPct: 6,
    minTradingDays: 5,
    timeLimitDays: 30,
    leverage: "1:30",
    instrumentsAllowed: ["NQ", "ES", "MNQ", "MES"],
  },
  stats: {
    pnlUsd: 2140,
    pnlPct: 4.28,
    winRate: 54,
    profitFactor: 1.72,
    maxDrawdownPct: -3.2,
    consistencyScore: 82,
    ruleRiskScore: 28,
    tradingDaysCompleted: 7,
  },
  live: {
    equityUsd: 52140,
    dailyLossRemainingUsd: 120,
    maxLossBufferUsd: 860,
    profitTargetRemainingUsd: 1860,
    timeRemainingDays: 23,
  },
}

export const mockInsights: AiInsight[] = [
  {
    id: "ins_1",
    title: "Daily loss proximity spikes after 2 consecutive losses",
    severity: "high",
    detail:
      "Your size stays constant after losses, causing rapid approach to the daily loss limit on choppy sessions.",
    suggestedAction:
      "After 2 losses, cut size by 30% and stop trading for 20 minutes. If still down, end session.",
    relatedMetric: "Daily Loss Remaining",
  },
  {
    id: "ins_2",
    title: "Overtrading risk: NY open impulse entries",
    severity: "med",
    detail:
      "You take 3–5 trades in the first 30 minutes of NY open with lower R expectancy and higher slippage.",
    suggestedAction:
      "Trade only A+ setup tags for the first 30 minutes. Max 2 attempts. No re-entries without structure.",
    relatedMetric: "Consistency Score",
  },
  {
    id: "ins_3",
    title: "Best edge: London AM pullback continuation",
    severity: "low",
    detail:
      "London AM trades show higher profit factor and fewer rule proximity events.",
    suggestedAction:
      "Allocate 70% of daily risk budget to London AM. Treat NY as optional 'bonus' session.",
    relatedMetric: "Profit Factor",
  },
  {
    id: "ins_4",
    title: "Max loss buffer stable — but single-trade risk is creeping",
    severity: "med",
    detail:
      "Your average risk per trade increased over the last 10 trades while win rate stayed flat.",
    suggestedAction:
      "Cap risk at 0.5R until you complete 3 green days in a row. Prioritize execution quality.",
    relatedMetric: "Max Loss Buffer",
  },
]

export const mockNextActions: NextAction[] = [
  { id: "na_1", label: "Set a hard rule: stop after 2 losses", done: false },
  { id: "na_2", label: "Tag last 10 trades by setup + session", done: true },
  { id: "na_3", label: "Reduce NY open participation this week", done: false },
  { id: "na_4", label: "Define A+ criteria for pullback continuation", done: false },
]

export const mockRecentTrades: Trade[] = [
  {
    id: "t_101",
    tsISO: "2025-12-17T09:18:00Z",
    instrument: "NQ",
    direction: "Long",
    entry: 21345.25,
    exit: 21388.5,
    rMultiple: 1.4,
    durationMin: 22,
    session: "London",
    setupTag: "Pullback Continuation",
    outcome: "Win",
  },
  {
    id: "t_102",
    tsISO: "2025-12-17T13:36:00Z",
    instrument: "NQ",
    direction: "Short",
    entry: 21420.0,
    exit: 21406.25,
    rMultiple: 0.6,
    durationMin: 11,
    session: "NY",
    setupTag: "Breakout Fade",
    outcome: "Win",
  },
  {
    id: "t_103",
    tsISO: "2025-12-16T14:08:00Z",
    instrument: "ES",
    direction: "Long",
    entry: 6108.75,
    exit: 6098.0,
    rMultiple: -1.0,
    durationMin: 18,
    session: "NY",
    setupTag: "Impulse Entry",
    outcome: "Loss",
  },
  {
    id: "t_104",
    tsISO: "2025-12-16T09:42:00Z",
    instrument: "NQ",
    direction: "Long",
    entry: 21210.0,
    exit: 21210.0,
    rMultiple: 0.0,
    durationMin: 7,
    session: "London",
    setupTag: "Pullback Continuation",
    outcome: "BE",
  },
  {
    id: "t_105",
    tsISO: "2025-12-15T13:05:00Z",
    instrument: "NQ",
    direction: "Short",
    entry: 21302.75,
    exit: 21331.0,
    rMultiple: -0.8,
    durationMin: 14,
    session: "NY",
    setupTag: "Impulse Entry",
    outcome: "Loss",
  },
]
