import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../auth/auth";

export default function AdminRoute({ children }) {
    const token = getToken();
    const user = getUser();

    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== "ADMIN") return <Navigate to="/check" replace />;

    return children;
}
