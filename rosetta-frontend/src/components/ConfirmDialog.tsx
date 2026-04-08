interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
