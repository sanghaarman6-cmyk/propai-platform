"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TerminalCard from "@/components/TerminalCard"
import SymbolPickerModal from "@/components/SymbolPickerModal"
import clsx from "clsx"
import {
  Calculator,
  AlertTriangle,
  ArrowRightLeft,
  Shield,
  Percent,
  Coins,
  TrendingUp,
  Gauge,
  RotateCcw,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                              Persistence Utils                              */
/* -------------------------------------------------------------------------- */
type Tab = "margin" | "position" | "prop"

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)
  const timeout = useRef<NodeJS.Timeout | null>(null)

  // Read localStorage AFTER mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        setState(JSON.parse(raw))
      }
    } catch {}
    setHydrated(true)
  }, [key])

  // Persist changes
  useEffect(() => {
    if (!hydrated) return

    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state))
      } catch {}
    }, 250)

    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [key, state, hydrated])

  return [state, setState, hydrated] as const
}


function useIdleReset(reset: () => void, delay = 15 * 60 * 1000) {
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function bump() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(reset, delay)
    }

    bump()
    window.addEventListener("mousemove", bump)
    window.addEventListener("keydown", bump)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      window.removeEventListener("mousemove", bump)
      window.removeEventListener("keydown", bump)
    }
  }, [reset, delay])
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const SYMBOLS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "NZDUSD",
  "USDCAD",
  "USDCHF",
  "XAUUSD",
  "NAS100",
  "SPX500",
  "US30",
] as const

const MANUAL_ONLY_SYMBOLS = new Set(["NAS100", "SPX500", "US30"])

function pipSizeFor(symbol: string) {
  if (symbol === "XAUUSD") return 0.1
  return symbol.endsWith("JPY") ? 0.01 : 0.0001
}

function pipValueFor(symbol: string) {
  if (symbol === "XAUUSD") return 1
  if (symbol.endsWith("JPY")) return 9
  return 10
}

function contractSize(symbol: string) {
  if (/^[A-Z]{6}$/.test(symbol) && !symbol.startsWith("XAU")) return 100000
  if (symbol === "XAUUSD") return 100
  if (MANUAL_ONLY_SYMBOLS.has(symbol)) return 1
  return 100000
}

function fmtMoney(n: number) {
  if (!isFinite(n)) return "$0.00"
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

/* -------------------------------------------------------------------------- */
/*                               UI Primitives                                */
/* -------------------------------------------------------------------------- */

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-text-muted cursor-help"
      >
        i
      </span>

      <span
        className="
          pointer-events-none absolute z-50
          left-1/2 top-full mt-2 w-64 -translate-x-1/2
          rounded-xl border border-white/10 bg-black/90 p-3
          text-xs text-muted-foreground opacity-0
          group-hover:opacity-100 transition
        "
      >
        {text}
      </span>
    </span>
  )
}

function OptionGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabledOptions = [],
}: {
  label: React.ReactNode
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  disabledOptions?: readonly T[]
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value
          const disabled = disabledOptions.includes(opt)

          return (
            <button
              key={String(opt)}
              onClick={() => !disabled && onChange(opt)}
              disabled={disabled}
              className={clsx(
                "rounded-full px-3 py-1 text-xs border transition",
                disabled &&
                  "opacity-40 cursor-not-allowed border-white/10 bg-black/20 text-text-muted",
                !disabled &&
                  (active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-black/30 text-text-muted hover:text-white hover:bg-white/5")
              )}
              title={disabled ? "Coming soon" : undefined}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}



function TogglePill({
  on,
  onToggle,
  label,
  disabled,
}: {
  on: boolean
  onToggle: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border transition",
        disabled
          ? "opacity-50 cursor-not-allowed border-white/10 text-text-muted"
          : on
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-white/10 bg-black/30 text-text-muted hover:text-white hover:bg-white/5"
      )}
      title={label}
    >
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          disabled ? "bg-white/20" : on ? "bg-emerald-400" : "bg-white/30"
        )}
      />
      {label}
    </button>
  )
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={onReset}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </button>
  )
}

function Segmented({
  value,
  onChange,
  items,
}: {
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string; icon?: React.ReactNode }[]
}) {
  return (
    <div className="inline-flex w-full rounded-2xl border border-white/10 bg-black/40 p-1">
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={clsx(
              "flex-1 rounded-xl px-3 py-2 text-sm transition flex items-center justify-center gap-2",
              active
                ? "bg-gradient-to-r from-emerald-500/20 to-black text-white ring-1 ring-emerald-500/30"
                : "text-text-muted hover:text-white hover:bg-white/5"
            )}
          >
            {it.icon}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
  icon,
  right,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  icon?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            {icon ? <span className="opacity-70">{icon}</span> : null}
            <span className="truncate">{label}</span>
          </div>
          {hint ? (
            <div className="text-xs text-muted-foreground/80 mt-0.5 truncate">
              {hint}
            </div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  readOnly,
  placeholder,
  step,
  min,
  max,
}: {
  value: number | string
  onChange?: (v: number) => void
  readOnly?: boolean
  placeholder?: string
  step?: number
  min?: number
  max?: number
}) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      step={step}
      min={min}
      max={max}
      onChange={onChange ? (e) => onChange(Number(e.target.value)) : undefined}
      className={clsx(
        "control w-full",
        "hover:bg-black/50 focus:bg-black/60 transition",
        readOnly && "text-muted-foreground cursor-not-allowed opacity-80"
      )}
    />
  )
}

function AssetSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "control w-full text-left flex items-center justify-between",
          "hover:bg-black/50 focus:bg-black/60 transition"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xs">
            {value.slice(0, 2)}
          </span>
          <span className="font-medium">{value}</span>
        </span>
        <span className="text-xs text-muted-foreground">Change</span>
      </button>

      <SymbolPickerModal
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={(v: string) => {
          onChange(v)
          setOpen(false)
        }}
      />
    </>
  )
}

function KpiCard({
  title,
  value,
  sub,
  tone = "emerald",
}: {
  title: string
  value: string
  sub?: string
  tone?: "emerald" | "yellow" | "red" | "neutral"
}) {
  const toneCls =
    tone === "emerald"
      ? "from-emerald-500/15 border-emerald-500/30"
      : tone === "yellow"
      ? "from-yellow-500/15 border-yellow-500/30"
      : tone === "red"
      ? "from-red-500/15 border-red-500/30"
      : "from-white/10 border-white/10"

  const valueCls =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "yellow"
      ? "text-yellow-300"
      : tone === "red"
      ? "text-red-300"
      : "text-white"

  return (
    <div
      className={clsx(
        "min-w-0 rounded-2xl bg-gradient-to-br to-black border p-5 overflow-hidden",
        toneCls
      )}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className={clsx("mt-2 text-3xl font-semibold truncate", valueCls)}>
        {value}
      </div>
      {sub ? <div className="mt-4 text-sm text-muted-foreground">{sub}</div> : null}
    </div>
  )
}

function InlineNotice({
  icon,
  title,
  desc,
  tone = "neutral",
}: {
  icon: React.ReactNode
  title: string
  desc: string
  tone?: "neutral" | "warn"
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 bg-black/30",
        tone === "warn" ? "border-yellow-500/25" : "border-white/10"
      )}
    >
      <div className="flex gap-3">
        <div className={clsx("mt-0.5", tone === "warn" ? "text-yellow-300" : "text-text-muted")}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-sm text-muted-foreground mt-1">{desc}</div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function CalculatorsPage() {
  const [tab, setTab] = useState<"margin" | "position" | "prop">("margin")


  return (
    <div className="mx-auto max-w-[980px] px-6 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Trading Calculators</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Two calculators you’ll actually use. Clean inputs, clear outputs, no guessing.
        </p>

        <div className="max-w-xl">
          <Segmented
  value={tab}
  onChange={(v) => setTab(v as any)}
  items={[
    { value: "margin", label: "Margin", icon: <Gauge className="h-4 w-4" /> },
    { value: "position", label: "Position Size", icon: <Shield className="h-4 w-4" /> },
    { value: "prop", label: "Anti-Breach", icon: <TrendingUp className="h-4 w-4" /> },
  ]}
/>

        </div>
      </header>

      <AnimatePresence mode="wait">
  {tab === "margin" && (
    <motion.div key="margin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <MarginPanel />
    </motion.div>
  )}

  {tab === "position" && (
    <motion.div key="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PositionSizingPanel />
    </motion.div>
  )}

  {tab === "prop" && (
    <motion.div key="prop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PropCalculatorPanel />
    </motion.div>
  )}
</AnimatePresence>

    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Margin Requirement                               */
/* -------------------------------------------------------------------------- */

function MarginPanel() {
  const [symbol, setSymbol] = usePersistentState("calc.margin.symbol", "GBPUSD")
  const [balance, setBalance] = usePersistentState("calc.margin.balance", 200000)
  const [lot, setLot] = usePersistentState("calc.margin.lot", 1)
  const [leverage, setLeverage] = usePersistentState("calc.margin.leverage", 25)
  const [price, setPrice] = usePersistentState<number | null>("calc.margin.price", null)
  const [priceMode, setPriceMode] = usePersistentState<"auto" | "manual">(
    "calc.margin.priceMode",
    "auto"
  )
  const [priceStatus, setPriceStatus] = useState<"idle" | "live" | "stale">("idle")

  const isManualOnly = MANUAL_ONLY_SYMBOLS.has(symbol)

  function reset() {
    setSymbol("GBPUSD")
    setBalance(200000)
    setLot(1)
    setLeverage(25)
    setPrice(null)
    setPriceMode("auto")
  }

  useIdleReset(reset)

  /* ---------- price fetching logic unchanged ---------- */

  useEffect(() => {
    setPrice(null)
    setPriceStatus("idle")
    setPriceMode(isManualOnly ? "manual" : "auto")
  }, [symbol, isManualOnly])

  useEffect(() => {
    let alive = true
    if (isManualOnly || priceMode !== "auto") return

    async function load() {
      try {
        const r = await fetch(`/api/price?symbol=${symbol}`)
        const d = await r.json()
        if (!alive) return
        if (typeof d?.price === "number") {
          setPrice(d.price)
          setPriceStatus("live")
        } else {
          setPriceStatus("stale")
        }
      } catch {
        setPriceStatus("stale")
      }
    }

    load()
    const i = setInterval(load, 4000)
    return () => {
      alive = false
      clearInterval(i)
    }
  }, [symbol, priceMode, isManualOnly])

  const effectivePrice = price ?? 0
  const margin = useMemo(() => {
    if (!effectivePrice) return 0
    return (contractSize(symbol) * lot * effectivePrice) / leverage
  }, [effectivePrice, lot, leverage, symbol])

  const util = (margin / balance) * 100
  const utilTone: "emerald" | "yellow" | "red" =
  util < 10 ? "emerald" : util < 25 ? "yellow" : "red"


  const priceHint = isManualOnly
  ? "Indices require manual price."
  : priceMode === "auto"
  ? priceStatus === "live"
    ? "Live price (auto-updating)."
    : priceStatus === "stale"
    ? "Price feed unavailable — switch to manual."
    : "Fetching live price…"
  : "Manual price (you control it)."


  return (
  <TerminalCard title="Margin Requirement">
    <div className="flex items-center justify-between mb-4">
      <div />
      <ResetButton onReset={reset} />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr]
 gap-8">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
        <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
        {/* Left: Inputs */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Asset" hint={isManualOnly ? "Manual-price asset" : "Auto price available"} icon={<Calculator className="h-4 w-4" />}>
              <AssetSelector value={symbol} onChange={setSymbol} />
            </Field>

            <Field
              label="Market Price"
              hint={priceHint}
              icon={<TrendingUp className="h-4 w-4" />}
              right={
                <div className="flex items-center gap-2">
                  <TogglePill
                    on={priceMode === "auto"}
                    onToggle={() => setPriceMode((m) => (m === "auto" ? "manual" : "auto"))}
                    label={isManualOnly ? "Auto (disabled)" : priceMode === "auto" ? "Auto" : "Manual"}
                    disabled={isManualOnly}
                  />
                </div>
              }
            >
              <NumberInput
                value={price ?? ""}
                placeholder={isManualOnly || priceMode === "manual" ? "Enter price…" : "—"}
                onChange={
                  isManualOnly || priceMode === "manual"
                    ? (v) => {
                        setPrice(v)
                        setPriceStatus("idle")
                      }
                    : undefined
                }
                readOnly={!isManualOnly && priceMode === "auto"}
                step={0.0001}
              />
              <div className="mt-2">
                {isManualOnly ? (
                  <InlineNotice
                    tone="warn"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="No auto-feed for indices"
                    desc="When you switch between NAS100 / SPX500 / US30 the price field clears so you don’t accidentally reuse the previous symbol’s price."
                  />
                ) : null}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Balance" hint="Used for utilization %" icon={<Coins className="h-4 w-4" />}>
              <NumberInput value={balance} onChange={setBalance} step={100} min={0} />
            </Field>

            <Field label="Leverage" hint="1:x" icon={<Gauge className="h-4 w-4" />}>
              <NumberInput value={leverage} onChange={setLeverage} step={1} min={1} />
            </Field>

            <Field label="Lot Size" hint="Position volume" icon={<ArrowRightLeft className="h-4 w-4" />}>
              <NumberInput value={lot} onChange={setLot} step={0.01} min={0} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InlineNotice
              icon={<Percent className="h-4 w-4" />}
              title="How this is calculated"
              desc="Margin ≈ (Contract Size × Lots × Price) ÷ Leverage. Good for quick checks before you enter."
            />
            <InlineNotice
              icon={<Shield className="h-4 w-4" />}
              title="Prop-friendly habit"
              desc="Keep utilization low so you don’t get margin-pressured during drawdown spikes."
            />
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4 xl:sticky xl:top-24">
          <KpiCard title="Margin Required" value={fmtMoney(margin)} sub={`Utilization: ${util.toFixed(2)}%`} tone={utilTone} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard title="Contract Size" value={contractSize(symbol).toLocaleString()} sub="Units per 1.00 lot" tone="neutral" />
            <KpiCard
              title="Price Source"
              value={isManualOnly ? "Manual" : priceMode === "auto" ? "Auto" : "Manual"}
              sub={
                isManualOnly
                  ? "Indices"
                  : priceMode === "auto"
                  ? priceStatus === "live"
                    ? "Live"
                    : priceStatus === "stale"
                    ? "Stale"
                    : "Loading"
                  : "User input"
              }
              tone={isManualOnly ? "yellow" : priceMode === "auto" && priceStatus === "live" ? "emerald" : "neutral"}
            />
          </div>
        </div>
      </div>
    </TerminalCard>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Position Sizing                                    */
/* -------------------------------------------------------------------------- */

function PositionSizingPanel() {
  const [symbol, setSymbol] = usePersistentState("calc.pos.symbol", "GBPUSD")
  const [balance, setBalance] = usePersistentState("calc.pos.balance", 100000)
  const [riskPct, setRiskPct] = usePersistentState("calc.pos.riskPct", 1)
  const [entry, setEntry] = usePersistentState("calc.pos.entry", 1.3495)
  const [slPips, setSlPips] = usePersistentState("calc.pos.sl", 10)
  const [stopPrice, setStopPrice] = usePersistentState("calc.pos.stop", 1.3485)

  const lastEdited = useRef<"pips" | "price" | null>(null)

  function reset() {
    setSymbol("GBPUSD")
    setBalance(100000)
    setRiskPct(1)
    setEntry(1.3495)
    setSlPips(10)
    setStopPrice(1.3485)
  }

  useIdleReset(reset)

  const pipSize = pipSizeFor(symbol)
  const pipValue = pipValueFor(symbol)

  useEffect(() => {
    if (lastEdited.current === "pips") {
      setStopPrice(entry - slPips * pipSize)
    }
  }, [slPips, entry, pipSize])

  useEffect(() => {
    if (lastEdited.current === "price") {
      setSlPips(Math.abs(entry - stopPrice) / pipSize)
    }
  }, [stopPrice, entry, pipSize])

  const stopDistance = useMemo(
  () => Math.abs(entry - stopPrice),
  [entry, stopPrice]
)

  const riskAmount = balance * (riskPct / 100)
  const lotSize = slPips ? riskAmount / (slPips * pipValue) : 0

  return (
    
    
    <TerminalCard title="Position Size">
      
      <div className="flex items-center justify-between mb-4">
        
        <div />
        <ResetButton onReset={reset} />
      </div>
    <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr]
 gap-8">


        {/* Left: Inputs */}
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Asset" hint="Pip rules adapt per symbol" icon={<Calculator className="h-4 w-4" />}>
              <AssetSelector value={symbol} onChange={setSymbol} />
            </Field>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Risk Amount</div>
                <div className="text-sm text-muted-foreground">{riskPct.toFixed(2)}%</div>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white truncate">{fmtMoney(riskAmount)}</div>
              <div className="mt-3 text-xs text-muted-foreground">
                Based on balance and risk %. Useful when you’re sizing quickly.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Account Balance" hint="USD" icon={<Coins className="h-4 w-4" />}>
              <NumberInput value={balance} onChange={setBalance} step={100} min={0} />
            </Field>

            <Field label="Risk per Trade" hint="%" icon={<Percent className="h-4 w-4" />}>
              <NumberInput value={riskPct} onChange={setRiskPct} step={0.1} min={0} max={100} />
            </Field>

            <Field
              label="Stop Distance"
              hint="Entry ↔ Stop"
              icon={<ArrowRightLeft className="h-4 w-4" />}
            >
              <NumberInput value={stopDistance} readOnly />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Entry Price" hint="Your planned entry">
              <NumberInput value={entry} onChange={setEntry} step={pipSize} />
            </Field>

            <Field label={MANUAL_ONLY_SYMBOLS.has(symbol) ? "SL (Points)" : "SL (Pips)"} hint="Edit this or Stop Price">
              <NumberInput
                value={slPips}
                onChange={(v) => {
                  lastEdited.current = "pips"
                  setSlPips(v)
                }}
                step={0.1}
                min={0}
              />
            </Field>

            <Field label="Stop Price" hint="Auto-syncs with SL input">
              <NumberInput
                value={stopPrice}
                onChange={(v) => {
                  lastEdited.current = "price"
                  setStopPrice(v)
                }}
                step={pipSize}
              />
            </Field>
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4 xl:sticky xl:top-24">
          <KpiCard
            title="Suggested Lot Size"
            value={isFinite(lotSize) ? lotSize.toFixed(2) : "0.00"}
            sub={`Risking ${riskPct}% of account`}
            tone="emerald"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Pip Size"
              value={pipSize.toString()}
              sub={symbol.endsWith("JPY") ? "JPY pair" : symbol === "XAUUSD" ? "Gold" : "FX / other"}
              tone="neutral"
            />
            <KpiCard
              title="Pip Value"
              value={`${pipValue.toString()}`}
              sub="Per 1.00 lot (approx)"
              tone="neutral"
            />
          </div>

          <InlineNotice
            icon={<Shield className="h-4 w-4" />}
            title="Quick check"
            desc="If your stop widens, lot size drops automatically (and vice versa). Keeps risk consistent."
          />
        </div>
      </div>
    </TerminalCard>
  )
}
function PropCalculatorPanel() {
  const [account, setAccount] = usePersistentState("calc.prop.account", 100000)
  const [leverage, setLeverage] = usePersistentState("calc.prop.leverage", 50)
  const [symbol, setSymbol] = usePersistentState("calc.prop.symbol", "XAUUSD")
  const [riskPct, setRiskPct] = usePersistentState("calc.prop.risk", 0.5)
  const [slPips, setSlPips] = usePersistentState("calc.prop.sl", 15)

  function reset() {
    setAccount(100000)
    setLeverage(50)
    setSymbol("XAUUSD")
    setRiskPct(0.5)
    setSlPips(15)
  }

  useIdleReset(reset)

  const pipValue = pipValueFor(symbol)
  const riskAmount = account * (riskPct / 100)
  const lotSize = slPips ? riskAmount / (slPips * pipValue) : 0

  // assume average price for margin estimate
  const assumedPrice =
    symbol === "XAUUSD" ? 2000 : symbol === "NAS100" ? 17000 : 1.25

  const margin =
    (contractSize(symbol) * lotSize * assumedPrice) / leverage

  const utilization = (margin / account) * 100
  const utilTone =
    utilization < 10 ? "emerald" : utilization < 25 ? "yellow" : "red"

  return (
    <TerminalCard title="Anti-Breach Risk Template (Recommended)">
      <div className="flex items-center justify-between mb-4">
        
        <div />
        <ResetButton onReset={reset} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-8">
        {/* LEFT */}
        <div className="space-y-6">
          <OptionGroup
            label="Account Size"
            value={account}
            options={[10000, 50000, 100000, 200000]}
            onChange={setAccount}
          />

          <div className="flex items-center gap-2">
  <OptionGroup
    label={
      <span className="flex items-center gap-2">
        Leverage
        <InfoTooltip text="Always double-check the leverage offered by your specific prop firm. Incorrect leverage assumptions can lead to inaccurate margin and lot size recommendations." />
      </span>
    }
    value={leverage}
    options={[15, 30, 50, 100]}
    onChange={setLeverage}
  />
</div>


<OptionGroup
  label="Symbol"
  value={symbol}
  options={["XAUUSD", "NAS100", "GBPUSD", "EURUSD"]}
  disabledOptions={["XAUUSD", "NAS100"]}
  onChange={setSymbol}
/>

  

          <OptionGroup
            label="Risk %"
            value={riskPct}
            options={[0.3, 0.5, 1.0, 1.5]}
            onChange={setRiskPct}
          />

          <OptionGroup
            label="Stop Loss (pips)"
            value={slPips}
            options={[10, 15, 20, 25]}
            onChange={setSlPips}
          />

          <InlineNotice
            icon={<Shield className="h-4 w-4" />}
            title="Why presets?"
            desc="These are prop-friendly defaults that avoid margin pressure and over-risking."
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-4 xl:sticky xl:top-24">
          <KpiCard
            title="Suggested Lot Size"
            value={isFinite(lotSize) ? lotSize.toFixed(2) : "0.00"}
            sub={`Risking ${riskPct}%`}
            tone="emerald"
          />

          <KpiCard
            title="Margin Required"
            value={fmtMoney(margin)}
            sub={`Utilization ${utilization.toFixed(2)}%`}
            tone={utilTone}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Pip Value"
              value={pipValue.toString()}
              sub="Per 1.00 lot"
              tone="neutral"
            />
            <KpiCard
              title="Contract Size"
              value={contractSize(symbol).toLocaleString()}
              sub="Units"
              tone="neutral"
            />
          </div>
        </div>
      </div>
    </TerminalCard>
  )
}
