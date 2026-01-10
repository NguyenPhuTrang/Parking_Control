import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/interceptor";
import toast from "react-hot-toast";

export default function Register() {
    const navigate = useNavigate();

    // Backend của bạn chỉ có username và password, nên bỏ fullName đi
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (loading) return;

        // 1. Validate Client: Mật khẩu nhập lại phải khớp
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!", { duration: 3000 });
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.", { duration: 3000 });
            return;
        }

        setLoading(true);
        try {
            // 2. Gọi API đăng ký
            // Lưu ý: Endpoint này cần trỏ tới Controller gọi hàm `createStaff` trong Backend
            // Mình giả định endpoint là /auth/register
            await api.post("/auth/register", {
                username: username.trim(),
                password: password,
            });

            toast.success("Account created successfully!", {
                duration: 3000,
            });

            // 3. Chuyển hướng về Login
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1500);

        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;

            let msg = "Registration failed!";

            // Xử lý ConflictException ('username already exists') từ backend
            if (status === 409) {
                msg = "Username already exists. Please choose another.";
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

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="text-3xl font-extrabold text-blue-500">Parking Control</div>
                    <div className="text-sm text-gray-500 mt-2">Create new Staff account</div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            autoFocus
                            autoComplete="new-username"
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
                                placeholder="Create a password"
                                required
                                autoComplete="new-password"
                                name="password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                                onClick={() => setShowPassword((v) => !v)}
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

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${confirmPassword && password !== confirmPassword
                                    ? "border-red-500 focus:ring-red-500"
                                    : "focus:ring-blue-500"
                                }`}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors mt-2"
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>

                    <div className="text-xs text-gray-500 text-center mt-4">
                        Already have an account?{" "}
                        <a href="/login" className="font-semibold text-blue-600 hover:underline">
                            Login here
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}