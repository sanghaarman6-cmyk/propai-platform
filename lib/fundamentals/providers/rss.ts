// lib/fundamentals/providers/rss.ts
import { XMLParser } from "fast-xml-parser"
import type { CBComm } from "@/lib/fundamentals/types"

type BankKey = CBComm["bank"]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
})

function toArray<T>(x: any): T[] {
  if (!x) return []
  return Array.isArray(x) ? x : [x]
}

function safeTs(d?: string) {
  if (!d) return Date.now()
  const t = Date.parse(d)
  return Number.isFinite(t) ? t : Date.now()
}

// NOTE: These feeds can be adjusted later per your preference.
// Start with ECB/BoE/BoJ etc once you give me the exact feed URLs you want.
const FEEDS: Record<BankKey, { url: string; speakerDefault: string }> = {
  Fed: { url: "https://www.federalreserve.gov/feeds/press_all.xml", speakerDefault: "Federal Reserve" },
  ECB: { url: "https://www.ecb.europa.eu/press/rss/press.xml", speakerDefault: "ECB" },
  BoE: { url: "https://www.bankofengland.co.uk/rss/news", speakerDefault: "Bank of England" },
  BoJ: { url: "https://www.boj.or.jp/en/rss/whatsnew.rdf", speakerDefault: "Bank of Japan" },
  PBoC: { url: "http://www.pbc.gov.cn/english/130721/index.html", speakerDefault: "PBoC" }, // may not be RSS; can swap later
  RBA: { url: "https://www.rba.gov.au/rss/rss-cb.xml", speakerDefault: "RBA" },
  BoC: { url: "https://www.bankofcanada.ca/feed/", speakerDefault: "Bank of Canada" },
}

// Simple hawk/dove heuristic
function hawkDoveScore(text: string): number {
  const t = text.toLowerCase()
  let s = 0
  const hawk = ["inflation persistent", "tight", "restrictive", "higher for longer", "raise", "hike", "vigilant"]
  const dove = ["cut", "easing", "downside risks", "support", "accommodative", "disinflation", "lower rates"]
  hawk.forEach((k) => (t.includes(k) ? (s += 12) : 0))
  dove.forEach((k) => (t.includes(k) ? (s -= 12) : 0))
  return Math.max(-100, Math.min(100, s))
}

export async function fetchCentralBankFeed(bank: BankKey, limit = 10): Promise<CBComm[]> {
  const meta = FEEDS[bank]
  if (!meta) return []

  const res = await fetch(meta.url, { next: { revalidate: 180 } })
  if (!res.ok) throw new Error(`CB feed failed (${bank}): ${res.status}`)

  const xml = await res.text()
  const j = parser.parse(xml)

  // Works for RSS/Atom-ish feeds
  const channel = j.rss?.channel ?? j.feed ?? j["rdf:RDF"] ?? j
  const items = toArray<any>(channel.item ?? channel.entry ?? channel.items)

  const out: CBComm[] = items.slice(0, limit).map((it, idx) => {
    const title = String(it.title?.["#text"] ?? it.title ?? "Update")
    const link = String(it.link?.href ?? it.link ?? "")
    const desc = String(it.description?.["#text"] ?? it.description ?? it.summary?.["#text"] ?? it.summary ?? "")
    const pub = String(it.pubDate ?? it.updated ?? it.published ?? it["dc:date"] ?? "")

    const hawkDove = hawkDoveScore(`${title} ${desc}`)

    return {
      id: `${bank}-${safeTs(pub)}-${idx}`,
      ts: safeTs(pub),
      bank,
      speaker: meta.speakerDefault,
      title,
      hawkDove,
      keyQuotes: [],
      summary: desc ? desc.slice(0, 260) : "New communication published.",
      watchlistImpacts:
        bank === "Fed"
          ? ["DXY", "US10Y", "NAS100"]
          : bank === "ECB"
          ? ["EURUSD", "EU rates"]
          : bank === "BoE"
          ? ["GBPUSD", "UK rates"]
          : bank === "BoJ"
          ? ["USDJPY", "JP rates"]
          : ["FX", "Rates"],
    }
  })

  return out.sort((a, b) => b.ts - a.ts)
}

export async function fetchAllCentralBanks(limitPer = 8): Promise<CBComm[]> {
  const banks: BankKey[] = ["Fed", "ECB", "BoE", "BoJ", "RBA", "BoC"]
  const all = await Promise.all(banks.map((b) => fetchCentralBankFeed(b, limitPer).catch(() => [])))
  return all.flat().sort((a, b) => b.ts - a.ts)
}
