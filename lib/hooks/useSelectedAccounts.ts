"use client"
import { useAccountHubStore } from "@/lib/accountHubStore"

export function useSelectedAccount() {
  return useAccountHubStore((s) => s.getSelected())
}
