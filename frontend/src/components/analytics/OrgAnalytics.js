import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, IndianRupee, Truck, Fuel, Leaf, Calendar, Target, CreditCard, Building2, Users, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CHART_THEME = {
  grid: { stroke: '#1e293b' },
  axis: { fill: '#94a3b8', fontSize: 11 },
  tooltip: {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' },
    labelStyle: { color: '#e2e8f0' },
    itemStyle: { color: '#e2e8f0' },
  },
};

export default function OrgAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');

  // ===== ORG-SPECIFIC MOCK DATA =====
  const costSavingsTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    let cumSavings = 0;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const dailySaving = 1200 + Math.random() * 2500;
      cumSavings += dailySaving;
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        dailySaving: Math.round(dailySaving),
        cumulative: Math.round(cumSavings),
      };
    });
  }, [period]);

  const bookingHistory = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        booked: Math.floor(3 + Math.random() * 6),
        completed: Math.floor(2 + Math.random() * 5),
        cancelled: Math.floor(Math.random() * 2),
      };
    });
  }, [period]);

  const fleetUtilization = useMemo(() => [
    { name: 'Active', value: 65, color: '#22c55e' },
    { name: 'Idle', value: 20, color: '#f59e0b' },
    { name: 'Maintenance', value: 10, color: '#ef4444' },
    { name: 'Off-Duty', value: 5, color: '#64748b' },
  ], []);

  const costPerDelivery = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        withPlatform: Math.round(180 + Math.random() * 60),
        withoutPlatform: Math.round(280 + Math.random() * 80),
      };
    });
  }, [period]);

  const routePerformance = useMemo(() => [
    { route: 'Western Express Highway', bookings: 48, compliance: 96, fuelSaved: 42 },
    { route: 'Eastern Freeway', bookings: 35, compliance: 93, fuelSaved: 31 },
    { route: 'BKC Business District', bookings: 42, compliance: 91, fuelSaved: 38 },
    { route: 'Marine Drive', bookings: 22, compliance: 88, fuelSaved: 18 },
    { route: 'MG Road Commercial Zone', bookings: 31, compliance: 95, fuelSaved: 28 },
  ], []);

  const fuelSavedTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    let cumFuel = 0;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      cumFuel += 5 + Math.random() * 10;
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        liters: Math.round(cumFuel),
        co2Kg: Math.round(cumFuel * 2.68),
      };
    });
  }, [period]);

  // KPIs
  const totalCostSaved = costSavingsTrend[costSavingsTrend.length - 1]?.cumulative || 0;
  const totalBookings = bookingHistory.reduce((s, d) => s + d.booked, 0);
  const totalCompleted = bookingHistory.reduce((s, d) => s + d.completed, 0);
  const completionRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0;
  const totalFuelSaved = fuelSavedTrend[fuelSavedTrend.length - 1]?.liters || 0;
  const creditsRemaining = 50 - Math.floor(totalBookings * 0.3);

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
            <Building2 className="h-6 w-6 text-amber-400" />
            Organization Analytics
          </h1>
          <p className="text-slate-400 mt-1">Fleet performance, cost savings, and booking analytics for your organization</p>
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {periodButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === btn.key ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
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
            <p className="text-xs text-slate-500 uppercase tracking-wider">Cost Saved</p>
            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />{totalCostSaved.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">reduced expenses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold text-white mt-1">{totalBookings}</p>
            <p className="text-xs text-slate-500 mt-1">{totalCompleted} completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold text-white mt-1">{completionRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">on-time delivery</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Fuel Saved</p>
            <p className="text-2xl font-bold text-white mt-1">{totalFuelSaved} L</p>
            <p className="text-xs text-slate-500 mt-1">≈ ₹{Math.round(totalFuelSaved * 105).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-amber-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Credits Left</p>
            <p className={`text-2xl font-bold mt-1 ${creditsRemaining > 15 ? 'text-white' : creditsRemaining > 5 ? 'text-amber-400' : 'text-red-400'}`}>
              {Math.max(0, creditsRemaining)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {creditsRemaining > 15 ? 'Sufficient balance' : creditsRemaining > 5 ? 'Running low' : 'Top up needed'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Cost Savings + Cost Per Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Cumulative Cost Savings (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={costSavingsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(costSavingsTrend.length / 6)} />
                <YAxis tick={CHART_THEME.axis} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...CHART_THEME.tooltip} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                <Area type="monotone" dataKey="cumulative" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} name="Total Saved" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Cost Per Delivery Comparison (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={costPerDelivery}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(costPerDelivery.length / 6)} />
                <YAxis tick={CHART_THEME.axis} tickFormatter={(v) => `₹${v}`} />
                <Tooltip {...CHART_THEME.tooltip} formatter={(value) => [`₹${value}`]} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="withoutPlatform" stroke="#ef4444" strokeWidth={2} dot={false} name="Without UrbanLogix" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="withPlatform" stroke="#22c55e" strokeWidth={2} dot={false} name="With UrbanLogix" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Booking History + Fleet Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(bookingHistory.length / 6)} />
                <YAxis tick={CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Bar dataKey="booked" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Booked" />
                <Bar dataKey="completed" fill="#22c55e" radius={[2, 2, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="#ef4444" radius={[2, 2, 0, 0]} name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={fleetUtilization}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {fleetUtilization.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...CHART_THEME.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Fuel Saved + Environmental */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Fuel & Emission Savings by Fleet</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fuelSavedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
              <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(fuelSavedTrend.length / 6)} />
              <YAxis tick={CHART_THEME.axis} />
              <Tooltip {...CHART_THEME.tooltip} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Area type="monotone" dataKey="liters" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Fuel Saved (L)" />
              <Area type="monotone" dataKey="co2Kg" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="CO₂ Avoided (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Route Performance Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Route Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 text-xs text-slate-500 font-medium">Route</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Bookings</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Compliance</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-medium">Fuel Saved (L)</th>
                </tr>
              </thead>
              <tbody>
                {routePerformance.map((route, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-2.5 text-white font-medium">{route.route}</td>
                    <td className="py-2.5 text-right text-slate-300">{route.bookings}</td>
                    <td className="py-2.5 text-right">
                      <span className={route.compliance >= 95 ? 'text-emerald-400' : route.compliance >= 90 ? 'text-amber-400' : 'text-red-400'}>
                        {route.compliance}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-blue-400">{route.fuelSaved} L</td>
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
