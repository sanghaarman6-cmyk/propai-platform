import { Suspense } from "react"
import AppLayoutClient from "./AppLayoutClient" 

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <AppLayoutClient>{children}</AppLayoutClient>
    </Suspense>
  )
}
