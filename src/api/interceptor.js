import api from "./axios";
import { getToken, logout } from "../auth/auth";

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url || "";

        // ✅ Login sai (401) => để Login.jsx xử lý toast, không redirect
        if (url.includes("/auth/login")) {
            return Promise.reject(err);
        }

        // ✅ Các API khác 401 mới logout + đá về login
        if (status === 401) {
            logout();
            window.location.href = "/login";
        }

        return Promise.reject(err);
    }
);

export default api;
