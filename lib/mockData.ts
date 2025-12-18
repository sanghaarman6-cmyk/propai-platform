import type {
  AiInsight,
  Challenge,
  FirmTemplate,
  NextAction,
  Trade,
  User,
} from "./types"

export const mockUser: User = {
  id: "u_demo_001",
  name: "Demo Trader",
  email: "demo@propguru.ai",
  experienceLevel: "Intermediate",
  timezone: "Europe/London",
}

export const mockFirmTemplates: FirmTemplate[] = [
  {
    id: "f_ftmo_like",
    name: "FTMO-like CFD",
    region: "EU/UK",
    tags: ["CFD", "News rules", "Strict DD"],
    defaultRules: {
      accountSize: 100000,
      profitTargetPct: 10,
      dailyLossLimitPct: 5,
      maxLossLimitPct: 10,
      minTradingDays: 4,
      timeLimitDays: 30,
      leverage: "1:100",
      instrumentsAllowed: ["FX", "Indices", "Gold"],
    },
  },
  {
    id: "f_5ers_like",
    name: "5ers-like",
    region: "Global",
    tags: ["Scaling", "Lower targets"],
    defaultRules: {
      accountSize: 60000,
      profitTargetPct: 6,
      dailyLossLimitPct: 4,
      maxLossLimitPct: 8,
      minTradingDays: 3,
      timeLimitDays: 60,
      leverage: "1:30",
      instrumentsAllowed: ["FX", "Indices"],
    },
  },
  {
    id: "f_apex_like",
    name: "Apex-style Futures",
    region: "US",
    tags: ["Futures", "Trailing DD (mocked)"],
    defaultRules: {
      accountSize: 50000,
      profitTargetPct: 8,
      dailyLossLimitPct: 2,
      maxLossLimitPct: 6,
      minTradingDays: 5,
      timeLimitDays: 30,
      leverage: "1:30",
      instrumentsAllowed: ["NQ", "ES", "MNQ", "MES"],
    },
  },
]

function day(dateISO: string, pnlUsd: number, pnlPct: number, trades: number): any {
  return { dateISO, pnlUsd, pnlPct, trades }
}

export const mockChallenges: Challenge[] = [
  {
    id: "c_live_001",
    firmId: "f_apex_like",
    firmName: "Apex-style Futures",
    name: "50K Challenge",
    phase: "Phase 1",
    status: "in_progress",
    startDateISO: "2025-12-01T09:00:00Z",
    rules: mockFirmTemplates.find((f) => f.id === "f_apex_like")!.defaultRules,
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
    timeline: [
      { ...day("2025-12-01", 210, 0.42, 3), dayIndex: 1 },
      { ...day("2025-12-02", -180, -0.36, 4), dayIndex: 2 },
      { ...day("2025-12-03", 390, 0.78, 2), dayIndex: 3 },
      { ...day("2025-12-04", 120, 0.24, 2), dayIndex: 4 },
      { ...day("2025-12-05", -260, -0.52, 5), dayIndex: 5 },
      { ...day("2025-12-06", 710, 1.42, 3), dayIndex: 6 },
      { ...day("2025-12-07", 1150, 2.30, 4), dayIndex: 7 },
    ],
    violations: [
      {
        id: "v1",
        tsISO: "2025-12-05T14:12:00Z",
        type: "daily_loss_limit",
        title: "Daily loss proximity event",
        detail:
          "Approached within $60 of daily loss limit after consecutive losses on NY open.",
        severity: "med",
        resolved: true,
      },
      {
        id: "v2",
        tsISO: "2025-12-16T14:20:00Z",
        type: "other",
        title: "Impulse entry cluster",
        detail:
          "3 trades taken within 12 minutes without tagged setup confirmation.",
        severity: "low",
        resolved: false,
      },
    ],
  },
  {
    id: "c_ftmo_fail_p1",
    firmId: "f_ftmo_like",
    firmName: "FTMO-like CFD",
    name: "100K Eval",
    phase: "Phase 1",
    status: "failed",
    startDateISO: "2025-10-03T09:00:00Z",
    rules: mockFirmTemplates.find((f) => f.id === "f_ftmo_like")!.defaultRules,
    stats: {
      pnlUsd: -4200,
      pnlPct: -4.2,
      winRate: 47,
      profitFactor: 1.21,
      maxDrawdownPct: -5.3,
      consistencyScore: 58,
      ruleRiskScore: 76,
      tradingDaysCompleted: 6,
    },
    timeline: [
      { ...day("2025-10-03", 560, 0.56, 3), dayIndex: 1 },
      { ...day("2025-10-04", -820, -0.82, 6), dayIndex: 2 },
      { ...day("2025-10-07", -1310, -1.31, 8), dayIndex: 3, note: "NY open chop" },
      { ...day("2025-10-08", 220, 0.22, 2), dayIndex: 4 },
      { ...day("2025-10-09", -1690, -1.69, 10), dayIndex: 5 },
      { ...day("2025-10-10", -1160, -1.16, 7), dayIndex: 6 },
    ],
    violations: [
      {
        id: "v3",
        tsISO: "2025-10-10T15:04:00Z",
        type: "daily_loss_limit",
        title: "Daily DD breached",
        detail: "Daily loss limit exceeded by ~$120 due to size escalation.",
        severity: "high",
        resolved: false,
      },
      {
        id: "v4",
        tsISO: "2025-10-09T13:51:00Z",
        type: "consistency",
        title: "High variance day",
        detail:
          "Large position size used after losses, inconsistent with prior days.",
        severity: "med",
        resolved: false,
      },
    ],
  },
  {
    id: "c_5ers_pass_p1",
    firmId: "f_5ers_like",
    firmName: "5ers-like",
    name: "60K Low-Stress",
    phase: "Phase 1",
    status: "passed",
    startDateISO: "2025-08-14T09:00:00Z",
    rules: mockFirmTemplates.find((f) => f.id === "f_5ers_like")!.defaultRules,
    stats: {
      pnlUsd: 4100,
      pnlPct: 6.83,
      winRate: 56,
      profitFactor: 1.88,
      maxDrawdownPct: -2.1,
      consistencyScore: 86,
      ruleRiskScore: 22,
      tradingDaysCompleted: 5,
    },
    timeline: [
      { ...day("2025-08-14", 820, 1.36, 2), dayIndex: 1 },
      { ...day("2025-08-15", 610, 1.01, 2), dayIndex: 2 },
      { ...day("2025-08-16", -240, -0.40, 2), dayIndex: 3 },
      { ...day("2025-08-19", 1330, 2.22, 3), dayIndex: 4 },
      { ...day("2025-08-20", 1580, 2.63, 3), dayIndex: 5 },
    ],
    violations: [],
  },
]

// Dashboard mock (Phase 4 uses these)
export const mockActiveChallenge: Challenge = mockChallenges[0]

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
]
