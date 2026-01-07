"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useMT5Store } from "@/lib/mt5Store"
import Modal from "@/components/Modal"
import MT5ConnectPage from "@/components/MT5ConnectPage"
import ConfirmModal from "@/components/ConfirmModal"
import AccountSetupForm from "@/components/AccountSetupForm"
import { supabase } from "@/lib/supabase/client"
import clsx from "clsx"

export default function AccountsPage() {
  const accounts = useMT5Store((s) => s.accounts)
  const removeAccount = useMT5Store((s) => s.removeAccount)
  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectSuccess, setConnectSuccess] = useState(false)

  const account = accounts[0]

  /* ------------------------------------------------------------------
     HYDRATE
  ------------------------------------------------------------------ */
  async function hydrateAccounts() {
  const { data } = await supabase.auth.getUser()
  if (!data?.user?.id) return

  const res = await fetch(`/api/accounts?userId=${data.user.id}`, {
    cache: "no-store",
  })
  if (!res.ok) return

  const json = await res.json()
  if (!json?.accounts) return

  for (const row of json.accounts) {
    addOrUpdateAccount({
      id: row.id,
      label: row.label,
      login: row.login,
      server: row.server,
      balance: row.balance,
      equity: row.equity,
      currency: row.currency,
      firmName: row.firm_name,
      firmKey: row.firm_key,
      program: row.program,
      phase: row.phase,
      accountSize: row.account_size,
      rulesConfirmed: row.rules_confirmed,
    })
  }
}

useEffect(() => {
  hydrateAccounts().finally(() => setLoading(false))
}, [])



  /* ------------------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
          <div className="text-sm text-text-muted tracking-wide">
            
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------
     UI
  ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-bg-primary px-6 py-10 md:px-10">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute top-44 left-1/3 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />
                <div className="absolute right-[-220px] top-[120px] h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-[30%] top-[65%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl space-y-10"
      >
        {/* HEADER */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">
            Trading Infrastructure
          </h1>
          <p className="text-sm text-text-muted">
            Single-account mode • MetaTrader 5
          </p>

          <p className="flex items-center gap-2 text-xs text-text-muted">
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                account ? "bg-emerald-400" : "bg-white/30"
              )}
            />
            {account
              ? "1 account connected (limit reached)"
              : "No account connected"}
          </p>
        </header>

        {/* CONNECTION SECTION */}
        <section className="rounded-xl border border-white/5 bg-bg-secondary">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-white">
                Account Connection
              </h2>
              <p className="text-xs text-text-muted">
                Connect one MT5 account to power analytics, rules, and AI.
              </p>
            </div>

            <button
              disabled={!!account}
              onClick={() => setShowAddModal(true)}
              className={clsx(
                "self-start rounded-md px-4 py-2 text-sm font-medium transition md:self-auto",
                account
                  ? "cursor-not-allowed bg-emerald-500/10 text-emerald-300/60"
                  : "bg-emerald-500/90 text-black hover:bg-emerald-500"
              )}
            >
              {account ? "Account limit reached" : "Connect MT5 account"}
            </button>
          </div>

          <div className="border-t border-white/5" />

          {!account && (
            <div className="p-6 text-sm text-text-muted">
              No account connected. Once connected, this account will be used
              across the entire platform.
            </div>
          )}

          {account && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-white">
                  {account.label || account.firmName || "Trading Account"}
                </p>
                <p className="text-xs text-text-muted">
                  Login {account.login} • {account.server}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-text-muted">Balance</p>
                  <p className="text-white">
                    {account.balance?.toLocaleString()} {account.currency}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Equity</p>
                  <p className="text-white">
                    {account.equity?.toLocaleString()} {account.currency}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteId(account.id)}
                  className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/15"
                >
                  Disconnect account
                </button>
              </div>
            </div>
          )}
        </section>
      </motion.div>

      {/* ADD ACCOUNT MODAL */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setConnectSuccess(false)
        }}
      >
        {!connectSuccess ? (
          <MT5ConnectPage
            onSuccess={async () => {
              await hydrateAccounts()
              setConnectSuccess(true)
            }}
          />
        ) : (
          <div className="w-[420px] p-6 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-white">
              Account connected
            </h3>

            <p className="text-sm text-text-muted">
              Your MetaTrader 5 account was added successfully.
            </p>

            <button
              onClick={() => {
                setShowAddModal(false)
                setConnectSuccess(false)
              }}
              className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-500/90"
            >
              Done
            </button>
          </div>
        )}
      </Modal>


      {/* EDIT SETUP MODAL */}
      <Modal open={showSetupModal} onClose={() => setShowSetupModal(false)}>
        <AccountSetupForm
          editMode
          onDone={() => setShowSetupModal(false)}
        />
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={!!deleteId}
        title="Disconnect trading account?"
        description="You can reconnect a different account at any time."
        confirmText="Disconnect"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return

          try {
            const { data } = await supabase.auth.getUser()
            if (!data?.user?.id) return

            // 1️⃣ DELETE TRADES FIRST (by account_id)
            const { error: tradesErr } = await supabase
              .from("trades")
              .delete()
              .eq("account_id", deleteId)
              .eq("user_id", data.user.id)

            if (tradesErr) {
              console.error("Failed to delete trades:", tradesErr.message)
              return
            }

            // 2️⃣ DELETE ACCOUNT
            const { error: accountErr } = await supabase
              .from("trading_accounts")
              .delete()
              .eq("id", deleteId)
              .eq("user_id", data.user.id)

            if (accountErr) {
              console.error("Failed to delete account:", accountErr.message)
              return
            }

            // 3️⃣ UPDATE CLIENT STATE
            removeAccount(deleteId)
            setActiveAccount(null)
          } finally {
            setDeleteId(null)
          }
        }}
      ></ConfirmModal>
    </div>
  )
}
