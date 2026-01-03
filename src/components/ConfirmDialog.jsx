export default function ConfirmDialog({
    open,
    title = "Confirmation",
    message = "Are you sure ?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    loading = false,
    onClose,
    onConfirm,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                onClick={() => !loading && onClose?.()}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border p-6">
                <div className="text-lg font-extrabold text-gray-900">{title}</div>
                <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">{message}</div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl border font-semibold hover:bg-gray-50 disabled:opacity-60"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm?.()}
                        disabled={loading}
                        className={`px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-black"
                            }`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
