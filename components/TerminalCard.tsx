import { ReactNode } from "react"

export default function TerminalCard({
  title,
  children,
}: {
  title?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      {title && (
        <div className="mb-3 text-sm font-medium text-white">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
