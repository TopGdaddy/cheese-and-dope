import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultPath } from '../config/navigationConfig';

export default function RoleProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in at all
  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role - redirect to their correct dashboard
  if (!allowedRoles.includes(user.role)) {
    const correctPath = getDefaultPath(user.role);
    return <Navigate to={correctPath} replace />;
  }

  // Role is allowed — render the page
  return <Outlet />;
}
