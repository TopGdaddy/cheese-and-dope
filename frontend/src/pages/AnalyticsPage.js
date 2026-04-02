import { useState, useMemo } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  TrendingDown, 
  TrendingUp, 
  Fuel, 
  Leaf, 
  CheckCircle, 
  Users,
  Building2,
  Heart,
  Handshake
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Generate realistic time-series data based on period
const generateCongestionTrend = (days) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      beforePlatform: Math.floor(38 + Math.random() * 15),  // 38-53 vehicles/hr
      afterPlatform: Math.floor(18 + Math.random() * 10),   // 18-28 vehicles/hr
    };
  });
};

// Time window data
const timeWindowData = [
  { window: '6-8 AM', vehicles: 45, fill: '#22c55e' },
  { window: '8-10 AM', vehicles: 38, fill: '#22c55e' },
  { window: '10-12 PM', vehicles: 28, fill: '#3b82f6' },
  { window: '12-2 PM', vehicles: 22, fill: '#3b82f6' },
  { window: '2-4 PM', vehicles: 31, fill: '#f97316' },
  { window: '4-6 PM', vehicles: 42, fill: '#f97316' },
  { window: '6-8 PM', vehicles: 35, fill: '#22c55e' },
  { window: '8-10 PM', vehicles: 15, fill: '#22c55e' },
];

// Compliance pie data
const complianceData = [
  { name: 'On-Time', value: 73, color: '#22c55e' },
  { name: 'Early', value: 21, color: '#3b82f6' },
  { name: 'Late', value: 6, color: '#ef4444' },
];

// Top operators data
const operatorsData = [
  { name: 'Mumbai Express Logistics', compliance: 98.2 },
  { name: 'Rapid Freight Solutions', compliance: 96.7 },
  { name: 'City Courier Services', compliance: 94.1 },
  { name: 'Western Line Transport', compliance: 91.8 },
  { name: 'Harbor Cargo Movers', compliance: 89.5 },
];

// SDG Impact data
const sdgImpactData = [
  { number: 3, name: 'Good Health', description: 'Air Quality Index improved by 12%', progress: 80, icon: Heart, color: '#4C9F38' },
  { number: 9, name: 'Innovation', description: '156 operators digitized', progress: 60, icon: Building2, color: '#F36D25' },
  { number: 11, name: 'Sustainable Cities', description: '32% less peak-hour clustering', progress: 78, icon: Users, color: '#F99D26' },
  { number: 12, name: 'Responsible Consumption', description: '1,247L fuel saved this month', progress: 70, icon: Leaf, color: '#BF8B2E' },
  { number: 13, name: 'Climate Action', description: '2.89 tons CO₂ emissions avoided', progress: 85, icon: Leaf, color: '#48773E' },
  { number: 17, name: 'Partnerships', description: '12 municipal partnerships active', progress: 50, icon: Handshake, color: '#183668' },
];

// KPI Data generator based on period
const getKPIData = (period) => {
  const multipliers = { '7': 1, '30': 4.2, '90': 12 };
  const m = multipliers[period] || 1;
  return {
    congestionReduction: { value: 32.5, change: -8.2, positive: true },
    deliveryCompliance: { value: 94.2, change: 3.5, positive: true },
    fuelSaved: { value: Math.round(1247 * m), change: 18.3, positive: true },
    co2Reduced: { value: Math.round(2891 * m), change: 24.1, positive: true },
  };
};

const KPICard = ({ title, value, unit, change, positive, icon: Icon, color }) => (
  <Card className="p-4 bg-slate-900 border-slate-800">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: 'IBM Plex Sans' }}>
          {value}{unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
        </p>
        <div className={`flex items-center gap-1 mt-2 text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{change > 0 ? '+' : ''}{change}% vs last period</span>
        </div>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </Card>
);

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const kpiData = useMemo(() => getKPIData(period), [period]);
  const congestionData = useMemo(() => generateCongestionTrend(parseInt(period)), [period]);
  const environmentalData = useMemo(() => {
    const days = parseInt(period);
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const progress = i / days;
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        co2Saved: Math.floor(progress * 2891 * (days / 30) + Math.random() * 50),
        noxReduced: Math.floor(progress * 145 * (days / 30) + Math.random() * 5),
        fuelSaved: Math.floor(progress * 1247 * (days / 30) + Math.random() * 20),
      };
    });
  }, [period]);

  return (
    <div className="flex-1 overflow-auto p-6 bg-slate-950" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'IBM Plex Sans' }}>
            Analytics & Sustainability
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track congestion reduction, environmental impact, and fleet performance
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { key: '7', label: '7 Days' },
            { key: '30', label: '30 Days' },
            { key: '90', label: '3 Months' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              onClick={() => setPeriod(key)}
              className={period === key 
                ? 'bg-[#002FA7] text-white hover:bg-[#002FA7]/90' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Congestion Reduction"
          value={kpiData.congestionReduction.value}
          unit="%"
          change={kpiData.congestionReduction.change}
          positive={kpiData.congestionReduction.positive}
          icon={TrendingDown}
          color="bg-emerald-500/20"
        />
        <KPICard
          title="Delivery Compliance"
          value={kpiData.deliveryCompliance.value}
          unit="%"
          change={kpiData.deliveryCompliance.change}
          positive={kpiData.deliveryCompliance.positive}
          icon={CheckCircle}
          color="bg-blue-500/20"
        />
        <KPICard
          title="Fuel Saved"
          value={kpiData.fuelSaved.value.toLocaleString()}
          unit="L"
          change={kpiData.fuelSaved.change}
          positive={kpiData.fuelSaved.positive}
          icon={Fuel}
          color="bg-amber-500/20"
        />
        <KPICard
          title="CO₂ Reduced"
          value={kpiData.co2Reduced.value.toLocaleString()}
          unit="kg"
          change={kpiData.co2Reduced.change}
          positive={kpiData.co2Reduced.positive}
          icon={Leaf}
          color="bg-green-500/20"
        />
      </div>

      {/* Congestion Trend Chart */}
      <Card className="p-4 bg-slate-900 border-slate-800 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
          Peak-Hour Congestion Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={congestionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Line 
              type="monotone" 
              dataKey="beforePlatform" 
              stroke="#64748b" 
              strokeWidth={2}
              dot={false}
              name="Before Platform"
            />
            <Line 
              type="monotone" 
              dataKey="afterPlatform" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={false}
              name="After Platform"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Two Column Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Vehicles per Time Window */}
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
            Vehicles per Time Window
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeWindowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="window" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="vehicles" radius={[4, 4, 0, 0]}>
                {timeWindowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Time Window Compliance */}
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
            Time-Window Compliance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={complianceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {complianceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ color: '#94a3b8' }}
                formatter={(value) => `${value}: ${complianceData.find(d => d.name === value)?.value}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Environmental Impact Area Chart */}
      <Card className="p-4 bg-slate-900 border-slate-800 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
          Environmental Impact Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={environmentalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Area 
              type="monotone" 
              dataKey="co2Saved" 
              stackId="1" 
              stroke="#22c55e" 
              fill="#22c55e" 
              fillOpacity={0.6}
              name="CO₂ Saved (kg)"
            />
            <Area 
              type="monotone" 
              dataKey="noxReduced" 
              stackId="1" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
              name="NOx Reduced (kg)"
            />
            <Area 
              type="monotone" 
              dataKey="fuelSaved" 
              stackId="1" 
              stroke="#f59e0b" 
              fill="#f59e0b" 
              fillOpacity={0.6}
              name="Fuel Saved (L)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* SDG Impact Cards */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
          SDG Impact Progress
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sdgImpactData.map((sdg) => (
            <Card key={sdg.number} className="p-4 bg-slate-900 border-slate-800">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sdg.color}20` }}
                >
                  <span className="text-sm font-bold" style={{ color: sdg.color }}>
                    {sdg.number}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white">{sdg.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{sdg.description}</p>
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${sdg.progress}%`,
                          backgroundColor: sdg.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{sdg.progress}% target achieved</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Operators */}
      <Card className="p-4 bg-slate-900 border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
          Top 5 Operators by Compliance
        </h3>
        <div className="space-y-3">
          {operatorsData.map((op, idx) => (
            <div key={op.name} className="flex items-center gap-4">
              <span className="text-sm text-slate-500 w-6">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{op.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${op.compliance}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-emerald-400 w-12 text-right">
                  {op.compliance}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
