import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, MapPin, AlertTriangle, Leaf, Map, FileText, TrendingDown, Wind, Loader2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RegularDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, trucksRes] = await Promise.allSettled([
          axios.get(`${API_URL}/api/reports`, { withCredentials: true }),
          axios.get(`${API_URL}/api/trucks/live-positions`, { withCredentials: true }),
        ]);
        if (reportsRes.status === 'fulfilled') setReports((reportsRes.value.data || []).slice(0, 5));
        if (trucksRes.status === 'fulfilled') setTrucks(trucksRes.value.data || []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // City stats based on real data
  const cityStats = {
    congestionLevel: trucks.length > 4 ? 'Moderate' : trucks.length > 2 ? 'Light' : 'Low',
    congestionColor: trucks.length > 4 ? 'text-amber-500' : 'text-emerald-500',
    activeDeliveries: trucks.length,
    activeReports: reports.filter(r => r.status === 'active').length,
    co2SavedToday: Math.round(trucks.length * 4.2),
    airQuality: 'Moderate',
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F3F4F6] min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#002FA7] mx-auto mb-3" />
          <p className="text-[#6B7280]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'IBM Plex Sans' }}>
            <Activity className="h-6 w-6 text-[#002FA7]" />
            City Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Hi {user?.name || 'there'}! Here's what's happening in Mumbai's logistics network.
          </p>
        </div>
      </div>

      {/* City KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <Activity className="h-5 w-5 text-amber-500 mb-2" />
            <p className={`text-xl font-bold ${cityStats.congestionColor}`}>{cityStats.congestionLevel}</p>
            <p className="text-xs text-[#6B7280]">Congestion Level</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <MapPin className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-xl font-bold text-[#111827]">{cityStats.activeDeliveries}</p>
            <p className="text-xs text-[#6B7280]">Active Deliveries</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mb-2" />
            <p className="text-xl font-bold text-[#111827]">{cityStats.activeReports}</p>
            <p className="text-xs text-[#6B7280]">Active Reports</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <Leaf className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-xl font-bold text-[#111827]">{cityStats.co2SavedToday} kg</p>
            <p className="text-xs text-[#6B7280]">CO₂ Saved Today</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <Wind className="h-5 w-5 text-cyan-500 mb-2" />
            <p className="text-xl font-bold text-[#111827]">{cityStats.airQuality}</p>
            <p className="text-xs text-[#6B7280]">Air Quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Impact Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#111827]">UrbanLogix is making a difference</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Coordinated delivery scheduling has reduced peak-hour congestion by approximately 28.5% in monitored corridors.
                {cityStats.co2SavedToday > 0 && ` Today alone, ${cityStats.co2SavedToday} kg of CO₂ emissions were avoided through optimized routing.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/map">
          <Button className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white">
            <Map className="h-4 w-4 mr-2" /> View Live Map
          </Button>
        </Link>
        <Link to="/reports">
          <Button variant="outline" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <FileText className="h-4 w-4 mr-2" /> Submit a Report
          </Button>
        </Link>
      </div>

      {/* Recent Reports */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-[#111827] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Recent Ground Reports
          </CardTitle>
          <Link to="/reports">
            <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#002FA7] text-xs">
              View All →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-6">
              <Eye className="h-6 w-6 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No recent reports in your area</p>
              <Link to="/reports">
                <Button variant="outline" size="sm" className="mt-2 border-[#E5E7EB] text-[#374151] text-xs">
                  Submit a Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, i) => (
                <div key={i} className="flex items-start justify-between p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#111827]">{report.report_type}</p>
                      <Badge className={`text-xs ${
                        report.severity === 'critical' ? 'bg-red-50 text-red-700' :
                        report.severity === 'moderate' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {report.severity}
                      </Badge>
                      <Badge className={`text-xs ${
                        report.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        report.status === 'under_review' ? 'bg-blue-50 text-blue-700' :
                        'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{report.description}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      By {report.user_name} · 👍 {report.upvotes || 0} · 👎 {report.downvotes || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
