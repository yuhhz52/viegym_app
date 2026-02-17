import axios from "axios";
import { API_BASE_URL } from "../api/constant";

export const clearTokens = () => {
  // Nếu backend không tự xóa cookie khi logout
  axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
};

/**
 * Lấy thông tin user hiện tại từ server dựa vào cookie HttpOnly
 */
interface AuthResponse {
  result: any; // replace 'any' with actual user type if available
}

export const getUserInfo = async () => {
  try {
    const response = await axios.get<AuthResponse>(`${API_BASE_URL}/api/auth/me`, {
      withCredentials: true, // gửi cookie HttpOnly
    });
    return response.data.result;
  } catch (err) {
    console.error("Cannot fetch user info:", err);
    return null;
  }
};

/**
 * Kiểm tra xem user đã login hay chưa dựa trên server
 */
export const isLoggedIn = async () => {
  const user = await getUserInfo();
  return !!user;
};
