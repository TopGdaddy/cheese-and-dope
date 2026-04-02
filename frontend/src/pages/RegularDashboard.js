import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, AlertTriangle, Activity } from 'lucide-react';

export default function RegularDashboard() {
  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="text-slate-400">City logistics overview and traffic information</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Congestion Level</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Moderate</div>
            <p className="text-xs text-slate-500">Mumbai average right now</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">7</div>
            <p className="text-xs text-slate-500">In your area</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Nearby Deliveries</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-slate-500">Active in 5km radius</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-slate-900 border-slate-800 p-6">
        <p className="text-slate-400">View the live map or submit ground reports to help improve city logistics.</p>
      </Card>
    </div>
  );
}
