"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import clsx from "clsx"
import {
  Sparkles,
  Send,
  ShieldCheck,
  Copy,
  RefreshCcw,
  Trash2,
  Plus,
  ChevronDown,
  Check,
  Search,
  SlidersHorizontal,
  Clock,
  Bot,
  User,
  Pin,
  X,
  Command,
  Info,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"
import TerminalCard from "@/components/TerminalCard"
import TagPill from "@/components/TagPill"
import { useMT5Store } from "@/lib/mt5Store"

type ChatRole = "user" | "assistant"

type EdgeBlocks = {
  snapshot: { label: string; value: string }[]
  edge_read: string[]
  fix_rules: string[]
  next_action: string
}

type ChatMsg = {
  id: string
  role: "user" | "assistant"
  content?: string          // user text
  blocks?: EdgeBlocks       // analysis mode
  text?: string             // info mode (plain ChatGPT-style)
  ts: number
}



type ChatSession = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  accountId: string | null
  pinned?: boolean
  messages: ChatMsg[]
}

function uid() {
  return crypto.randomUUID()
}


function formatTime(ts: number) {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function clamp(s: string, max = 42) {
  const t = (s ?? "").trim()
  if (t.length <= max) return t
  return t.slice(0, max).trim() + "…"
}

function detectTitleFromFirstUserMessage(messages: ChatMsg[]) {
  const first = messages.find((m) => m.role === "user")?.content ?? ""
  return first ? clamp(first, 48) : "New chat"
}

function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  enabled: boolean
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return
    const handler = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) onOutside()
    }
    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [enabled, onOutside])

  return ref
}

const STORAGE_KEY = "edge_ai_sessions_v1"

const PROMPTS: Array<{
  group: string
  items: Array<{ title: string; prompt: string; tags: string[] }>
}> = [
  {
    group: "Leak Detection",
    items: [
      {
        title: "Find my #1 leak",
        prompt: "Analyze my recent trades and tell me the #1 leak hurting my expectancy. Be blunt. Give me a fix plan.",
        tags: ["leaks", "expectancy"],
      },
      {
        title: "Overtrading check",
        prompt: "Am I overtrading? Identify signals of overtrading and propose strict trade limits and cooldown rules.",
        tags: ["discipline", "limits"],
      },
      {
        title: "Short vs long bias",
        prompt: "Compare my short vs long performance and tell me if I have a directional bias issue. Provide rules to fix it.",
        tags: ["bias", "side"],
      },
    ],
  },
  {
    group: "Prop Firm Safety",
    items: [
      {
        title: "Daily DD defense",
        prompt: "Build me a daily drawdown defense protocol: risk caps, stop rules, and what to do after losses.",
        tags: ["dd", "rules"],
      },
      {
        title: "Phase passing plan",
        prompt: "Give me a 7-day phase passing plan with strict risk caps, trade limits, and session boundaries.",
        tags: ["plan", "phase"],
      },
      {
        title: "Rule proximity warnings",
        prompt: "Design a simple ruleset that prevents me from violating max DD/daily DD. Include a hard stop checklist.",
        tags: ["risk", "compliance"],
      },
    ],
  },
  {
    group: "Execution & Process",
    items: [
      {
        title: "Entry/exit cleanup",
        prompt: "Based on my recent trades, suggest improvements to entry/exit process. Focus on reducing variance.",
        tags: ["execution", "process"],
      },
      {
        title: "Journal template",
        prompt: "Make me a minimal daily journal template and a post-trade checklist tailored to my behavior.",
        tags: ["journal", "psychology"],
      },
      {
        title: "Pre-trade checklist",
        prompt: "Create a pre-trade checklist that I must complete before placing a trade, with hard 'no-trade' rules.",
        tags: ["checklist", "discipline"],
      },
    ],
  },
]

export default function GuruPage() {
  const accounts = useMT5Store((s) => s.accounts)
  const activeId = useMT5Store((s) => s.activeAccountId)

  const defaultAccountId = useMemo(() => {
    return activeId ?? accounts?.[0]?.id ?? null
  }, [activeId, accounts])

  // UI state
  const [accountPickerOpen, setAccountPickerOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<"prompts" | "sessions" | "controls">("prompts")

  // Command palette-ish
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQuery, setCmdQuery] = useState("")

  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const activeAccount = useMemo(() => {
    if (!selectedAccountId) return accounts.find((a: any) => a.id === defaultAccountId) ?? null
    return accounts.find((a: any) => a.id === selectedAccountId) ?? null
  }, [accounts, selectedAccountId, defaultAccountId])

  const selectedAccount = useMemo(() => {
    return accounts.find((a: any) => a.id === selectedAccountId) ?? null
  }, [accounts, selectedAccountId])

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as ChatSession[]
      if (Array.isArray(parsed)) setSessions(parsed)
    } catch {
      // ignore
    }
  }, [])

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch {
      // ignore
    }
  }, [sessions])

  // Ensure selected account
  useEffect(() => {
    if (selectedAccountId) return
    setSelectedAccountId(defaultAccountId)
  }, [defaultAccountId, selectedAccountId])

  // Ensure an active session
  useEffect(() => {
    if (activeSessionId) return
    // pick most recent for that account
    const accId = selectedAccountId ?? defaultAccountId
    const candidate = sessions
      .filter((s) => s.accountId === accId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    if (candidate) {
      setActiveSessionId(candidate.id)
      return
    }
    // otherwise create one
    const id = uid()
    const now = Date.now()
    const starter: ChatSession = {
      id,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      accountId: accId ?? null,
      messages: [
        {
          id: uid(),
          role: "assistant",
          content:
            "I’m EDGE AI. Ask about your trading performance, discipline, risk, and prop rules. I’ll use your account + recent trades for context.",
          ts: now,
        },
      ],
    }
    setSessions((prev) => [starter, ...prev])
    setActiveSessionId(id)
  }, [activeSessionId, sessions, selectedAccountId, defaultAccountId])

  // Keep session/account aligned when switching accounts
  useEffect(() => {
    const accId = selectedAccountId ?? defaultAccountId
    if (!accId) return
    const current = sessions.find((s) => s.id === activeSessionId)
    if (!current) return
    if (current.accountId === accId) return

    // switch to most recent session for this account or create
    const candidate = sessions
      .filter((s) => s.accountId === accId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]

    if (candidate) setActiveSessionId(candidate.id)
    else {
      const now = Date.now()
      const id = uid()
      const starter: ChatSession = {
        id,
        title: "New chat",
        createdAt: now,
        updatedAt: now,
        accountId: accId,
        messages: [
          {
            id: uid(),
            role: "assistant",
            content:
              "Account switched. What do you want to analyze or improve in this account?",
            ts: now,
          },
        ],
      }
      setSessions((prev) => [starter, ...prev])
      setActiveSessionId(id)
    }
  }, [selectedAccountId, defaultAccountId, activeSessionId, sessions])

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) ?? null
  }, [sessions, activeSessionId])

  const messages = activeSession?.messages ?? []

  // Chat composer
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scroll
  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length, loading])

  // Click outside for account dropdown
  const pickerRef = useClickOutside<HTMLDivElement>(() => setAccountPickerOpen(false), accountPickerOpen)

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountPickerOpen(false)
        setCmdOpen(false)
      }
      // Ctrl/Cmd + K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCmdOpen(true)
        setCmdQuery("")
      }
      // Ctrl/Cmd + Enter send
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        sendMessage()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, activeSessionId, selectedAccountId])

  function updateSession(id: string, patch: Partial<ChatSession>) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s))
    )
  }

  function pushMessage(sessionId: string, msg: ChatMsg) {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s

        // HARD GUARD
        if (s.messages.some(m => m.id === msg.id)) {
          return s
        }

        return {
          ...s,
          messages: [...s.messages, msg],
          updatedAt: Date.now(),
        }
      })
    )
  }



  function newChat() {
    const accId = selectedAccountId ?? defaultAccountId
    const now = Date.now()
    const id = uid()
    const starter: ChatSession = {
      id,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      accountId: accId ?? null,
      messages: [
        {
          id: uid(),
          role: "assistant",
          content: "New chat started. What do you want to improve first — risk, discipline, or execution?",
          ts: now,
        },
      ],
    }
    setSessions((prev) => [starter, ...prev])
    setActiveSessionId(id)
    setInput("")
    setError(null)
  }

  function clearChat() {
    if (!activeSession) return
    const now = Date.now()
    updateSession(activeSession.id, {
      messages: [
        {
          id: uid(),
          role: "assistant",
          content: "Chat cleared. Ask me anything about your trading.",
          ts: now,
        },
      ],
    })
    setInput("")
    setError(null)
  }

  function togglePin(sessionId: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, pinned: !s.pinned } : s))
    )
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }

  async function sendMessage(forcedText?: string) {
    if (!activeSession) return
    const content = (forcedText ?? input).trim()
    if (!content || loading) return

    // Quick slash commands
    if (content === "/new") {
      newChat()
      return
    }
    if (content === "/clear") {
      clearChat()
      return
    }

    setError(null)
    setLoading(true)

    const userMsg: ChatMsg = { id: uid(), role: "user", content, ts: Date.now() }
    pushMessage(activeSession.id, userMsg)

    setInput("")

    try {
      const res = await fetch("/api/edge-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          accountId: selectedAccountId ?? defaultAccountId,
        }),
      })

      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error ?? "Edge AI request failed")

      let aiMsg: ChatMsg

        if (json.meta?.mode === "info") {
          aiMsg = {
            id: uid(),
            role: "assistant",
            text: json.text,
            ts: Date.now(),
          }
        } else {
          aiMsg = {
            id: uid(),
            role: "assistant",
            blocks: json.blocks,
            ts: Date.now(),
          }
        }


        pushMessage(activeSession.id, aiMsg)


      // Update title based on first user message
      const nextMessages = [...(activeSession.messages ?? []), userMsg, aiMsg]
      const nextTitle = detectTitleFromFirstUserMessage(nextMessages)
      updateSession(activeSession.id, { title: nextTitle })
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function regenerateLast() {
    if (!activeSession || loading) return
    const lastUser = [...activeSession.messages].reverse().find((m) => m.role === "user")
    if (!lastUser) return
    await sendMessage(lastUser.content)
  }

  const firmLabel = activeAccount?.firmDetected ?? "Unknown firm"
  const statusLabel = activeAccount?.status ?? "unknown"

  // Simple mini KPIs from local chat (not trades) — purely UI polish
  const chatStats = useMemo(() => {
    const total = messages.length
    const userCount = messages.filter((m) => m.role === "user").length
    const aiCount = messages.filter((m) => m.role === "assistant").length
    const last = messages[messages.length - 1]?.ts ?? null
    return { total, userCount, aiCount, last }
  }, [messages])

  // Left panel sessions
  const sessionsForAccount = useMemo(() => {
    const accId = selectedAccountId ?? defaultAccountId
    const list = sessions.filter((s) => s.accountId === (accId ?? null))
    const pinned = list.filter((s) => s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
    const rest = list.filter((s) => !s.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
    return { pinned, rest }
  }, [sessions, selectedAccountId, defaultAccountId])

  // Command palette actions
  const cmdActions = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase()
    const base = [
      { key: "new", label: "New chat", hint: "/new", run: () => newChat() },
      { key: "clear", label: "Clear chat", hint: "/clear", run: () => clearChat() },
      { key: "regen", label: "Regenerate last answer", hint: "↻", run: () => regenerateLast() },
      { key: "prompts", label: "Go to prompts", hint: "", run: () => setLeftTab("prompts") },
      { key: "sessions", label: "Go to sessions", hint: "", run: () => setLeftTab("sessions") },
      { key: "controls", label: "Go to controls", hint: "", run: () => setLeftTab("controls") },
    ]
    const promptActions = PROMPTS.flatMap((g) =>
      g.items.map((it) => ({
        key: `p:${g.group}:${it.title}`,
        label: it.title,
        hint: g.group,
        run: () => {
          setCmdOpen(false)
          setLeftTab("prompts")
          setInput(it.prompt)
        },
      }))
    )

    const all = [...base, ...promptActions]
    if (!q) return all.slice(0, 10)
    return all
      .filter((a) => (a.label + " " + a.hint).toLowerCase().includes(q))
      .slice(0, 12)
  }, [cmdQuery, input, sessions, leftTab, loading, activeSessionId])

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Sparkles className="h-4 w-4 text-accent-green" />
            EDGE AI
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              No guarantees • Risk-first • Rule-safe
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Your trading co-pilot
          </h1>

          <div className="text-sm text-text-muted">
            Chat + playbooks + sessions — built for prop traders.{" "}
            <span className="hidden sm:inline">Press</span>{" "}
            <span className="font-mono">Ctrl/⌘ K</span> to search commands.
          </div>
        </div>

        {/* Account pill */}
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setAccountPickerOpen((v) => !v)}
            className={clsx(
              "flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-black/30 px-4 py-3 text-left transition",
              "hover:bg-black/40 lg:w-[360px]"
            )}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {activeAccount?.name ?? (activeAccount?.login ? `MT5 ${activeAccount.login}` : "Select account")}
              </div>
              <div className="mt-0.5 truncate text-xs text-text-muted">
                Firm: {firmLabel} • {statusLabel}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </button>

          {accountPickerOpen && (
            <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl">
              <div className="max-h-72 overflow-auto">
                {accounts.length === 0 ? (
                  <div className="p-4 text-sm text-text-muted">No connected accounts.</div>
                ) : (
                  accounts.map((a: any) => {
                    const active = (selectedAccountId ?? defaultAccountId) === a.id
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedAccountId(a.id)
                          setAccountPickerOpen(false)
                        }}
                        className={clsx(
                          "w-full px-4 py-3 text-left transition",
                          active ? "bg-black/40" : "hover:bg-black/30"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {a.name ?? (a.login ? `MT5 ${a.login}` : "Account")}
                            </div>
                            <div className="truncate text-xs text-text-muted">
                              {a.firmDetected ?? "Unknown firm"} • {a.status ?? "unknown"}
                            </div>
                          </div>
                          {active ? <Check className="h-4 w-4 text-accent-green" /> : null}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="border-t border-border bg-black/20 p-3 text-xs text-text-muted">
                Tip: sessions are saved per account.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftTab("prompts")}
              className={clsx(
                "rounded-xl border border-border px-3 py-2 text-sm transition",
                leftTab === "prompts" ? "bg-black/40" : "bg-black/20 hover:bg-black/30"
              )}
            >
              Prompts
            </button>
            <button
              onClick={() => setLeftTab("sessions")}
              className={clsx(
                "rounded-xl border border-border px-3 py-2 text-sm transition",
                leftTab === "sessions" ? "bg-black/40" : "bg-black/20 hover:bg-black/30"
              )}
            >
              Sessions
            </button>
            <button
              onClick={() => setLeftTab("controls")}
              className={clsx(
                "rounded-xl border border-border px-3 py-2 text-sm transition",
                leftTab === "controls" ? "bg-black/40" : "bg-black/20 hover:bg-black/30"
              )}
            >
              Controls
            </button>

            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <button
                onClick={() => setCmdOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-text-muted transition hover:bg-black/30"
              >
                <Command className="h-4 w-4" />
                Cmd
              </button>
            </div>
          </div>

          {/* PROMPTS */}
          {leftTab === "prompts" && (
            <TerminalCard title="Prompt Library">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Search className="h-4 w-4 text-text-muted" />
                    Quick search (Ctrl/⌘ K)
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    Insert prompts instantly — then hit Enter.
                  </div>
                </div>

                <div className="space-y-4">
                  {PROMPTS.map((g) => (
                    <div key={g.group} className="space-y-2">
                      <div className="text-xs font-medium tracking-wide text-text-muted">
                        {g.group.toUpperCase()}
                      </div>
                      <div className="space-y-2">
                        {g.items.map((it) => (
                          <button
                            key={it.title}
                            onClick={() => setInput(it.prompt)}
                            className={clsx(
                              "w-full rounded-2xl border border-border bg-black/20 p-3 text-left transition",
                              "hover:bg-black/30"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium">{it.title}</div>
                                <div className="mt-1 line-clamp-2 text-xs text-text-muted">
                                  {it.prompt}
                                </div>
                              </div>
                              <div className="mt-0.5 flex shrink-0 flex-wrap justify-end gap-1">
                                {it.tags.slice(0, 3).map((t) => (
                                  <TagPill key={t} tone="neutral">
                                    {t}
                                  </TagPill>
                                ))}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-black/10 p-3 text-xs text-text-muted">
                  Pro tip: type <span className="font-mono">/new</span> for a new chat,{" "}
                  <span className="font-mono">/clear</span> to reset the conversation.
                </div>
              </div>
            </TerminalCard>
          )}

          {/* SESSIONS */}
          {leftTab === "sessions" && (
            <TerminalCard title="Chat Sessions">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => newChat()}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-green/20 px-3 py-2 text-sm font-medium text-white ring-1 ring-accent-green/30 transition hover:bg-accent-green/25"
                  >
                    <Plus className="h-4 w-4" />
                    New chat
                  </button>

                  <button
                    onClick={() => setCmdOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-text-muted transition hover:bg-black/30"
                  >
                    <Search className="h-4 w-4" />
                    Find
                  </button>
                </div>

                {sessionsForAccount.pinned.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium tracking-wide text-text-muted">
                      PINNED
                    </div>
                    <div className="space-y-2">
                      {sessionsForAccount.pinned.map((s) => (
                        <SessionRow
                          key={s.id}
                          session={s}
                          active={s.id === activeSessionId}
                          onOpen={() => setActiveSessionId(s.id)}
                          onPin={() => togglePin(s.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-xs font-medium tracking-wide text-text-muted">
                    RECENT
                  </div>

                  {sessionsForAccount.rest.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-black/10 p-3 text-sm text-text-muted">
                      No sessions yet for this account.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessionsForAccount.rest.map((s) => (
                        <SessionRow
                          key={s.id}
                          session={s}
                          active={s.id === activeSessionId}
                          onOpen={() => setActiveSessionId(s.id)}
                          onPin={() => togglePin(s.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TerminalCard>
          )}

          {/* CONTROLS */}
          {leftTab === "controls" && (
            <TerminalCard title="Controls & Safety">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-accent-green" />
                    Trading-only mode
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    EDGE AI will redirect non-trading questions back to performance, risk, discipline, and rules.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    icon={RefreshCcw}
                    label="Regenerate"
                    sub="Retry last answer"
                    onClick={regenerateLast}
                    disabled={loading || !activeSession}
                  />
                  <ActionButton
                    icon={Copy}
                    label="Copy last"
                    sub="Copy last AI msg"
                    onClick={() => {
                      const lastAI = [...messages]
                        .reverse()
                        .find((m) => m.role === "assistant" && m.blocks)
                        ?.blocks

                      if (lastAI) {
                        copyToClipboard(JSON.stringify(lastAI, null, 2))
                      }
                    }}
                    disabled={loading || !messages.some((m) => m.role === "assistant")}
                  />
                  <ActionButton
                    icon={Trash2}
                    label="Clear chat"
                    sub="Reset thread"
                    onClick={clearChat}
                    disabled={loading || !activeSession}
                    danger
                  />
                  <ActionButton
                    icon={Plus}
                    label="New chat"
                    sub="Fresh thread"
                    onClick={newChat}
                    disabled={loading}
                  />
                </div>

                <div className="rounded-2xl border border-border bg-black/10 p-3 text-xs text-text-muted">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4" />
                    <div>
                      Shortcuts:
                      <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">Ctrl/⌘ K</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">Command</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">Ctrl/⌘ Enter</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">Send</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">/new</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">New chat</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">/clear</div>
                        <div className="rounded-lg border border-border bg-black/20 px-2 py-1">Clear</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TerminalCard>
          )}
        </div>

        {/* RIGHT PANEL: CHAT */}
        <div className="space-y-6">
          {/* Chat top bar */}
          <div className="rounded-3xl border border-border bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Bot className="h-4 w-4 text-accent-green" />
                  EDGE AI CHAT
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {chatStats.last ? formatTime(chatStats.last) : "—"}
                  </span>
                </div>

                <div className="mt-1 truncate text-lg font-semibold">
                  {activeSession?.title ?? "Chat"}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Firm: {firmLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Sessions saved
                  </span>
                  {statusLabel !== "connected" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-yellow-200">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      Account not connected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(activeSession?.id ?? "")}
                  disabled={!activeSession}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm transition",
                    "hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  title="Pin session"
                >
                  <Pin className="h-4 w-4" />
                  Pin
                </button>

                <button
                  onClick={() => setCmdOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-text-muted transition hover:bg-black/30"
                  title="Command (Ctrl/⌘ K)"
                >
                  <Command className="h-4 w-4" />
                  Command
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-3xl border border-border bg-black/20">
            <div
              ref={scrollRef}
              className="h-[560px] overflow-auto p-4 md:p-6"
            >
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={`${m.id}-${i}`}
                    msg={m}
                    onCopy={() =>
                      copyToClipboard(
                        m.blocks
                          ? JSON.stringify(m.blocks, null, 2)
                          : m.text ?? ""
                      )
                    }
                  />
                ))}


                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-black/30">
                      <Bot className="h-4 w-4 text-accent-green" />
                    </div>
                    <div className="max-w-[92%] rounded-3xl border border-border bg-black/25 px-4 py-3 text-sm text-text-muted">
                      Thinking…
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-black/10 p-3 md:p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Ask about drawdown safety, overtrading, edge, rules, journaling…"
                      className={clsx(
                        "min-h-[56px] w-full resize-none rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none transition",
                        "focus:border-accent-green/50"
                      )}
                    />

                    <div className="pointer-events-none absolute bottom-2 right-2 hidden items-center gap-2 text-xs text-text-muted md:flex">
                      <span className="rounded-lg border border-border bg-black/20 px-2 py-1 font-mono">
                        Enter
                      </span>
                      <span className="opacity-60">send</span>
                      <span className="rounded-lg border border-border bg-black/20 px-2 py-1 font-mono">
                        Shift+Enter
                      </span>
                      <span className="opacity-60">newline</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1">
                      <User className="h-3.5 w-3.5" />
                      {chatStats.userCount} prompts
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1">
                      <Bot className="h-3.5 w-3.5" />
                      {chatStats.aiCount} answers
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Trading-only
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:pl-2">
                  <button
                    onClick={() => regenerateLast()}
                    disabled={loading || !messages.some((m) => m.role === "assistant")}
                    className={clsx(
                      "inline-flex h-12 items-center gap-2 rounded-2xl border border-border bg-black/20 px-4 text-sm transition",
                      "hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    title="Regenerate last answer"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Retry</span>
                  </button>

                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className={clsx(
                      "inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-medium transition",
                      loading || !input.trim()
                        ? "cursor-not-allowed bg-black/40 text-text-muted"
                        : "bg-accent-green/20 text-white ring-1 ring-accent-green/30 hover:bg-accent-green/25"
                    )}
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Small footer note */}
          <div className="text-xs text-text-muted">
            EDGE AI uses your account + recent trades via your server API. Nothing is saved to the DB from chat (sessions are local).
          </div>
        </div>
      </div>

      {/* Command palette modal */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setCmdOpen(false)}
          />
          <div className="absolute left-1/2 top-16 w-[92vw] max-w-2xl -translate-x-1/2">
            <div className="overflow-hidden rounded-3xl border border-border bg-bg shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border bg-black/20 p-3">
                <Search className="h-4 w-4 text-text-muted" />
                <input
                  value={cmdQuery}
                  onChange={(e) => setCmdQuery(e.target.value)}
                  autoFocus
                  placeholder="Search commands or prompts…"
                  className="w-full bg-transparent text-sm outline-none"
                />
                <button
                  onClick={() => setCmdOpen(false)}
                  className="rounded-lg border border-border bg-black/20 p-2 text-text-muted transition hover:bg-black/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto p-2">
                {cmdActions.length === 0 ? (
                  <div className="p-4 text-sm text-text-muted">No results.</div>
                ) : (
                  <div className="space-y-1">
                    {cmdActions.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => {
                          a.run()
                          setCmdOpen(false)
                        }}
                        className="w-full rounded-2xl px-3 py-3 text-left transition hover:bg-black/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.label}</div>
                            {a.hint ? (
                              <div className="truncate text-xs text-text-muted">{a.hint}</div>
                            ) : null}
                          </div>
                          {a.hint ? (
                            <div className="shrink-0 rounded-lg border border-border bg-black/20 px-2 py-1 text-xs text-text-muted">
                              {a.hint}
                            </div>
                          ) : a.key === "new" ? (
                            <div className="shrink-0 rounded-lg border border-border bg-black/20 px-2 py-1 text-xs text-text-muted">
                              /new
                            </div>
                          ) : a.key === "clear" ? (
                            <div className="shrink-0 rounded-lg border border-border bg-black/20 px-2 py-1 text-xs text-text-muted">
                              /clear
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-black/10 p-3 text-xs text-text-muted">
                Enter a query to search prompts, or run actions like new chat / clear / regenerate.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionRow({
  session,
  active,
  onOpen,
  onPin,
}: {
  session: ChatSession
  active: boolean
  onOpen: () => void
  onPin: () => void
}) {
  return (
    <div
      className={clsx(
        "group flex items-center gap-2 rounded-2xl border border-border bg-black/15 p-3 transition",
        active ? "bg-black/40" : "hover:bg-black/25"
      )}
    >
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium">{session.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
          <span className="opacity-40">•</span>
          <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </button>

      <button
        onClick={onPin}
        className={clsx(
          "rounded-xl border border-border bg-black/15 p-2 text-text-muted transition",
          "hover:bg-black/25"
        )}
        title={session.pinned ? "Unpin" : "Pin"}
      >
        <Pin className={clsx("h-4 w-4", session.pinned ? "text-accent-green" : "")} />
      </button>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  sub,
  onClick,
  disabled,
  danger,
}: {
  icon: any
  label: string
  sub: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-2xl border border-border bg-black/20 p-3 text-left transition",
        "hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "hover:border-red-500/30" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-black/25",
            danger ? "text-red-200" : "text-text-muted"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className={clsx("text-sm font-medium", danger ? "text-red-200" : "text-white")}>
            {label}
          </div>
          <div className="mt-0.5 text-xs text-text-muted">{sub}</div>
        </div>
      </div>
    </button>
  )
}

function MessageBubble({
  msg,
  onCopy,
}: {
  msg: ChatMsg
  onCopy: () => void
}) {
  const isUser = msg.role === "user"

  return (
    <div className={clsx("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-black/30">
          <Bot className="h-4 w-4 text-accent-green" />
        </div>
      )}

      <div className="group max-w-[92%] md:max-w-[78%]">
        <div
          className={clsx(
            "rounded-3xl border border-border px-4 py-4 text-sm",
            isUser ? "bg-black/45" : "bg-black/25"
          )}
        >
          {/* USER */}
          {isUser && (
            <div className="whitespace-pre-wrap">
              {msg.content}
            </div>
          )}

          {/* AI — INFO MODE (ChatGPT-style text) */}
          {!isUser && msg.text && (
            <div className="whitespace-pre-wrap leading-relaxed">
              <ReactMarkdown
                components={{
                  h3: ({ children }) => (
                    <div className="mt-4 text-base font-semibold">{children}</div>
                  ),
                  ul: ({ children }) => (
                    <ul className="mt-2 space-y-1 pl-4">{children}</ul>
                  ),
                  li: ({ children }) => <li>• {children}</li>,
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          )}

          {/* AI — ANALYSIS MODE (cards) */}
          {!isUser && msg.blocks && (
            <div className="space-y-4">
              <SnapshotGrid items={msg.blocks.snapshot} />
              <EdgeRead items={msg.blocks.edge_read} />
              <RuleGrid rules={msg.blocks.fix_rules} />
              <ActionBanner action={msg.blocks.next_action} />
            </div>
          )}
        </div>

        <div
          className={clsx(
            "mt-1 flex items-center gap-2 text-[11px] text-text-muted",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <span className="opacity-70">{formatTime(msg.ts)}</span>

          {!isUser && (
            <button
              onClick={onCopy}
              className="opacity-0 transition group-hover:opacity-100"
            >
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-black/20 px-2 py-1">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </span>
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-black/30">
          <User className="h-4 w-4 text-text-muted" />
        </div>
      )}
    </div>
  )
}


function SnapshotGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((k, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-black/25 p-4"
        >
          <div className="text-xs text-text-muted">{k.label}</div>
          <div className="mt-1 text-lg font-semibold">{k.value}</div>
        </div>
      ))}
    </div>
  )
}

function EdgeRead({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-black/20 p-4">
      <div className="mb-2 text-xs font-medium text-text-muted">
        EDGE READ
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  )
}

function RuleGrid({ rules }: { rules: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rules.map((r, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-black/30 p-4"
        >
          <div className="text-sm font-medium">Rule {i + 1}</div>
          <div className="mt-1 text-sm text-text-muted">{r}</div>
        </div>
      ))}
    </div>
  )
}

function ActionBanner({ action }: { action: string }) {
  return (
    <div className="rounded-2xl border border-accent-green/40 bg-accent-green/10 p-4">
      <div className="text-xs font-medium text-accent-green">
        NEXT ACTION
      </div>
      <div className="mt-1 text-sm font-semibold">
        {action}
      </div>
    </div>
  )
}
