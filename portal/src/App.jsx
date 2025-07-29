// App.jsx - Updated with consolidated login system
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";
import { UserManagementPage } from "@/pages/admin/UsersPage";
import { PrayerTimesPage } from "@/pages/admin/PrayerTimesPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          
          {/* Admin Dashboard Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="prayer-times" element={<PrayerTimesPage />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;