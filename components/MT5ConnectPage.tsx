"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useMT5Store } from "@/lib/mt5Store"
import GlowButton from "@/components/GlowButton"
import { Eye, EyeOff } from "lucide-react"

/* ------------------------------------------------------------------
   UI-ONLY BROKER → SERVER MAP
   (You can expand this anytime without backend changes)
------------------------------------------------------------------- */
const BROKERS: Record<string, string[]> = {
    "IC Markets": [
    "ICMarketsEU-MT5",
    "ICMarketsEU-MT5-2",
    "ICMarketsEU-MT5-4",
    "ICMarketsEU-MT5-5",

    "ICMarketsSC-MT5",
    "ICMarketsSC-MT5-2",
    "ICMarketsSC-MT5-4",
    "ICMarketsSC-Demo",
    "ICMarketsSC-Demo03",

    "ICMarketsAU-Live",
    "ICMarketsAU-Demo",

    "ICMarketsKE-MT5-7",
    "ICMarketsKE-Demo",

    "ICMarketsGRP-MT5",
    "ICMarketsGRP-Demo",

    "ICMarketsInternational-MT5",
    "ICMarketsInternational-MT5-2",
    "ICMarketsInternational-MT5-4",
    "ICMarketsInternational-Demo",

    "ICMarkets-MT5",
    "ICMarkets-MT5-2",
    "ICMarkets-MT5-4",
    "ICMarkets-Demo"
  ],
  "Vantage Markets": [
    "VantageGlobalPrimeAU-Live",
    "VantageGlobalPrimeAU-Demo",

    "VantageGlobalPrimeLLP-Live",
    "VantageGlobalPrimeLLP-Live 2",
    "VantageGlobalPrimeLLP-Demo",

    "VantagePrimeLimited-Live",

    "VantageFX-Live",
    "VantageFX-Live 6",
    "VantageFX-Demo",

    "VantageInternational-Live",
    "VantageInternational-Live 2",
    "VantageInternational-Live 3",
    "VantageInternational-Live 4",
    "VantageInternational-Live 5",
    "VantageInternational-Live 6",
    "VantageInternational-Live 7",
    "VantageInternational-Live 8",
    "VantageInternational-Live 10",
    "VantageInternational-Live 11",
    "VantageInternational-Live 13",

    "VantageInternational-Demo"
  ],
    "Exness Technologies": [
    // ===== Core MT5 REAL =====
    "Exness-MT5Real",
    "Exness-MT5Real2",
    "Exness-MT5Real3",
    "Exness-MT5Real5",
    "Exness-MT5Real6",
    "Exness-MT5Real7",
    "Exness-MT5Real8",
    "Exness-MT5Real9",
    "Exness-MT5Real10",
    "Exness-MT5Real11",
    "Exness-MT5Real12",
    "Exness-MT5Real15",
    "Exness-MT5Real17",
    "Exness-MT5Real18",
    "Exness-MT5Real19",
    "Exness-MT5Real20",
    "Exness-MT5Real21",
    "Exness-MT5Real22",
    "Exness-MT5Real23",
    "Exness-MT5Real24",
    "Exness-MT5Real25",
    "Exness-MT5Real26",
    "Exness-MT5Real27",
    "Exness-MT5Real28",
    "Exness-MT5Real29",
    "Exness-MT5Real30",
    "Exness-MT5Real31",
    "Exness-MT5Real32",
    "Exness-MT5Real33",
    "Exness-MT5Real34",
    "Exness-MT5Real35",
    "Exness-MT5Real36",
    "Exness-MT5Real37",
    "Exness-MT5Real38",
    "Exness-MT5Real39",

    // ===== SC (Seychelles) =====
    "ExnessSC-MT5Real",
    "ExnessSC-MT5Real2",
    "ExnessSC-MT5Real3",
    "ExnessSC-MT5Real12",
    "ExnessSC-MT5Real15",

    // ===== BV =====
    "ExnessBV-MT5Real",
    "ExnessBV-MT5Real2",
    "ExnessBV-MT5Real3",
    "ExnessBV-MT5Real15",

    // ===== VG =====
    "ExnessVG-MT5Real",
    "ExnessVG-MT5Real3",
    "ExnessVG-MT5Real15",

    // ===== KE =====
    "ExnessKE-MT5Real9",
    "ExnessKE-MT5Real10",

    // ===== CY =====
    "ExnessCY-LP_Real1",

    // ===== Investment Bank =====
    "ExnessInvestmentBank-MT5Real15",

    // ===== TRIAL / DEMO =====
    "Exness-MT5Trial",
    "Exness-MT5Trial2",
    "Exness-MT5Trial3",
    "Exness-MT5Trial5",
    "Exness-MT5Trial6",
    "Exness-MT5Trial7",
    "Exness-MT5Trial8",
    "Exness-MT5Trial9",
    "Exness-MT5Trial10",
    "Exness-MT5Trial11",
    "Exness-MT5Trial12",
    "Exness-MT5Trial14",
    "Exness-MT5Trial15",
    "Exness-MT5Trial16",
    "Exness-MT5Trial17",

    // ===== SC TRIAL =====
    "ExnessSC-MT5Trial6",
    "ExnessSC-MT5Trial7",

    // ===== BV TRIAL =====
    "ExnessBV-MT5Trial6",

    // ===== VG TRIAL =====
    "ExnessVG-MT5Trial6"
  ],
    "Pepperstone": [
    "Pepperstone-MT5-Live01",
    "PepperstoneUK-Live",
    "PepperstoneUK-Demo"
  ],
    "IG Markets": [
    "IG-LIVE",
    "IG-Demo"
  ],
  "Darwinex": [
  "Darwinex-Live",
  "Darwinex-Demo"
],
"Funding Pips": [
  "FundingPips2-SIM",
  "FundingPips-Real"
],
"FundedNext": [
  "FundedNext-Server",
  "FundedNext-Server 2",
  "FundedNext-Server 3",
  "FundedNext-Server 4"
],
"ACG Markets": [
  "ACGMarkets-Main",
  "ACGMarkets-Live",
  "ACGMarkets-Demo"
],
"FunderPro": [
  "FunderPro-Live01"
],
"Quant Tekel": [
  "QuantTekel-Server",
  "QuantTekel-Demo"
],
"FTMO": [
  "FTMO-Server",
  "FTMO-Server2",
  "FTMO-Server3",
  "FTMO-Server4",
  "FTMO-Server5",
  "FTMO-Demo",
  "FTMO-Demo2"
],
/* =========================
     Five Percent Online (5ers)
  ========================== */
  "Five Percent Online (5ers)": [
    "FivePercentOnline-Real",
    "FivePercentOnline-Experience"
  ],

  /* =========================
     Blueberry Markets
  ========================== */
  "Blueberry Markets": [
    "BlueberryMarkets-Live",
    "BlueberryMarkets-Live02",
    "BlueberryMarkets-Live3",
    "BlueberryMarkets-Demo",
    "BlueberryMarkets-Demo02"
  ],

  /* =========================
     BrightFunded
  ========================== */
  "BrightFunded": [
    "BrightFunded-Server"
  ],

  /* =========================
     E8 Funding
  ========================== */
  "E8 Funding": [
    "E8Markets-Server",
    "E8Funding-Demo"
  ],

  /* =========================
     Goat Funded
  ========================== */
  "Goat Funded": [
    "GoatFunded-Server"
  ],

  /* =========================
     MavenTrade Limited
  ========================== */
  "MavenTrade Limited": [
    "MavenTrade-Server"
  ],

  /* =========================
     OANDA
  ========================== */
  "OANDA": [
    "OANDA-Live-1",
    "OANDATMS-MT5",
    "OANDA-OGM MT5 Live",
    "OANDA-Labs Trader",
    "OANDA-UK-Live-1",
    "OANDA-UK-Demo-1",
    "OANDA-Prop Trader",
    "OANDA-Japan MT5 Live",
    "OANDA-Japan MT5 Demo",
    "OANDA-Demo-1"
  ],
  /* =========================
     Seacrest Markets
  ========================== */
  "Seacrest Markets": [
    "SeacrestMarkets-MT5"
  ],

  /* =========================
     AquaFunded
  ========================== */
  "AquaFunded": [
    "AquaFunded-Server"
  ],

  /* =========================
     ThinkMarkets
  ========================== */
  "ThinkMarkets": [
    "ThinkMarkets-Live",
    "ThinkMarkets-Demo"
  ],

  /* =========================
     Blue Guardian
  ========================== */
  "Blue Guardian": [
    "BlueGuardian-Server"
  ],

  /* =========================
     AXI Financial Services
  ========================== */
  "AXI Financial Services": [
    "Axi-US50-Demo",
    "Axi-US51-Live",
    "Axi-US50-Live",
    "OneFinancialMarkets-US48-Live",
    "OneFinancialMarkets-Demo"
  ],
}

type MT5ConnectPageProps = {
  onSuccess?: () => void
}

export default function MT5ConnectPage({ onSuccess }: MT5ConnectPageProps) {
  const bumpRefresh = useMT5Store((s) => s.bumpRefresh)
  const addOrUpdateAccount = useMT5Store((s) => s.addOrUpdateAccount)
  const setActiveAccount = useMT5Store((s) => s.setActiveAccount)
  const router = useRouter()
  const [isBrokerOpen, setIsBrokerOpen] = useState(false)
  const [isServerOpen, setIsServerOpen] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [label, setLabel] = useState("")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")

  /* 🔽 NEW UI-ONLY STATES */
  const [broker, setBroker] = useState("")
  const [server, setServer] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ----------------------------
     PROGRESS BAR STATE
  ----------------------------- */
  const [progress, setProgress] = useState(0)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  function startProgress() {
    setProgress(0)
    let value = 0
    progressTimer.current = setInterval(() => {
      value += Math.random() * 2.5 + 0.8
      if (value >= 88) value = 88
      setProgress(value)
    }, 800)
  }

  function finishProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setProgress(100)
  }

  function resetProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setProgress(0)
  }

  /* ----------------------------
     AUTOCOMPLETE LOGIC
  ----------------------------- */
  const brokerSuggestions = useMemo(() => {
    if (!broker) return Object.keys(BROKERS)
    return Object.keys(BROKERS).filter((b) =>
      b.toLowerCase().startsWith(broker.toLowerCase())
    )
  }, [broker])

  const serverSuggestions = useMemo(() => {
    if (!broker || !BROKERS[broker]) return []
    if (!server) return BROKERS[broker]
    return BROKERS[broker].filter((s) =>
      s.toLowerCase().includes(server.toLowerCase())
    )
  }, [broker, server])

  /* ----------------------------
     CONNECT FLOW (UNCHANGED)
  ----------------------------- */
  async function connect() {
    if (loading) return
    setLoading(true)
    setError(null)
    startProgress()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")

      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          label: label.trim() || null,
          login: login.trim(),
          password,
          server: server.trim(), // ✅ SAME FIELD AS BEFORE
        }),
      })

      const account = await res.json()
      if (!res.ok) throw new Error(account?.error ?? "Failed to save account")

      addOrUpdateAccount({
        id: account.id,
        userId: account.user_id,
        label: account.label,
        login: account.login,
        server: account.server,
        name: account.name,
        balance: account.balance,
        equity: account.equity,
        currency: account.currency,
        status: account.status,
      })

      setActiveAccount(account.id)

      const syncRes = await fetch("/api/mt5/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          forceReconnect: true,
        }),
      })

      const syncData = await syncRes.json()
      if (!syncRes.ok || syncData?.ok === false) {
        throw new Error(syncData?.error ?? "MT5 sync failed")
      }

      addOrUpdateAccount({
        id: account.id,
        balance: syncData.account?.balance ?? account.balance,
        equity: syncData.account?.equity ?? account.equity,
        firmDetected: syncData.account?.firmDetected,
        firmKey: syncData.account?.firmKey,
        firmName: syncData.account?.firmName,
        leverage: syncData.account?.leverage,
        phase: syncData.account?.phase,
        baselineBalance:
          syncData.baseline_balance ??
          syncData.account?.baseline_balance ??
          syncData.account?.balance ??
          account.balance ??
          null,
        status: "connected",
        lastSync: Date.now(),
      })

      bumpRefresh()
      finishProgress()
      onSuccess?.()
    } catch (e: any) {
      resetProgress()
      setError(e.message ?? "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  /* ----------------------------
     UI
  ----------------------------- */
  return (
    <div className="space-y-3">
      <input
        value={label}
        placeholder="Label (optional)"
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded bg-bg-secondary p-2 border border-border"
      />

      <input
        value={login}
        placeholder="Login"
        onChange={(e) => setLogin(e.target.value)}
        className="w-full rounded bg-bg-secondary p-2 border border-border"
      />

      <div className="relative">
        <input
          value={password}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 pr-10 border border-border placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>


      {/* 🏦 BROKER (UI-ONLY) */}
      <div className="relative">
        <input
          value={broker}
          placeholder="Choose Broker"
          onFocus={() => setIsBrokerOpen(true)}
          onChange={(e) => {
            setBroker(e.target.value)
            setIsBrokerOpen(true)
          }}
          onBlur={() => {
            // delay so click can register
            setTimeout(() => setIsBrokerOpen(false), 120)
          }}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border focus:ring-1 focus:ring-accent"
        />

        {isBrokerOpen && brokerSuggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md bg-bg-secondary border border-border shadow-xl overflow-hidden">
            {brokerSuggestions.map((b) => (
              <button
                key={b}
                type="button"
                onMouseDown={() => {
                  setBroker(b)
                  setIsBrokerOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-muted transition"
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* 🖥 SERVER (REAL FIELD) */}
      <div className="relative">
        <input
          value={server}
          placeholder="Server (e.g. ICMarketsSC-MT5)"
          onFocus={() => setIsServerOpen(true)}
          onChange={(e) => {
            setServer(e.target.value)
            setIsServerOpen(true)
          }}
          onBlur={() => {
            setTimeout(() => setIsServerOpen(false), 120)
          }}
          className="w-full rounded bg-bg-secondary text-text-primary p-2 border border-border focus:ring-1 focus:ring-accent"
        />

        {isServerOpen && serverSuggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md bg-bg-secondary border border-border shadow-xl max-h-48 overflow-auto">
            {serverSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => {
                  setServer(s)
                  setIsServerOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-bg-muted transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>


      {error && <div className="text-sm text-red-400">{error}</div>}

      <GlowButton onClick={connect} disabled={loading}>
        {loading ? "Connecting…" : "Connect MT5 Account"}
      </GlowButton>
    </div>
  )
}
