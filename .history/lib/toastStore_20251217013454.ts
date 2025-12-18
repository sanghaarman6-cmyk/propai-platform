import { create } from "zustand"

export type Toast = {
  id: string
  title: string
  description?: string
  durationMs?: number
}

type ToastState = {
  toasts: Toast[]
  pushToast: (t: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (t) =>
    set((s) => ({
      toasts: [
        {
          id: `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          ...t,
        },
        ...s.toasts,
      ].slice(0, 3),
    })),
  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}))
