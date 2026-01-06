"use client"

type ConfirmModalProps = {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* modal */}
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-bg-primary p-5 shadow-xl">
        {title && (
          <h3 className="mb-2 text-sm font-medium text-white">
            {title}
          </h3>
        )}

        {description && (
          <p className="mb-4 text-sm text-text-muted">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-text-muted hover:bg-white/5"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              danger
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-green-600 text-black hover:bg-green-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
