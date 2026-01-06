import type { PropFirmDefinition } from "./types"

const SIZES_PRO = [5000, 10000, 25000, 50000, 100000, 200000]
const SIZES_THREE = [10000, 25000, 50000, 100000]

function sizes(
  accountSizes: number[],
  profitTargetPct: number,
  drawdown: {
    daily?: {
      percent: number
      model:
        | "static_balance"
        | "static_equity"
        | "trailing_balance"
        | "trailing_equity"
    }
    max: {
      percent: number
      model:
        | "static_balance"
        | "static_equity"
        | "trailing_balance"
        | "trailing_equity"
    }
  },
  rules: {
    minTradingDays?: number
    maxTradingDays?: number
    weekendHoldingAllowed?: boolean
    newsTradingAllowed?: boolean
    eaAllowed?: boolean
  }
) {
  return accountSizes.map((s) => ({
    accountSize: s,
    profitTargetPct,
    drawdown,
    rules,
  }))
}

export const ALPHA_CAPITAL: PropFirmDefinition = {
  firmKey: "alpha_capital",
  firmName: "Alpha Capital Group",

  programs: [
    /* ======================================================
       ALPHA PRO – 8% TARGET / 4% DAILY DD
    ====================================================== */
    {
      program: "Alpha Pro – 8% / 4%",
      phases: [
        {
          phase: "Phase 1",
          accountSizes: sizes(
            SIZES_PRO,
            8,
            {
              daily: { percent: 4, model: "static_equity" },
              max: { percent: 8, model: "static_equity" },
            },
            {
              minTradingDays: 3,
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
        {
          phase: "Phase 2",
          accountSizes: sizes(
            SIZES_PRO,
            4,
            {
              daily: { percent: 4, model: "static_equity" },
              max: { percent: 8, model: "static_equity" },
            },
            {
              minTradingDays: 3,
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
        {
          phase: "Funded",
          accountSizes: sizes(
            SIZES_PRO,
            0,
            {
              daily: { percent: 4, model: "static_equity" },
              max: { percent: 8, model: "static_equity" },
            },
            {
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
      ],
    },

    /* ======================================================
       ALPHA PRO – 6% TARGET / 3% DAILY DD
    ====================================================== */
    {
      program: "Alpha Pro – 6% / 3%",
      phases: [
        {
          phase: "Phase 1",
          accountSizes: sizes(
            SIZES_PRO,
            6,
            {
              daily: { percent: 3, model: "static_equity" },
              max: { percent: 6, model: "static_equity" },
            },
            {
              minTradingDays: 3,
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
      ],
    },

    /* ======================================================
       ALPHA PRO – 10% TARGET / 5% DAILY DD
    ====================================================== */
    {
      program: "Alpha Pro – 10% / 5%",
      phases: [
        {
          phase: "Phase 1",
          accountSizes: sizes(
            SIZES_PRO,
            10,
            {
              daily: { percent: 5, model: "static_equity" },
              max: { percent: 10, model: "static_equity" },
            },
            {
              minTradingDays: 3,
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
      ],
    },

    /* ======================================================
       ALPHA THREE – 6% TARGET / 3% DD
    ====================================================== */
    {
      program: "Alpha Three",
      phases: [
        {
          phase: "Phase 1",
          accountSizes: sizes(
            SIZES_THREE,
            6,
            {
              daily: { percent: 3, model: "static_equity" },
              max: { percent: 6, model: "static_equity" },
            },
            {
              minTradingDays: 1,
              newsTradingAllowed: true,
              weekendHoldingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
      ],
    },

    /* ======================================================
       SWING
    ====================================================== */
    {
      program: "Swing",
      phases: [
        {
          phase: "Phase 1",
          accountSizes: sizes(
            SIZES_PRO,
            8,
            {
              daily: { percent: 5, model: "static_equity" },
              max: { percent: 10, model: "static_equity" },
            },
            {
              minTradingDays: 3,
              weekendHoldingAllowed: true,
              newsTradingAllowed: true,
              eaAllowed: true,
            }
          ),
        },
      ],
    },
  ],
}
