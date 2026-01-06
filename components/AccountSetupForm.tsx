"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"
import TerminalCard from "@/components/TerminalCard"
import { PROP_FIRM_RULESETS } from "@/lib/prop-firms"
import { useMT5Store } from "@/lib/mt5Store"
import { useToastStore } from "@/lib/toastStore"


type Props = {
  editMode?: boolean
  onDone?: () => void
}

export default function AccountSetupForm({
  editMode = false,
  onDone,
}: Props) {
  const router = useRouter()

  const account = useMT5Store((s) =>
    s.accounts.find((a) => a.id === s.activeAccountId)
  )
  const updateAccount = useMT5Store((s) => s.addOrUpdateAccount)

  const [firmKey, setFirmKey] = useState("")
  const [program, setProgram] = useState("")
  const [phase, setPhase] = useState("")
  const [accountSize, setAccountSize] = useState(0)
  const [saving, setSaving] = useState(false)

  /* ------------------------------
     INIT FROM ACCOUNT
  ------------------------------ */
  useEffect(() => {
    if (!account) return
    if (account.firmKey) setFirmKey(account.firmKey)
    if (account.program) setProgram(account.program)
    if (account.phase) setPhase(account.phase)
    if (account.accountSize) setAccountSize(account.accountSize)
  }, [account])

  /* ------------------------------
     OPTIONS
  ------------------------------ */
  const firmOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of PROP_FIRM_RULESETS) {
      map.set(r.firmKey, r.firmName)
    }
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }))
  }, [])

  const programOptions = useMemo(() => {
    if (!firmKey) return []
    return Array.from(
      new Set(
        PROP_FIRM_RULESETS
          .filter((r) => r.firmKey === firmKey)
          .map((r) => r.program)
      )
    )
  }, [firmKey])

  const phaseOptions = useMemo(() => {
    if (!firmKey || !program) return []
    return Array.from(
      new Set(
        PROP_FIRM_RULESETS
          .filter(
            (r) => r.firmKey === firmKey && r.program === program
          )
          .map((r) => r.phase)
      )
    )
  }, [firmKey, program])

  const sizeOptions = useMemo(() => {
    if (!firmKey || !program || !phase) return []
    return Array.from(
      new Set(
        PROP_FIRM_RULESETS
          .filter(
            (r) =>
              r.firmKey === firmKey &&
              r.program === program &&
              r.phase === phase
          )
          .map((r) => r.accountSize)
      )
    ).sort((a, b) => a - b)
  }, [firmKey, program, phase])

  /* ------------------------------
     DEFAULTS (ONBOARDING)
  ------------------------------ */
  useEffect(() => {
    if (!editMode && !firmKey && firmOptions.length) {
      setFirmKey(firmOptions[0].key)
    }
  }, [editMode, firmKey, firmOptions])

  useEffect(() => {
    if (!editMode && !program && programOptions.length) {
      setProgram(programOptions[0])
    }
  }, [editMode, program, programOptions])

  useEffect(() => {
    if (!editMode && !phase && phaseOptions.length) {
      setPhase(phaseOptions[0])
    }
  }, [editMode, phase, phaseOptions])

  useEffect(() => {
    if (!editMode && !accountSize && sizeOptions.length) {
      setAccountSize(sizeOptions[0])
    }
  }, [editMode, accountSize, sizeOptions])

  /* ------------------------------
     CONFIRM
  ------------------------------ */
  async function confirm() {
    if (!account) return

    try {
        setSaving(true)

        const res = await fetch("/api/accounts/confirm-ruleset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            accountId: account.id,
            firmKey,
            program,
            phase,
            accountSize,
        }),
        })

        const data = await res.json()
        if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? "Failed to save ruleset")
        }

        updateAccount({
        id: account.id,
        firmKey,
        program,
        phase,
        accountSize,
        rulesConfirmed: true,
        })

        useToastStore.getState().pushToast({
        title: "Account setup updated",
        description: "Changes applied immediately.",
        })

        if (editMode) {
        onDone?.()
        } else {
        router.replace("/app/fundamentals")
        }
    } catch (err: any) {
        useToastStore.getState().pushToast({
        title: "Failed to save account setup",
        description: err.message ?? "Unexpected error",
        })
    } finally {
        setSaving(false)
    }
    }


  /* ------------------------------
     SHARED FORM CONTENT
  ------------------------------ */
  const Form = (
    <div className="space-y-6">
      <div className="text-sm text-text-muted">
        {editMode
          ? "Update your prop firm configuration. Changes apply immediately."
          : "Confirm your prop firm rules so we can track risk correctly."}
      </div>

      <div className="grid gap-5">
        {/* Firm */}
        <div>
          <div className="mb-1 text-xs text-text-muted">Prop firm</div>
          <select
            className="w-full rounded-md bg-bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400"
            value={firmKey}
            onChange={(e) => {
              setFirmKey(e.target.value)
              setProgram("")
              setPhase("")
              setAccountSize(0)
            }}
          >
            {firmOptions.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Program + Phase */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-xs text-text-muted">Program</div>
            <select
              className="w-full rounded-md bg-bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400"
              value={program}
              onChange={(e) => {
                setProgram(e.target.value)
                setPhase("")
                setAccountSize(0)
              }}
            >
              {programOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs text-text-muted">Phase</div>
            <select
              className="w-full rounded-md bg-bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400"
              value={phase}
              onChange={(e) => {
                setPhase(e.target.value)
                setAccountSize(0)
              }}
            >
              {phaseOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Size */}
        <div>
          <div className="mb-1 text-xs text-text-muted">Account size</div>
          <select
            className="w-full rounded-md bg-bg-secondary px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-400"
            value={accountSize}
            onChange={(e) => setAccountSize(Number(e.target.value))}
          >
            {sizeOptions.map((s) => (
              <option key={s} value={s}>
                {s.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <GlowButton
          onClick={confirm}
          disabled={saving}
          className="w-full justify-center"
        >
          {saving
            ? "Saving..."
            : editMode
            ? "Save changes"
            : "Confirm rules & continue"}
        </GlowButton>
      </div>
    </div>
  )

  /* ------------------------------
     RENDER
  ------------------------------ */
  if (editMode) {
    // ✅ CLEAN MODAL PANEL (no thick border)
    return (
      <div className="w-full max-w-md rounded-xl bg-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-white">
          Edit account setup
        </h2>
        <div className="mt-4">{Form}</div>
      </div>
    )
  }

  // ✅ ONBOARDING (keeps TerminalCard)
  return (
    <div className="w-full max-w-lg">
      <TerminalCard title="Account setup">
        {Form}
      </TerminalCard>
    </div>
  )
}
