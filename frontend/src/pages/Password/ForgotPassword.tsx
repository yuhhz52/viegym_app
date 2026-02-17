import { useState } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "@/api/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      console.log("[ForgotPassword] Sending request with email:", email);
      const response = await apiClient.post("/api/auth/forgot-password", { email });
      console.log("[ForgotPassword] Response:", response.data);
      
      const data = response.data as { result: { message: string } };
      if (data?.result?.message) {
        setMessage(data.result.message);
        setEmail("");
      } else {
        setError("Không nhận được phản hồi từ server. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("[ForgotPassword] Error:", err);
      console.error("[ForgotPassword] Error response:", err.response?.data);
      
      // Xử lý các loại lỗi khác nhau
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.result?.message) {
        setError(err.response.data.result.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              VieGym
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Quên mật khẩu?
          </h1>
          <p className="text-gray-500 text-sm">
            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-6">
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full border rounded-lg px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent border-gray-300"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold py-3 rounded-lg transition-colors text-white mb-4 uppercase tracking-wide ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isLoading ? "ĐANG GỬI..." : "Gửi link đặt lại mật khẩu"}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <NavLink
              to="/auth/login"
              className="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              ← Quay lại đăng nhập
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
}
