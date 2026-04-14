import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Users, Truck, AlertTriangle, Calendar, Leaf, TrendingDown, Trash2, Loader2, MapPin, BarChart3, FileText, Shield, CreditCard, Plus, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  const [trucks, setTrucks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupReason, setTopupReason] = useState('Admin top-up');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(null);
  const [topupAmountInline, setTopupAmountInline] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, u, r, t, b, o] = await Promise.allSettled([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/reports`, { withCredentials: true }),
        axios.get(`${API}/trucks/live-positions`, { withCredentials: true }),
        axios.get(`${API}/slots/bookings`, { withCredentials: true }),
        axios.get(`${API}/admin/organizations`, { withCredentials: true })
      ]);
      
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (u.status === 'fulfilled') setUsers(u.value.data);
      if (r.status === 'fulfilled') setReports(r.value.data);
      if (t.status === 'fulfilled') setTrucks(t.value.data || []);
      if (b.status === 'fulfilled') setBookings((b.value.data || []).slice(-5).reverse());
      if (o.status === 'fulfilled') setOrganizations(o.value.data || []);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load some dashboard data');
    } finally {
      setLoading(false);
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

  const openTopupModal = (org) => {
    setSelectedOrg(org);
    setTopupAmount('');
    setTopupReason('Admin top-up');
    setTopupSuccess(null);
    setTopupModalOpen(true);
  };

  const handleTopupCredits = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !topupAmount) return;
    
    setTopupLoading(true);
    try {
      const response = await axios.post(`${API}/admin/credits/topup`, {
        organization_id: selectedOrg._id,
        amount: parseInt(topupAmount),
        reason: topupReason
      }, { withCredentials: true });
      
      setTopupSuccess({
        orgName: selectedOrg.name,
        amount: topupAmount,
        newBalance: response.data.new_balance
      });
      
      // Refresh organizations data
      const orgsRes = await axios.get(`${API}/admin/organizations`, { withCredentials: true });
      setOrganizations(orgsRes.data || []);
    } catch (err) {
      console.error('Top-up error:', err);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleTopup = async (orgId) => {
    try {
      const response = await axios.post(`${API}/admin/credits/topup`, {
        organization_id: orgId,
        amount: topupAmountInline,
        reason: 'Admin top-up'
      }, { withCredentials: true });
      
      if (response.status === 200) {
        toast.success(`Added ${topupAmountInline} credits`);
        // Refresh orgs list
        setOrganizations(prev => prev.map(o => 
          o._id === orgId ? {...o, credits: (o.credits || 0) + topupAmountInline} : o
        ));
      } else {
        toast.error("Top-up failed");
      }
    } catch (err) {
      toast.error("Top-up failed");
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

  if (loading || !stats) {
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
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="admin-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'IBM Plex Sans' }}>
            <Shield className="h-6 w-6 text-[#002FA7]" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">Platform overview and system management</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/slots">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <Calendar className="h-4 w-4 mr-2" /> Manage Slots
          </Button>
        </Link>
        <Link to="/map">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <MapPin className="h-4 w-4 mr-2" /> Live Map
          </Button>
        </Link>
        <Link to="/analytics">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </Button>
        </Link>
        <Link to="/reports">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <FileText className="h-4 w-4 mr-2" /> Reports
          </Button>
        </Link>
      </div>

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

      {/* Inline Organization Credits Panel */}
      <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem", backgroundColor: "white", border: "1px solid #E5E7EB", padding: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", fontFamily: 'IBM Plex Sans' }}>Organization Credits Quick Top-up</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <label style={{ fontSize: "14px" }}>Amount:</label>
          <input 
            type="number" 
            value={topupAmountInline} 
            onChange={e => setTopupAmountInline(Number(e.target.value))} 
            min={1} 
            max={1000} 
            style={{ width: 80, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 4 }} 
          />
        </div>
        {organizations.map(org => (
          <div key={org._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <div>
              <strong style={{ fontSize: "14px" }}>{org.name}</strong>
              <span style={{ marginLeft: 12, color: "#666", fontSize: "14px" }}>Credits: {org.credits || 0}</span>
            </div>
            <button 
              onClick={() => handleTopup(org._id)} 
              style={{ padding: "4px 16px", background: "#1D9E75", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "14px" }}
            >
              + Top Up
            </button>
          </div>
        ))}
        {organizations.length === 0 && <p style={{ color: "#999", fontSize: "14px" }}>No organizations found</p>}
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

      {/* Organization Credit Management */}
      <div className="bg-white border border-[#E5E7EB] mt-6" data-testid="admin-organizations-credits">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FACA15]" />
            <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>Organization Credits</h3>
          </div>
          <span className="text-xs text-[#6B7280]">{organizations.length} organizations</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {organizations.length === 0 ? (
            <p className="p-4 text-sm text-[#6B7280] text-center">No organizations registered</p>
          ) : (
            organizations.map(org => {
              const credits = org.credits ?? 0;
              const isLow = credits < 10;
              const isWarning = credits >= 10 && credits < 20;
              return (
                <div key={org._id} className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#002FA7]/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#002FA7]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-[#6B7280]">{org.driver_count || 0} drivers • {org.total_credits_used || 0} credits used</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${isLow ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#111827]'}`}>
                        {credits}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">credits</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`topup-org-${org._id}`}
                      className="h-7 text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
                      onClick={() => openTopupModal(org)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Top Up
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top-up Modal */}
      <Dialog open={topupModalOpen} onOpenChange={setTopupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'IBM Plex Sans' }}>Top Up Credits</DialogTitle>
            <DialogDescription>
              Add credits to {selectedOrg?.name || 'organization'}
            </DialogDescription>
          </DialogHeader>
          
          {topupSuccess ? (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">{topupSuccess.message}</p>
                  <p className="text-xs text-emerald-600 mt-1">New balance: {topupSuccess.newBalance} credits</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-[#002FA7] hover:bg-[#002FA7]/90"
                onClick={() => setTopupModalOpen(false)}
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleTopupCredits} className="space-y-4 pt-2">
              <div>
                <Label>Current Balance</Label>
                <p className="text-lg font-bold font-mono mt-1">{selectedOrg?.credits ?? 0} credits</p>
              </div>
              <div>
                <Label htmlFor="topup-amount">Amount to Add</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <Label htmlFor="topup-reason">Reason (optional)</Label>
                <Input
                  id="topup-reason"
                  value={topupReason}
                  onChange={e => setTopupReason(e.target.value)}
                  placeholder="e.g., Monthly allocation"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTopupModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#002FA7] hover:bg-[#002FA7]/90"
                  disabled={topupLoading || !topupAmount || parseInt(topupAmount) <= 0}
                >
                  {topupLoading ? 'Processing...' : `Add ${topupAmount || 0} Credits`}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Row: Active Trucks + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Active Trucks */}
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>Active Trucks ({trucks.length})</h3>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {trucks.length === 0 ? (
              <p className="p-4 text-sm text-[#6B7280] text-center">No active trucks</p>
            ) : (
              trucks.slice(0, 8).map((truck, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                  <div>
                    <p className="text-sm font-medium">{truck.driver_name}</p>
                    <p className="text-xs text-[#6B7280]">{truck.route_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#10B981] font-mono">{truck.speed} km/h</p>
                    <Badge className={`text-[10px] ${truck.is_mock ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-red-50 text-red-700'}`}>
                      {truck.is_mock ? 'Simulated' : 'Live'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>Recent Bookings</h3>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="p-4 text-sm text-[#6B7280] text-center">No bookings yet</p>
            ) : (
              bookings.map((booking, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                  <div>
                    <p className="text-sm font-medium">{booking.user_name || 'Unknown'}</p>
                    <p className="text-xs text-[#6B7280] font-mono">{booking.slot_id?.slice(0, 8)}...</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{booking.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
