import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import { Truck, Calendar, Clock, Fuel, CheckCircle } from 'lucide-react';

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

export default function OrgDashboard() {
  const [stats, setStats] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [s, f, b] = await Promise.all([
        axios.get(`${API}/org/stats`, { withCredentials: true }),
        axios.get(`${API}/org/fleet`, { withCredentials: true }),
        axios.get(`${API}/slots/bookings`, { withCredentials: true })
      ]);
      setStats(s.data);
      setFleet(f.data);
      setBookings(b.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!stats) return <div className="flex-1 flex items-center justify-center text-[#6B7280]">Loading...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="org-dashboard">
      <h1 className="text-2xl font-bold tracking-tight mb-6" style={{ fontFamily: 'IBM Plex Sans' }}>
        Fleet Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Truck} label="Active Trucks" value={stats.active_trucks} sub="On the road" color="#002FA7" />
        <StatCard icon={Calendar} label="Bookings" value={stats.total_bookings} sub="Total slot bookings" color="#10B981" />
        <StatCard icon={CheckCircle} label="Completion" value={`${stats.delivery_completion_rate}%`} sub="Delivery success rate" color="#FACA15" />
        <StatCard icon={Fuel} label="Fuel Saved" value={`${stats.fuel_saved_liters}L`} sub="Via optimized routing" color="#E02424" />
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
      <div className="bg-white border border-[#E5E7EB]" data-testid="recent-bookings">
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
    </div>
  );
}
