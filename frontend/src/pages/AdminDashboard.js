import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Truck, AlertTriangle, Calendar, Leaf, TrendingDown, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-[#E5E7EB] p-4 stat-card" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 border border-[#E5E7EB]" style={{ color }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'IBM Plex Sans' }}>{value}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [s, u, r] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/reports`, { withCredentials: true })
      ]);
      setStats(s.data);
      setUsers(u.data);
      setReports(r.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      await axios.put(`${API}/admin/reports/${reportId}/status`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = [
    { name: '8AM', trucks: 4, reports: 1 },
    { name: '10AM', trucks: 8, reports: 2 },
    { name: '12PM', trucks: 12, reports: 3 },
    { name: '2PM', trucks: 10, reports: 5 },
    { name: '4PM', trucks: 7, reports: 2 },
    { name: '6PM', trucks: 5, reports: 1 },
  ];

  if (!stats) return <div className="flex-1 flex items-center justify-center text-[#6B7280]">Loading...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="admin-dashboard">
      <h1 className="text-2xl font-bold tracking-tight mb-6" style={{ fontFamily: 'IBM Plex Sans' }}>
        Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} sub={`${stats.total_drivers} drivers, ${stats.total_organizations} orgs`} color="#002FA7" />
        <StatCard icon={Truck} label="Active Trucks" value={stats.active_trucks} sub="Currently on map" color="#10B981" />
        <StatCard icon={AlertTriangle} label="Active Reports" value={stats.active_reports} sub={`${stats.total_reports} total`} color="#E02424" />
        <StatCard icon={Calendar} label="Total Bookings" value={stats.total_bookings} sub={`${stats.total_slots} slots created`} color="#FACA15" />
      </div>

      {/* Carbon & Congestion */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Carbon Saved</span>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-600">{stats.carbon_saved_kg} kg</p>
          <p className="text-xs text-[#6B7280] mt-1">CO2 reduction from optimized routing</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-[#002FA7]" />
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Congestion Reduction</span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#002FA7]">{stats.avg_congestion_reduction}%</p>
          <p className="text-xs text-[#6B7280] mt-1">Average peak-hour improvement</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-[#E5E7EB] p-4 mb-6" data-testid="admin-chart">
        <h3 className="text-sm font-bold mb-3" style={{ fontFamily: 'IBM Plex Sans' }}>Daily Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="trucks" fill="#002FA7" name="Active Trucks" radius={[2, 2, 0, 0]} />
            <Bar dataKey="reports" fill="#E02424" name="Reports" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users table */}
        <div className="bg-white border border-[#E5E7EB]" data-testid="admin-users-table">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>User Management</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {users.map(u => (
              <div key={u._id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-[#6B7280] font-mono">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                  {u.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`delete-user-${u._id}`}
                      className="h-6 w-6 p-0 text-[#6B7280] hover:text-red-600"
                      onClick={() => handleDeleteUser(u._id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports moderation */}
        <div className="bg-white border border-[#E5E7EB]" data-testid="admin-reports-moderation">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>Report Moderation</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {reports.map(r => (
              <div key={r.report_id} className="px-4 py-2.5 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-[10px] ${
                        r.severity === 'critical' ? 'bg-red-50 text-red-700' :
                        r.severity === 'moderate' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {r.severity}
                      </Badge>
                      <span className="text-xs font-medium truncate">{r.report_type}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] truncate mt-0.5">{r.description}</p>
                  </div>
                  <Select
                    value={r.status}
                    onValueChange={(v) => handleReportStatus(r.report_id, v)}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-xs" data-testid={`report-status-${r.report_id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="invalid">Invalid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
