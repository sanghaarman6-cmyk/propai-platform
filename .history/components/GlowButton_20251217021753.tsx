"use client"

import { ButtonHTMLAttributes } from "react"
import clsx from "clsx"

type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "green" | "cyan"
}

export default function GlowButton({
  children,
  className,
  tone = "green",
  ...props
}: GlowButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded px-4 py-2 text-sm font-medium transition shadow-glow",
        tone === "green"
          ? "bg-accent-green text-black hover:brightness-110"
          : "bg-accent-cyan text-black hover:brightness-110",
        className
      )}
    >
      {children}
    </button>
  )
}
