import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/interceptor";
import { setAuth } from "../auth/auth";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const u = username.trim();
    if (!u || !password) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        username: u,
        password,
      });

      setAuth(res.data, remember);

      toast.success("Login successful !", {
        duration: 2000,
      });

      setTimeout(() => {
        navigate("/check", { replace: true });
      }, 1200);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      let msg = "Login failed, please try again !";

      if (status === 401) {
        msg = "Invalid username or password !";
      }
      else if (Array.isArray(data?.message)) {
        msg = data.message.join(", ");
      }
      else if (typeof data?.message === "string") {
        msg = data.message;
      }

      toast.error(msg, {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    toast("Please contact the administrator to reset your password.", { duration: 3000 });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="text-3xl font-extrabold text-blue-500">Parking Control</div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
              autoComplete="username"
              name="username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                name="password"
              />

              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.733 5.08A10.45 10.45 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={handleForgot}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="text-sm text-red-600">• {error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-xs text-gray-500 text-center mt-2">
            Don't have an account yet ?{" "}
            <a href="/register" className="font-semibold text-blue-600 hover:underline">
              Register now !
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}