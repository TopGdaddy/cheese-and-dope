import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F3F4F6]" data-testid="loading-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#002FA7]" />
          <span className="text-sm text-[#6B7280] font-medium">Loading UrbanLogicx...</span>
        </div>
      </div>
    );
  }

  if (user === false) return <Navigate to="/login" replace />;
  return children;
}
