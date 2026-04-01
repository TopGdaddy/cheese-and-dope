import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import AuthPage from "@/pages/AuthPage";
import LiveMapPage from "@/pages/LiveMapPage";
import SlotsPage from "@/pages/SlotsPage";
import ReportsPage from "@/pages/ReportsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import OrgDashboard from "@/pages/OrgDashboard";
import DriverPage from "@/pages/DriverPage";

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
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'driver') return <Navigate to="/driver" replace />;
  if (user?.role === 'organization') return <Navigate to="/organization" replace />;
  return <Navigate to="/map" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<RoleRedirect />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/slots" element={<SlotsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/organization" element={<OrgDashboard />} />
            <Route path="/driver" element={<DriverPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
