import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, IndianRupee, Navigation, Fuel, Clock, MapPin, Star, Zap, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CHART_THEME = {
  grid: { stroke: '#1e293b' },
  axis: { fill: '#94a3b8', fontSize: 11 },
  tooltip: {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' },
    labelStyle: { color: '#e2e8f0' },
    itemStyle: { color: '#e2e8f0' },
  },
};

export default function DriverAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');

  // ===== DRIVER-SPECIFIC MOCK DATA =====
  const earningsTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const baseEarning = 800 + Math.random() * 600;
      const trips = Math.floor(3 + Math.random() * 5);
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        earnings: Math.round(baseEarning),
        trips: trips,
        distance: Math.round(trips * (12 + Math.random() * 8)),
      };
    });
  }, [period]);

  const weeklyEarnings = useMemo(() => {
    const weeks = period === '7d' ? 1 : period === '30d' ? 4 : 12;
    return Array.from({ length: weeks }, (_, i) => ({
      week: `Week ${i + 1}`,
      earnings: Math.round(4500 + Math.random() * 3000),
      bonus: Math.round(Math.random() * 500),
    }));
  }, [period]);

  const topRoutes = useMemo(() => [
    { route: 'Andheri MIDC → BKC', trips: 45, avgEarning: 320, avgTime: '42 min' },
    { route: 'Crawford Market → Dadar', trips: 38, avgEarning: 280, avgTime: '35 min' },
    { route: 'Powai → Vashi APMC', trips: 32, avgEarning: 450, avgTime: '55 min' },
    { route: 'Borivali → Goregaon', trips: 28, avgEarning: 210, avgTime: '28 min' },
    { route: 'Thane → Mulund', trips: 22, avgEarning: 190, avgTime: '25 min' },
  ], []);

  const fuelEfficiency = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        efficiency: Math.round((5.5 + Math.random() * 2.5) * 10) / 10,
        avgSpeed: Math.round(22 + Math.random() * 15),
      };
    });
  }, [period]);

  const tripTimeDistribution = useMemo(() => [
    { timeSlot: '6-8 AM', trips: 12 + Math.floor(Math.random() * 5) },
    { timeSlot: '8-10 AM', trips: 18 + Math.floor(Math.random() * 8) },
    { timeSlot: '10-12 PM', trips: 15 + Math.floor(Math.random() * 5) },
    { timeSlot: '12-2 PM', trips: 8 + Math.floor(Math.random() * 4) },
    { timeSlot: '2-4 PM', trips: 14 + Math.floor(Math.random() * 6) },
    { timeSlot: '4-6 PM', trips: 20 + Math.floor(Math.random() * 8) },
    { timeSlot: '6-8 PM', trips: 16 + Math.floor(Math.random() * 5) },
    { timeSlot: '8-10 PM', trips: 6 + Math.floor(Math.random() * 3) },
  ], [period]);

  // KPIs
  const totalEarnings = earningsTrend.reduce((s, d) => s + d.earnings, 0);
  const totalTrips = earningsTrend.reduce((s, d) => s + d.trips, 0);
  const totalDistance = earningsTrend.reduce((s, d) => s + d.distance, 0);
  const avgPerTrip = totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0;
  const avgEfficiency = fuelEfficiency.reduce((s, d) => s + d.efficiency, 0) / fuelEfficiency.length;

  const periodButtons = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Navigation className="h-6 w-6 text-blue-400" />
            My Performance
          </h1>
          <p className="text-slate-400 mt-1">Hi {user?.name || 'Driver'} — here's your driving performance and earnings</p>
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {periodButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === btn.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Earnings</p>
            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />{totalEarnings.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">+12.4% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Trips</p>
            <p className="text-2xl font-bold text-white mt-1">{totalTrips}</p>
            <p className="text-xs text-slate-500 mt-1">avg ₹{avgPerTrip}/trip</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Distance Covered</p>
            <p className="text-2xl font-bold text-white mt-1">{totalDistance} km</p>
            <p className="text-xs text-slate-500 mt-1">across all trips</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Fuel Efficiency</p>
            <p className="text-2xl font-bold text-white mt-1">{Math.round(avgEfficiency * 10) / 10} km/L</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">above avg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Driver Rating</p>
            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1">
              4.7 <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </p>
            <p className="text-xs text-slate-500 mt-1">based on compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Earnings Trend + Weekly Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Daily Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={earningsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(earningsTrend.length / 6)} />
                <YAxis tick={CHART_THEME.axis} tickFormatter={(v) => `₹${v}`} />
                <Tooltip {...CHART_THEME.tooltip} formatter={(value) => [`₹${value}`, 'Earnings']} />
                <Area type="monotone" dataKey="earnings" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Weekly Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="week" tick={CHART_THEME.axis} />
                <YAxis tick={CHART_THEME.axis} tickFormatter={(v) => `₹${v}`} />
                <Tooltip {...CHART_THEME.tooltip} formatter={(value) => [`₹${value}`]} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Base Earnings" />
                <Bar dataKey="bonus" fill="#22c55e" radius={[4, 4, 0, 0]} name="Bonus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Trip Time Distribution + Fuel Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Trips by Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tripTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="timeSlot" tick={CHART_THEME.axis} />
                <YAxis tick={CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Bar dataKey="trips" radius={[4, 4, 0, 0]}>
                  {tripTimeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.trips > 16 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Fuel Efficiency Trend (km/L)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fuelEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(fuelEfficiency.length / 6)} />
                <YAxis tick={CHART_THEME.axis} domain={['auto', 'auto']} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Line type="monotone" dataKey="efficiency" stroke="#22c55e" strokeWidth={2} dot={false} name="km/L" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Routes Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Your Top Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 text-xs text-slate-500 font-medium">#</th>
                  <th className="text-left py-2 text-xs text-slate-500 font-medium">Route</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Trips</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Avg Earning</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {topRoutes.map((route, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-2.5 text-slate-500">{i + 1}</td>
                    <td className="py-2.5 text-white font-medium">{route.route}</td>
                    <td className="py-2.5 text-right text-slate-300">{route.trips}</td>
                    <td className="py-2.5 text-right text-emerald-400">₹{route.avgEarning}</td>
                    <td className="py-2.5 text-right text-slate-300">{route.avgTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
