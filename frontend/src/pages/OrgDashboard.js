import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Truck, Calendar, Clock, Fuel, CheckCircle, CreditCard, Users, MapPin, Route, BarChart3, Loader2, Building2, UserCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-[#E5E7EB] p-4 stat-card">
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

function CreditBalanceCard({ credits, totalUsed }) {
  const isLow = credits !== null && credits < 10;
  const isWarning = credits !== null && credits >= 10 && credits < 20;
  
  return (
    <div className={`bg-white p-4 stat-card border ${
      isLow ? 'border-red-300' : isWarning ? 'border-amber-300' : 'border-[#E5E7EB]'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 border ${isLow ? 'border-red-200 text-red-500' : isWarning ? 'border-amber-200 text-amber-500' : 'border-[#E5E7EB] text-[#FACA15]'}`}>
          <CreditCard className="w-4 h-4" />
        </div>
        <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Booking Credits</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${isLow ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[#111827]'}`} style={{ fontFamily: 'IBM Plex Sans' }}>
        {credits !== null ? credits : '—'}
      </p>
      <p className="text-xs text-[#6B7280] mt-1">
        {totalUsed !== null ? `${totalUsed} used total` : 'Loading...'}
      </p>
    </div>
  );
}

export default function OrgDashboard() {
  const [stats, setStats] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [credits, setCredits] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Error boundary for debugging
  if (error) {
    return (
      <div style={{padding: 40, color: 'red', background: '#fee2e2'}}>
        <h2>OrgDashboard Error</h2>
        <pre style={{whiteSpace: 'pre-wrap', fontSize: 13}}>{error.toString()}</pre>
        <button onClick={() => window.location.reload()} style={{marginTop: 20, padding: '8px 16px'}}>
          Reload Page
        </button>
      </div>
    );
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, f, b, c, d] = await Promise.allSettled([
        axios.get(`${API}/org/stats`, { withCredentials: true }),
        axios.get(`${API}/org/fleet`, { withCredentials: true }),
        axios.get(`${API}/slots/bookings`, { withCredentials: true }),
        axios.get(`${API}/org/credits`, { withCredentials: true }),
        axios.get(`${API}/org/drivers`, { withCredentials: true })
      ]);
      
      // Check for rejected promises and log them
      [s, f, b, c, d].forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error(`API call ${idx} failed:`, result.reason);
        }
      });
      
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (f.status === 'fulfilled') setFleet(f.value.data || []);
      if (b.status === 'fulfilled') setBookings(b.value.data || []);
      if (c.status === 'fulfilled') setCredits(c.value.data);
      if (d.status === 'fulfilled') setDrivers(d.value.data || []);
    } catch (err) {
      console.error("OrgDashboard fetch error:", err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const creditBalance = credits?.credits ?? 0;
  const activeDrivers = Array.isArray(drivers) ? drivers.filter(d => d?.is_active).length : 0;

  // Average fuel saved per consolidated booking vs individual trips
  // Based on: avg trip 50km, avg truck consumption 4km/L, consolidation saves ~35% fuel
  // So per booking: 50km / 4km/L * 0.35 = 4.375 liters saved
  const totalBookings = stats?.total_bookings || 0;
  const fuelSavedLiters = useMemo(() => (totalBookings * 4.4).toFixed(1), [totalBookings]);
  // CO2: diesel emits 2.68 kg CO2 per liter (IPCC standard)
  const carbonSavedKg = useMemo(() => (fuelSavedLiters * 2.68).toFixed(1), [fuelSavedLiters]);

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="org-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'IBM Plex Sans' }}>
            <Building2 className="h-6 w-6 text-[#002FA7]" />
            Organization Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage your fleet, drivers, and delivery bookings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/slots">
          <Button className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white">
            <Calendar className="h-4 w-4 mr-2" /> Book Delivery Slots
          </Button>
        </Link>
        <Link to="/org/drivers">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <UserCheck className="h-4 w-4 mr-2" /> Manage Drivers
          </Button>
        </Link>
        <Link to="/route-optimizer">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <Route className="h-4 w-4 mr-2" /> Route Optimizer
          </Button>
        </Link>
        <Link to="/analytics">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </Button>
        </Link>
        <Link to="/map">
          <Button variant="outline" size="sm" className="border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">
            <MapPin className="h-4 w-4 mr-2" /> Live Map
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Credits Card with color coding */}
        <div className={`bg-white p-4 stat-card border ${creditBalance < 10 ? 'border-red-300' : creditBalance < 20 ? 'border-amber-300' : 'border-[#E5E7EB]'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 border ${creditBalance < 10 ? 'border-red-200 text-red-500' : creditBalance < 20 ? 'border-amber-200 text-amber-500' : 'border-[#E5E7EB] text-[#FACA15]'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Credits</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${creditBalance < 10 ? 'text-red-500' : creditBalance < 20 ? 'text-amber-500' : 'text-[#111827]'}`} style={{ fontFamily: 'IBM Plex Sans' }}>
            {creditBalance}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{credits?.total_used ?? 0} used</p>
          {creditBalance < 10 && <p className="text-xs text-red-500 mt-1">⚠ Low credits!</p>}
        </div>

        <StatCard icon={Users} label="Linked Drivers" value={drivers.length} sub={`${activeDrivers} active`} color="#002FA7" />
        <StatCard icon={Truck} label="Active Trucks" value={stats?.active_trucks ?? 0} sub="On the road" color="#10B981" />
        <StatCard icon={Calendar} label="Bookings" value={stats?.total_bookings ?? 0} sub="Total slots" color="#FACA15" />
        <StatCard icon={Fuel} label="Fuel Saved" value={`${fuelSavedLiters}L`} sub={`${carbonSavedKg}kg CO2 saved`} color="#E02424" />
      </div>

      {/* Fleet list */}
      <div className="bg-white border border-[#E5E7EB] mb-6" data-testid="fleet-list">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>
            Active Fleet ({fleet.length} vehicles)
          </h3>
        </div>
        {fleet.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#6B7280]">No active trucks. Go to Live Map to view simulated fleet.</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {fleet.map(truck => (
              <div key={truck.truck_id} className="px-4 py-3 flex items-center justify-between hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${truck.is_mock ? 'bg-[#002FA7]' : 'bg-[#E02424] animate-pulse'}`} />
                  <div>
                    <p className="text-sm font-medium">{truck.driver_name}</p>
                    <p className="text-xs text-[#6B7280]">{truck.route_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono">{truck.speed} km/h</span>
                  <Badge variant={truck.is_mock ? "secondary" : "destructive"} className="text-[10px]">
                    {truck.is_mock ? 'SIMULATED' : 'LIVE'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-[#E5E7EB] mb-6" data-testid="recent-bookings">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>Recent Bookings</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#6B7280]">No bookings yet. Book slots from the Delivery Slots page.</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {bookings.slice(0, 10).map(b => (
              <div key={b.booking_id} className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F9FAFB]">
                <div>
                  <p className="text-sm">Slot: <span className="font-mono">{b.slot_id.slice(0, 8)}...</span></p>
                  <p className="text-xs text-[#6B7280]">By {b.user_name}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Drivers */}
      <div className="bg-white border border-[#E5E7EB]" data-testid="linked-drivers">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>My Drivers ({drivers.length})</h3>
          <Link to="/org/drivers">
            <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#002FA7] text-xs">
              Manage →
            </Button>
          </Link>
        </div>
        {drivers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-6 w-6 text-[#D1D5DB] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">No drivers linked yet</p>
            <Link to="/org/drivers">
              <Button variant="outline" size="sm" className="mt-3 border-[#E5E7EB] text-[#374151] text-xs">
                Link Drivers
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {drivers.slice(0, 8).map(d => (
              <div key={d._id} className="px-4 py-3 flex items-center justify-between hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    d.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-[#E5E7EB] text-[#6B7280]'
                  }`}>
                    {d.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-[#6B7280]">{d.email}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] ${d.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                  {d.is_active ? '● Active' : '○ Offline'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
