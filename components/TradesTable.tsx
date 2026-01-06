import TerminalCard from "@/components/TerminalCard"
import type { Trade } from "@/lib/types"

export default function TradesTable({
  trades,
  page,
  totalPages,
  onPageChange,
}: {
  trades: Trade[]
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  return (
    <TerminalCard title="Recent Trades">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-text-muted">
          Showing {trades.length} trades
        </div>
        <div className="text-xs text-text-muted">
          Page {page} / {totalPages}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-xs text-text-muted">
              <th className="py-2">Time</th>
              <th>Symbol</th>
              <th>Dir</th>
              <th>Lots</th>
              <th>Profit</th>
              <th>Risk %</th>
            </tr>
          </thead>

          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-border/50">
                <td className="py-2">
                  {new Date(t.tsISO).toLocaleString()}
                </td>
                <td>{t.instrument}</td>
                <td>{t.direction}</td>

                {/* LOTS */}
                <td className="font-mono">
                  {t.volume.toFixed(2)}
                </td>

                {/* PROFIT */}
                <td
                  className={`font-mono ${
                    t.profit >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {t.profit.toFixed(2)}
                </td>

                {/* RISK % */}
                <td className="font-mono">
                  {t.riskPct === null
                    ? "—"
                    : `${t.riskPct.toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          className="text-xs disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Previous
        </button>

        <button
          className="text-xs disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </TerminalCard>
  )
}
