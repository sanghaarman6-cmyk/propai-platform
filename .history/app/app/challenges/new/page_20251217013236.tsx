"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import GlowButton from "@/components/GlowButton"
import { useToastStore } from "@/lib/toastStore"
import { useAppStore } from "@/lib/store"
import type { Challenge, ChallengeRules, FirmTemplate } from "@/lib/types"

function usd(n: number) {
  return `$${Math.round(n).toLocaleString()}`
}

function pctToUsd(accountSize: number, pct: number) {
  return (accountSize * pct) / 100
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function NewChallengePage() {
  const router = useRouter()
  const { pushToast } = useToastStore()
  const { firmTemplates, addChallenge } = useAppStore()

  const [selectedFirmId, setSelectedFirmId] = useState<string>(firmTemplates[0]?.id ?? "")
  const selectedFirm = useMemo<FirmTemplate | null>(
    () => firmTemplates.find((f) => f.id === selectedFirmId) ?? null,
    [firmTemplates, selectedFirmId]
  )

  const [customFirmName, setCustomFirmName] = useState("Custom Firm")
  const [name, setName] = useState("New Challenge")
  const [phase, setPhase] = useState<Challenge["phase"]>("Phase 1")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10))

  const baseRules = selectedFirm?.defaultRules ?? {
    accountSize: 50000,
    profitTargetPct: 8,
    dailyLossLimitPct: 2,
    maxLossLimitPct: 6,
    minTradingDays: 5,
    timeLimitDays: 30,
    leverage: "1:30",
    instrumentsAllowed: ["NQ", "ES"],
  }

  const [rules, setRules] = useState<ChallengeRules>({ ...baseRules })
  const [instrumentsInput, setInstrumentsInput] = useState(rules.instrumentsAllowed.join(", "))

  // When firm changes, update rules defaults (investor-demo feel)
  function applyTemplateDefaults(f: FirmTemplate | null) {
    if (!f) return
    const next = { ...f.defaultRules }
    setRules(next)
    setInstrumentsInput(next.instrumentsAllowed.join(", "))
  }

  const computed = useMemo(() => {
    const account = rules.accountSize || 0
    const profitTargetUsd = pctToUsd(account, rules.profitTargetPct || 0)
    const dailyLossUsd = pctToUsd(account, rules.dailyLossLimitPct || 0)
    const maxLossUsd = pctToUsd(account, rules.maxLossLimitPct || 0)

    return {
      profitTargetUsd,
      dailyLossUsd,
      maxLossUsd,
    }
  }, [rules])

  function setRule<K extends keyof ChallengeRules>(key: K, value: ChallengeRules[K]) {
    setRules((r) => ({ ...r, [key]: value }))
  }

  function onSave() {
    const firmIsCustom = selectedFirmId === "custom"
    const firmName = firmIsCustom ? customFirmName.trim() : (selectedFirm?.name ?? "Unknown Firm")

    const instruments = instrumentsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (!name.trim()) {
      pushToast({ title: "Missing name", description: "Give this challenge a name." })
      return
    }

    if (!firmName) {
      pushToast({ title: "Missing firm", description: "Select or name a firm." })
      return
    }

    if (rules.accountSize <= 0) {
      pushToast({ title: "Invalid account size", description: "Account size must be > 0." })
      return
    }

    const newChallenge: Challenge = {
      id: makeId("c"),
      firmId: firmIsCustom ? "f_custom" : (selectedFirm?.id ?? "f_unknown"),
      firmName,
      name: name.trim(),
      phase,
      status: "in_progress",
      startDateISO: new Date(`${startDate}T09:00:00Z`).toISOString(),
      rules: {
        ...rules,
        instrumentsAllowed: instruments.length ? instruments : rules.instrumentsAllowed,
      },
      stats: {
        pnlUsd: 0,
        pnlPct: 0,
        winRate: 0,
        profitFactor: 0,
        maxDrawdownPct: 0,
        consistencyScore: 75,
        ruleRiskScore: 35,
        tradingDaysCompleted: 0,
      },
      live: {
        equityUsd: rules.accountSize,
        dailyLossRemainingUsd: computed.dailyLossUsd,
        maxLossBufferUsd: computed.maxLossUsd,
        profitTargetRemainingUsd: computed.profitTargetUsd,
        timeRemainingDays: rules.timeLimitDays,
      },
      timeline: [],
      violations: [],
    }

    addChallenge(newChallenge)
    pushToast({
      title: "Challenge created",
      description: `${firmName} · ${phase} · ${usd(rules.accountSize)}`,
    })
    router.push("/app/challenges")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-text-muted">Challenges</div>
          <h1 className="text-2xl font-semibold">Add / Edit Challenge</h1>
          <div className="mt-1 text-sm text-text-muted">
            Use templates or custom rules. The Rule Engine Preview shows real thresholds.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/app/challenges")}
            className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded bg-accent-green px-4 py-2 text-black hover:shadow-glow"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <TerminalCard title="Basics">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-text-muted">Firm template</div>
                <select
                  value={selectedFirmId}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedFirmId(v)
                    if (v !== "custom") {
                      const f = firmTemplates.find((x) => x.id === v) ?? null
                      applyTemplateDefaults(f)
                    }
                  }}
                  className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                >
                  {firmTemplates.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                  <option value="custom">Custom firm…</option>
                </select>

                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedFirm?.tags ?? []).map((t) => (
                    <TagPill key={t}>{t}</TagPill>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-text-muted">Challenge name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                />
              </div>

              {selectedFirmId === "custom" && (
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs text-text-muted">Custom firm name</div>
                  <input
                    value={customFirmName}
                    onChange={(e) => setCustomFirmName(e.target.value)}
                    className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <div className="mb-1 text-xs text-text-muted">Phase</div>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as any)}
                  className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                >
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Funded">Funded</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-text-muted">Start date</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                />
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Rules">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldNumber
                label="Account size (USD)"
                value={rules.accountSize}
                onChange={(v) => setRule("accountSize", v)}
              />
              <FieldText
                label="Leverage"
                value={rules.leverage}
                onChange={(v) => setRule("leverage", v)}
              />

              <FieldNumber
                label="Profit target (%)"
                value={rules.profitTargetPct}
                onChange={(v) => setRule("profitTargetPct", v)}
              />
              <FieldNumber
                label="Daily loss limit (%)"
                value={rules.dailyLossLimitPct}
                onChange={(v) => setRule("dailyLossLimitPct", v)}
              />

              <FieldNumber
                label="Max loss limit (%)"
                value={rules.maxLossLimitPct}
                onChange={(v) => setRule("maxLossLimitPct", v)}
              />
              <FieldNumber
                label="Min trading days"
                value={rules.minTradingDays}
                onChange={(v) => setRule("minTradingDays", v)}
              />

              <FieldNumber
                label="Time limit (days)"
                value={rules.timeLimitDays}
                onChange={(v) => setRule("timeLimitDays", v)}
              />

              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-text-muted">Instruments allowed (comma separated)</div>
                <input
                  value={instrumentsInput}
                  onChange={(e) => setInstrumentsInput(e.target.value)}
                  className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
                />
                <div className="mt-2 text-xs text-text-muted">
                  Example: <span className="font-mono">NQ, ES, MNQ</span>
                </div>
              </div>
            </div>
          </TerminalCard>

          <div className="flex justify-end">
            <button
              onClick={onSave}
              className="rounded bg-accent-green px-4 py-2 text-black hover:shadow-glow"
            >
              Save challenge
            </button>
          </div>
        </div>

        {/* Right: Rule engine preview */}
        <div className="space-y-6">
          <TerminalCard title="Rule Engine Preview">
            <div className="space-y-4">
              <PreviewRow
                label="Profit target"
                left={`${rules.profitTargetPct}%`}
                right={usd(computed.profitTargetUsd)}
              />
              <PreviewRow
                label="Daily loss limit"
                left={`${rules.dailyLossLimitPct}%`}
                right={usd(computed.dailyLossUsd)}
              />
              <PreviewRow
                label="Max loss limit"
                left={`${rules.maxLossLimitPct}%`}
                right={usd(computed.maxLossUsd)}
              />
              <div className="rounded border border-border bg-black/30 p-3 text-xs text-text-muted">
                This preview is what makes PropGuru “prop-firm aware”: every coaching note can reference these thresholds
                in real dollars.
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Quality Checks">
            <div className="space-y-2 text-sm">
              <CheckLine ok={rules.dailyLossLimitPct < rules.maxLossLimitPct} text="Daily loss < Max loss" />
              <CheckLine ok={rules.minTradingDays <= rules.timeLimitDays} text="Min days ≤ Time limit" />
              <CheckLine ok={rules.accountSize > 0} text="Account size valid" />
              <CheckLine ok={(rules.instrumentsAllowed?.length ?? 0) > 0 || instrumentsInput.length > 0} text="Instruments provided" />
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-border bg-black/30 p-3">
      <div>
        <div className="text-xs text-text-muted">{label}</div>
        <div className="font-mono text-sm">{left}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-text-muted">USD</div>
        <div className="font-mono text-sm text-accent-green">{right}</div>
      </div>
    </div>
  )
}

function CheckLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-border bg-black/30 p-3">
      <div>{text}</div>
      <span className={`font-mono text-xs ${ok ? "text-accent-green" : "text-accent-amber"}`}>
        {ok ? "OK" : "CHECK"}
      </span>
    </div>
  )
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
      />
    </div>
  )
}

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-border bg-black px-3 py-2 text-sm"
      />
    </div>
  )
}
