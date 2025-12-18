import clsx from "clsx"
import type { ChallengeStatus } from "@/lib/types"

export default function ChallengeStatusBadge({ status }: { status: ChallengeStatus }) {
  const label =
    status === "in_progress" ? "In progress" : status === "passed" ? "Passed" : "Failed"

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-mono",
        status === "passed" && "border-accent-green/40 text-accent-green bg-black",
        status === "failed" && "border-accent-red/40 text-accent-red bg-black",
        status === "in_progress" && "border-accent-amber/40 text-accent-amber bg-black"
      )}
    >
      {label.toUpperCase()}
    </span>
  )
}
