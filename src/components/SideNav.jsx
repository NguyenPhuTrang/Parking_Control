import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth/auth";
import ConfirmDialog from "./ConfirmDialog";


export default function SideNav({ onClose }) {
    const user = getUser();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [openLogout, setOpenLogout] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const baseItem =
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition " +
        "whitespace-nowrap overflow-hidden";

    const itemClass = (path) =>
        pathname.startsWith(path)
            ? `${baseItem} bg-blue-600 text-white`
            : `${baseItem} text-gray-700 hover:bg-gray-100`;

    const doLogout = async () => {
        try {
            setLoggingOut(true);
            logout();
            navigate("/login", { replace: true });
            onClose?.();
        } finally {
            setLoggingOut(false);
            setOpenLogout(false);
        }
    };

    const go = () => onClose?.();

    return (
        <>
            <aside className="w-64 h-full bg-white border-r flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 flex items-center gap-3 px-6 border-b shrink-0">
                    <span className="text-2xl leading-none shrink-0">🚘</span>

                    <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-lg text-gray-900 truncate">
                            Parking Control
                        </div>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="md:hidden px-3 py-2 rounded-lg hover:bg-gray-100 shrink-0"
                            aria-label="Close menu"
                            title="Close"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Menu */}
                <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                    <Link to="/check" className={itemClass("/check")} onClick={go}>
                        <span className="text-xl leading-none shrink-0 w-6 text-center">🔍</span>
                        <span className="min-w-0 truncate">Vehicle Check</span>
                    </Link>

                    {(user?.role === "ADMIN" || user?.role === "STAFF") && (
                        <Link to="/whitelist" className={itemClass("/whitelist")} onClick={go}>
                            <span className="text-xl leading-none shrink-0 w-6 text-center">📋</span>
                            <span className="truncate">Whitelist</span>
                        </Link>
                    )}

                    <Link to="/history" className={itemClass("/history")} onClick={go}>
                        <span className="text-xl leading-none shrink-0 w-6 text-center">🕒</span>
                        <span className="min-w-0 truncate">History</span>
                    </Link>
                </nav>

                {/* User + Logout */}
                <div className="border-t p-4 shrink-0">
                    <div className="text-sm text-gray-600 mb-2 truncate">
                        <b>{user?.username}</b> ({user?.role})
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpenLogout(true)} // mở confirm
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold whitespace-nowrap"
                    >
                        <span className="text-lg leading-none shrink-0">🚪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Confirm logout */}
            <ConfirmDialog
                open={openLogout}
                loading={loggingOut}
                title="Log out ?"
                message="Are you sure you want to log out of the system ?"
                confirmText="Log out"
                cancelText="Cancel"
                onCancel={() => setOpenLogout(false)}
                onConfirm={doLogout}
            />
        </>
    );
}
