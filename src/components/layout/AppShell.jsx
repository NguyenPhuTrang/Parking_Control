import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getUser } from "../../auth/auth";
import ConfirmDialog from "../ConfirmDialog"; // ✅ thêm dòng này

export default function AppShell({ title, children }) {
  const navigate = useNavigate();
  const user = getUser();

  const [openLogout, setOpenLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    try {
      setLoggingOut(true);
      logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      setOpenLogout(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.username} ({user?.role})
          </span>

          <button
            onClick={() => setOpenLogout(true)} // ✅ mở confirm
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>

      {/* ✅ Confirm logout */}
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
    </div>
  );
}
