import clsx from "clsx"

export default function TagPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "green" | "amber" | "red"
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-mono",
        tone === "neutral" && "border-border bg-black text-text-muted",
        tone === "green" && "border-accent-green/40 bg-black text-accent-green",
        tone === "amber" && "border-accent-amber/40 bg-black text-accent-amber",
        tone === "red" && "border-accent-red/40 bg-black text-accent-red"
      )}
    >
      {children}
    </span>
  )
}
