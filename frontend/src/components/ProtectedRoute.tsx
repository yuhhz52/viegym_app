import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/features/auth/authSlice";
import Spinner from "./Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string | string[];
}

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, isLoading } = useSelector(selectAuth);

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role) {
    if (!user?.roles || !Array.isArray(user.roles)) {
      console.error("User roles not found or invalid:", user?.roles);
      return <Navigate to="/" replace />;
    }

    const requiredRoles = Array.isArray(role) ? role : [role];
    const normalizedRequired = requiredRoles
      .filter((r): r is string => typeof r === "string")
      .map((r) => r.trim().toUpperCase());
    const normalizedUserRoles = user.roles
      .filter((r): r is string => typeof r === "string")
      .map((r) => r.trim().toUpperCase());

    const hasRequiredRole = normalizedRequired.some((requiredRole) =>
      normalizedUserRoles.includes(requiredRole)
    );

    if (!hasRequiredRole) {
      console.warn(
        "User does not have required role. Required roles:",
        normalizedRequired,
        "Current roles:",
        user.roles
      );
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
