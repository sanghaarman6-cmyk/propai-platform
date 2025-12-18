"use client"

import clsx from "clsx"

export type TabOption = {
  key: string
  label: string
}

export default function Tabs({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (key: string) => void
  options: TabOption[]
}) {
  return (
    <div className="inline-flex rounded border border-border bg-black/30 p-1">
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={clsx(
              "rounded px-3 py-1 text-xs transition",
              active
                ? "bg-bg-panel text-text-primary shadow-glow"
                : "text-text-muted hover:text-white"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
