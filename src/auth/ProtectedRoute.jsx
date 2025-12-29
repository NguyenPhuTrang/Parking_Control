import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "./auth";

export default function ProtectedRoute({ roles }) {
  const user = getUser();

  // chưa login -> về /login
  if (!user) return <Navigate to="/login" replace />;

  // có roles yêu cầu mà user không thuộc -> về /check
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/check" replace />;
  }

  return <Outlet />;
}
