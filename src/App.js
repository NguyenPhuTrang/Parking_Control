import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./auth/auth";

import Login from "./pages/Login";
import Check from "./pages/Check";
import History from "./pages/History";
import Whitelist from "./pages/Whitelist";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

export default function App() {
  const token = getToken();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/check" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/check" element={<Check />} />
        <Route path="/history" element={<History />} />
        <Route path="/whitelist" element={<Whitelist />} /> {/* ✅ STAFF vào xem được */}
      </Route>

      <Route path="*" element={<div className="p-6">404</div>} />
    </Routes>
  );
}
