
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index"; 
import { fetchCurrentUser, selectAuth, logoutUser, clearAuth } from "@/store/features/auth/authSlice"
import { useSelector } from "react-redux";
import Spinner from "./components/Spinner";
import NotificationManager from "./components/NotificationManager";
import { useAppDispatch } from "./store/hooks";
import { store } from "./store/index";
import { useEffect } from "react";
export default function App() {

  const dispatch = useAppDispatch();
  const { isLoading } = useSelector(selectAuth);
  
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Lắng nghe event khi refresh token fails
  useEffect(() => {
    const handleRefreshFailed = async () => {
      const { user } = selectAuth(store.getState());
      
      // Backend đã xóa cookie, không cần xóa localStorage
      console.log("[App] Refresh token expired, backend đã xóa cookie");
      
      // Chỉ logout nếu user đã đăng nhập
      if (user) {
        try {
          await dispatch(logoutUser()).unwrap();
        } catch (err) {
          console.error("Logout failed:", err);
        } finally {
          dispatch(clearAuth());
          window.location.href = "/fr";
        }
      } else {
        // Nếu chưa đăng nhập, chỉ clear auth state
        dispatch(clearAuth());
      }
    };

    window.addEventListener("auth:refresh-failed", handleRefreshFailed);

    return () => {
      window.removeEventListener("auth:refresh-failed", handleRefreshFailed);
    };
  }, [dispatch]);

  return (
     <>
      <NotificationManager>
        <div className='App'>
           {isLoading && <Spinner />}
          <RouterProvider router={router} />
        </div>
      </NotificationManager>
    </>
  );
}
