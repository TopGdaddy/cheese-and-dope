import { useAuth } from '../context/AuthContext';
import AdminAnalytics from '../components/analytics/AdminAnalytics';
import DriverAnalytics from '../components/analytics/DriverAnalytics';
import OrgAnalytics from '../components/analytics/OrgAnalytics';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const role = user?.role || 'regular';

  switch (role) {
    case 'admin':
      return (
        <div className="p-6 bg-slate-950 min-h-screen">
          <AdminAnalytics />
        </div>
      );
    case 'driver':
      return (
        <div className="p-6 bg-slate-950 min-h-screen">
          <DriverAnalytics />
        </div>
      );
    case 'organization':
      return (
        <div className="p-6 bg-slate-950 min-h-screen">
          <OrgAnalytics />
        </div>
      );
    default:
      return (
        <div className="p-6 bg-slate-950 min-h-screen">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-2">Analytics are not available for your role.</p>
        </div>
      );
  }
}
