export default function ConfirmDialog({
    open,
    title = "Confirm",
    message = "Are you sure you want to proceed?",
    confirmText = "Agree",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={loading ? undefined : onCancel}
            />
            <div className="relative w-[92%] max-w-md bg-white rounded-2xl shadow-xl border p-6">
                <div className="text-lg font-extrabold text-gray-900">{title}</div>
                <div className="mt-2 text-sm text-gray-600">{message}</div>

                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border font-semibold hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}