export default function Toast({ open, type = "success", message = "", onClose }) {
    if (!open) return null;

    const base =
        "fixed z-[70] right-4 top-4 max-w-[360px] w-[calc(100%-2rem)] rounded-2xl border shadow-lg px-4 py-3 flex items-start gap-3";
    const styles =
        type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-gray-50 border-gray-200 text-gray-800";

    return (
        <div className={`${base} ${styles}`}>
            <div className="font-bold shrink-0">
                {type === "success" ? "✓" : type === "error" ? "✕" : "i"}
            </div>
            <div className="text-sm leading-snug flex-1">{message}</div>
            <button
                type="button"
                className="shrink-0 px-2 py-1 rounded-lg hover:bg-black/5"
                onClick={onClose}
                aria-label="Close toast"
                title="Close"
            >
                ✕
            </button>
        </div>
    );
}
