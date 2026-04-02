import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingDown, TrendingUp, Users, Truck, Leaf, Fuel, Calendar, Activity, Target, Shield, Heart, Building2, Handshake } from 'lucide-react';

// Dark theme chart config
const CHART_THEME = {
  grid: { stroke: '#1e293b' },
  axis: { fill: '#94a3b8', fontSize: 11 },
  tooltip: {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' },
    labelStyle: { color: '#e2e8f0' },
    itemStyle: { color: '#e2e8f0' },
  },
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');

  // ===== MOCK DATA GENERATORS =====
  const congestionTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        beforePlatform: Math.floor(42 + Math.random() * 12),
        afterPlatform: Math.floor(22 + Math.random() * 10),
      };
    });
  }, [period]);

  const timeWindowData = useMemo(() => [
    { window: '6-8 AM', vehicles: 42 + Math.floor(Math.random() * 8) },
    { window: '8-10 AM', vehicles: 35 + Math.floor(Math.random() * 8) },
    { window: '10-12 PM', vehicles: 25 + Math.floor(Math.random() * 6) },
    { window: '12-2 PM', vehicles: 20 + Math.floor(Math.random() * 5) },
    { window: '2-4 PM', vehicles: 28 + Math.floor(Math.random() * 7) },
    { window: '4-6 PM', vehicles: 38 + Math.floor(Math.random() * 8) },
    { window: '6-8 PM', vehicles: 30 + Math.floor(Math.random() * 6) },
    { window: '8-10 PM', vehicles: 14 + Math.floor(Math.random() * 5) },
  ], [period]);

  const complianceData = useMemo(() => [
    { name: 'On-Time', value: 73 + Math.floor(Math.random() * 5), color: '#22c55e' },
    { name: 'Early', value: 18 + Math.floor(Math.random() * 5), color: '#3b82f6' },
    { name: 'Late', value: 4 + Math.floor(Math.random() * 3), color: '#ef4444' },
  ], [period]);

  const environmentalTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    let cumCo2 = 0, cumFuel = 0, cumNox = 0;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      cumCo2 += 8 + Math.random() * 12;
      cumFuel += 3 + Math.random() * 5;
      cumNox += 0.5 + Math.random() * 1.5;
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        co2Saved: Math.round(cumCo2),
        fuelSaved: Math.round(cumFuel),
        noxReduced: Math.round(cumNox * 10) / 10,
      };
    });
  }, [period]);

  const topOperators = useMemo(() => [
    { name: 'Mumbai Express Logistics', compliance: 98.2, deliveries: 342 },
    { name: 'Rapid Freight Solutions', compliance: 96.7, deliveries: 289 },
    { name: 'City Courier Services', compliance: 94.1, deliveries: 256 },
    { name: 'Western Line Transport', compliance: 91.8, deliveries: 198 },
    { name: 'Harbor Cargo Movers', compliance: 89.5, deliveries: 167 },
  ], []);

  const userGrowth = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    let total = 120;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      total += Math.floor(Math.random() * 5);
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        users: total,
        drivers: Math.floor(total * 0.3),
        organizations: Math.floor(total * 0.15),
      };
    });
  }, [period]);

  // KPI calculations
  const lastEnv = environmentalTrend[environmentalTrend.length - 1];
  const avgCongestionBefore = congestionTrend.reduce((s, d) => s + d.beforePlatform, 0) / congestionTrend.length;
  const avgCongestionAfter = congestionTrend.reduce((s, d) => s + d.afterPlatform, 0) / congestionTrend.length;
  const congestionReduction = Math.round(((avgCongestionBefore - avgCongestionAfter) / avgCongestionBefore) * 100 * 10) / 10;
  const totalCompliance = complianceData[0].value;

  const sdgCards = [
    { sdg: 3, name: 'Good Health', metric: 'Air quality improved by 12%', progress: 80, color: '#4C9F38' },
    { sdg: 9, name: 'Innovation', metric: `${userGrowth[userGrowth.length - 1]?.users || 0} operators digitized`, progress: 60, color: '#F36D25' },
    { sdg: 11, name: 'Sustainable Cities', metric: `${congestionReduction}% less peak-hour clustering`, progress: 78, color: '#F99D26' },
    { sdg: 12, name: 'Responsible Consumption', metric: `${lastEnv?.fuelSaved || 0}L fuel saved`, progress: 70, color: '#BF8B2E' },
    { sdg: 13, name: 'Climate Action', metric: `${lastEnv?.co2Saved || 0} kg CO₂ avoided`, progress: 85, color: '#48773E' },
    { sdg: 17, name: 'Partnerships', metric: '12 municipal partnerships', progress: 50, color: '#183668' },
  ];

  const periodButtons = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Period Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-400" />
            Platform Analytics
          </h1>
          <p className="text-slate-400 mt-1">System-wide performance, congestion, and sustainability metrics</p>
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {periodButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === btn.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Congestion Reduction</p>
                <p className="text-2xl font-bold text-white mt-1">{congestionReduction}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">vs pre-platform</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Delivery Compliance</p>
                <p className="text-2xl font-bold text-white mt-1">{totalCompliance}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">on-time rate</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Fuel Saved</p>
                <p className="text-2xl font-bold text-white mt-1">{lastEnv?.fuelSaved || 0} L</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">cumulative</span>
                </div>
              </div>
              <Fuel className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">CO₂ Avoided</p>
                <p className="text-2xl font-bold text-white mt-1">{lastEnv?.co2Saved || 0} kg</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">≈ {Math.round((lastEnv?.co2Saved || 0) / 21)} trees</span>
                </div>
              </div>
              <Leaf className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Congestion Trend + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Peak-Hour Congestion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={congestionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(congestionTrend.length / 6)} />
                <YAxis tick={CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="beforePlatform" stroke="#ef4444" strokeWidth={2} dot={false} name="Before Platform" />
                <Line type="monotone" dataKey="afterPlatform" stroke="#22c55e" strokeWidth={2} dot={false} name="After Platform" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(userGrowth.length / 6)} />
                <YAxis tick={CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Area type="monotone" dataKey="users" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Total Users" />
                <Area type="monotone" dataKey="drivers" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Drivers" />
                <Area type="monotone" dataKey="organizations" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Organizations" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Vehicle Distribution + Compliance Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Vehicles per Time Window</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timeWindowData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
                <XAxis dataKey="window" tick={CHART_THEME.axis} />
                <YAxis tick={CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Bar dataKey="vehicles" radius={[4, 4, 0, 0]}>
                  {timeWindowData.map((entry, i) => (
                    <Cell key={i} fill={entry.vehicles > 35 ? '#ef4444' : entry.vehicles > 25 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Time-Window Compliance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {complianceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...CHART_THEME.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Environmental Impact */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Environmental Impact Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={environmentalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} />
              <XAxis dataKey="date" tick={CHART_THEME.axis} interval={Math.floor(environmentalTrend.length / 8)} />
              <YAxis tick={CHART_THEME.axis} />
              <Tooltip {...CHART_THEME.tooltip} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Area type="monotone" dataKey="co2Saved" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="CO₂ Saved (kg)" />
              <Area type="monotone" dataKey="fuelSaved" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Fuel Saved (L)" />
              <Area type="monotone" dataKey="noxReduced" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} name="NOx Reduced (g)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row 4: Top Operators + SDG Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Top 5 Operators by Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOperators.map((op, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{op.name}</span>
                      <span className="text-xs text-emerald-400">{op.compliance}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${op.compliance}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{op.deliveries} deliveries</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">UN SDG Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sdgCards.map((sdg) => (
                <div key={sdg.sdg} className="flex items-center gap-3">
                  <Badge className="text-xs" style={{ backgroundColor: `${sdg.color}20`, color: sdg.color, borderColor: `${sdg.color}40` }}>
                    SDG {sdg.sdg}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{sdg.name}</span>
                      <span className="text-xs text-slate-500">{sdg.metric}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div className="h-1 rounded-full" style={{ width: `${sdg.progress}%`, backgroundColor: sdg.color }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
