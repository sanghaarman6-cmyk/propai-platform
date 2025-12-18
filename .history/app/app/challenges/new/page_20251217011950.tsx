import TerminalCard from "@/components/TerminalCard"

export default function NewChallengePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-text-muted">Challenges</div>
        <h1 className="text-2xl font-semibold">Add / Edit Challenge</h1>
        <div className="mt-1 text-sm text-text-muted">
          Coming next in Phase 5B: firm templates + rule engine preview + polished form.
        </div>
      </div>

      <TerminalCard title="Next">
        <div className="text-sm text-text-muted">
          Approve Phase 5A and I’ll ship the full form wizard + rule preview.
        </div>
      </TerminalCard>
    </div>
  )
}
