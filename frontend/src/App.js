import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import Sidebar from "@/components/Sidebar";
import AuthPage from "@/pages/AuthPage";
import LandingPage from "@/pages/LandingPage";
import LiveMapPage from "@/pages/LiveMapPage";
import SlotsPage from "@/pages/SlotsPage";
import ReportsPage from "@/pages/ReportsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import OrgDashboard from "@/pages/OrgDashboard";
import DriverPage from "@/pages/DriverPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import RouteOptimizationPage from "@/pages/RouteOptimizationPage";
import RegularDashboard from "@/pages/RegularDashboard";
import OrgDrivers from "@/pages/OrgDrivers";
import { getDefaultPath } from "@/config/navigationConfig";
import { Toaster } from "@/components/ui/sonner";

function DashboardLayout() {
  return (
    <div className="flex h-screen" data-testid="dashboard-layout">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user || user === false) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(user.role)} replace />;
}

function LandingPageRoute() {
  const { user } = useAuth();
  if (user && user !== false) {
    return <Navigate to={getDefaultPath(user.role)} replace />;
  }
  return <LandingPage />;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<LandingPageRoute />} />
      <Route path="/login" element={<AuthPage />} />

      {/* ===== PROTECTED ROUTES (inside layout with sidebar) ===== */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<RoleRedirect />} />

        {/* ADMIN ROUTES */}
        <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* DRIVER ROUTES */}
        <Route element={<RoleProtectedRoute allowedRoles={['driver']} />}>
          <Route path="/driver" element={<DriverPage />} />
        </Route>

        {/* ORGANIZATION ROUTES */}
        <Route element={<RoleProtectedRoute allowedRoles={['organization', 'admin']} />}>
          <Route path="/organization" element={<OrgDashboard />} />
          <Route path="/org/drivers" element={<OrgDrivers />} />
        </Route>

        {/* REGULAR USER ROUTES */}
        <Route element={<RoleProtectedRoute allowedRoles={['regular']} />}>
          <Route path="/dashboard" element={<RegularDashboard />} />
        </Route>

        {/* SHARED ROUTES — multiple roles */}
        <Route element={<RoleProtectedRoute allowedRoles={['admin', 'driver', 'organization', 'regular']} />}>
          <Route path="/map" element={<LiveMapPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['admin', 'driver', 'organization']} />}>
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/route-optimizer" element={<RouteOptimizationPage />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['admin', 'organization']} />}>
          <Route path="/slots" element={<SlotsPage />} />
        </Route>

      </Route>

      {/* ===== CATCH ALL ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
