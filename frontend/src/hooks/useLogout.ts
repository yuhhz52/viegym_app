import { useAppDispatch } from "@/store/hooks"
import { logoutUser, clearAuth } from "@/store/features/auth/authSlice"
import { useState } from "react"

export const useLogout = () => {
  const dispatch = useAppDispatch()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      // Gọi backend logout để xóa JWT cookie
      await dispatch(logoutUser()).unwrap()
      console.log("[useLogout] ✓ Backend đã xóa cookie");
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      // Backend đã xóa cookie (WebSocket cũng sẽ không hoạt động)
      // Clear auth từ Redux
      dispatch(clearAuth()) 
    }
  }

  return { logout, isLoggingOut }
}