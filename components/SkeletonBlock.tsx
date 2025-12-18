export default function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded border border-border bg-black/40 ${className}`} />
  )
}
