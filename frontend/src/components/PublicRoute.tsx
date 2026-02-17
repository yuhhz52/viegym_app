import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface PublicRouteProps {
  children: React.ReactNode;
}

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const PublicRoute = ({ children }: PublicRouteProps) => {
  // Get auth state from Redux store
  const authState = useSelector((state: RootState) => state.auth);
  
  // Check JWT from cookie
  const jwtToken = getCookie("viegym-jwt");
  
  // Wait for loading to complete
  if (authState?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated (có user trong Redux state HOẶC có JWT cookie)
  const isAuthenticated = !!authState?.user || !!jwtToken;

  // Nếu user đã đăng nhập, redirect về home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
