import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'driver') return <Navigate to="/driver" replace />;
  if (user?.role === 'organization') return <Navigate to="/organization" replace />;
  return <Navigate to="/map" replace />;
}

function DashboardRoute() {
  return <RoleRedirect />;
}

function LandingPageRoute() {
  const { user } = useAuth();
  if (user && user !== false) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function App() {
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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPageRoute />} />
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<RoleRedirect />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/slots" element={<SlotsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/organization" element={<OrgDashboard />} />
            <Route path="/driver" element={<DriverPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/route-optimizer" element={<RouteOptimizationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
