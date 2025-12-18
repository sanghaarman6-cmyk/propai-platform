import { z } from "zod"

export const StrategyProfileSchema = z.object({
  strategy_name: z.string().min(1),
  market: z.enum(["FX", "Futures", "Crypto", "Stocks", "Indices", "Mixed"]),
  instruments: z.array(z.string()).min(1),
  timeframe: z.array(z.string()).min(1),
  sessions: z.array(z.enum(["Asia", "London", "NY", "Off-hours"])).min(1),
  entry_model: z.string().min(10),
  exit_model: z.string().min(10),
  risk_model: z.object({
    risk_per_trade_pct: z.number().min(0).max(5),
    daily_stop_rule: z.string().min(5),
    max_trades_per_day: z.number().min(1).max(50),
  }),
  filters: z.array(z.string()).default([]),
  edge_definition: z.string().min(10),
  common_failure_modes: z.array(z.string()).default([]),
  notes: z.string().default(""),
})

export type StrategyProfile = z.infer<typeof StrategyProfileSchema>
