import LoadingState from "@/components/LoadingState";
import { fetchCurrentUser } from "@/store/features/auth/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] OAuth callback received");
        console.log("[AuthCallback] Backend đã set HttpOnly cookies (secure)");
        console.log("[AuthCallback] Frontend sẽ gọi API với cookie (withCredentials: true)");
        console.log("[AuthCallback] Backend sẽ đọc token từ cookie HttpOnly (fallback nếu không có Authorization header)");
        
        // OAuth flow: Backend đã set HttpOnly cookies
        // Frontend gọi API với cookie (withCredentials: true đã có trong apiClient)
        // Backend sẽ đọc token từ cookie HttpOnly (AuthTokenFilter có fallback)
        // Frontend KHÔNG cần localStorage cho OAuth, chỉ cần cookie
        
        // Gọi API lấy thông tin user (cookie sẽ tự động gửi kèm)
        // apiClient sẽ không gửi Authorization header vì localStorage không có token
        // Backend sẽ đọc từ cookie (fallback trong AuthTokenFilter)
        const user = await dispatch(fetchCurrentUser()).unwrap();

        if (!user) {
          console.warn("[AuthCallback] ✗ fetchCurrentUser trả về null");
          navigate("/auth/login", { replace: true });
          return;
        }

        console.log("[AuthCallback] ✓ Lấy thông tin user:", user.email);
        
        // WebSocket sẽ tự động gửi cookie (browser tự động làm)
        // Backend sẽ đọc token từ cookie header (WebSocketConfig có fallback)
        console.log("[AuthCallback] ✓ WebSocket sẽ tự động dùng cookie (browser tự động gửi)");

        const normalizedRoles = Array.isArray(user.roles)
          ? user.roles
              .filter((role): role is string => typeof role === "string")
              .map((role) => role.trim().toUpperCase())
          : [];

        const hasAdminRole = normalizedRoles.some(
          (role) => role === "ROLE_ADMIN" || role === "ADMIN" || role === "ROLE_SUPER_ADMIN"
        );
        
        const hasCoachRole = normalizedRoles.some(
          (role) => role === "ROLE_COACH" || role === "COACH"
        );

        if (hasAdminRole) {
          navigate("/admin", { replace: true });
        } else if (hasCoachRole) {
          navigate("/coach", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Failed to complete Google OAuth callback:", error);
        navigate("/auth/login", { replace: true });
      }
    };

    void handleCallback();
  }, [dispatch, navigate]);

  return (
    <LoadingState message="Đang xử lý đăng nhập..." fullScreen />
  );
}
