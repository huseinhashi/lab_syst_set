// PublicRoute.jsx - Only for non-authenticated users
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role === "admin") {
    // Redirect to dashboard if already logged in as admin
    return <Navigate to="/admin" replace />;
  }

  return children;
};
