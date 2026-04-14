import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { AlertTriangle, ThumbsUp, ThumbsDown, Plus, MapPin, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'road_condition', label: 'Road Condition', types: ['Pothole', 'Road Damage', 'Waterlogging', 'Debris', 'Construction'] },
  { value: 'weather', label: 'Weather/Climate', types: ['Heavy Fog', 'Heavy Rain', 'Flooding', 'Dust Storm'] },
  { value: 'traffic_incident', label: 'Traffic Incident', types: ['Accident', 'Vehicle Breakdown', 'Road Closure', 'Police Checkpoint', 'Procession'] },
  { value: 'route_advisory', label: 'Route Advisory', types: ['Alternative Route', 'Signal Malfunction', 'Slow Zone'] },
];

const severityStyles = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  minor: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

// Location picker component for the map
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });
  return position ? <Marker position={position} /> : null;
}

const statusStyles = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  under_review: { bg: 'bg-amber-50', text: 'text-amber-700' },
  resolved: { bg: 'bg-blue-50', text: 'text-blue-700' },
  invalid: { bg: 'bg-gray-50', text: 'text-gray-500' },
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    lat: '19.076', lng: '72.878', category: 'traffic_incident',
    report_type: 'Accident', severity: 'moderate', description: '', time_advisory: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [reportPosition, setReportPosition] = useState([19.076, 72.878]);

  const fetchReports = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const { data } = await axios.get(`${API}/reports`, { params, withCredentials: true });
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  }, [filter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleVote = async (reportId, voteType) => {
    try {
      await axios.post(`${API}/reports/${reportId}/vote`, { vote_type: voteType }, { withCredentials: true });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/reports`, {
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        category: form.category, report_type: form.report_type,
        severity: form.severity, description: form.description,
        time_advisory: form.time_advisory || null
      }, { withCredentials: true });
      setDialogOpen(false);
      setForm({ lat: '19.076', lng: '72.878', category: 'traffic_incident', report_type: 'Accident', severity: 'moderate', description: '', time_advisory: '' });
      setReportPosition([19.076, 72.878]);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.detail || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Update position when lat/lng inputs change
  const updatePositionFromInputs = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      setReportPosition([latNum, lngNum]);
    }
  };

  const selectedCat = categories.find(c => c.value === form.category);

  const timeSince = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="reports-page">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
              Ground Reports
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">Community road safety reports</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-report-btn" className="bg-[#002FA7] hover:bg-[#002FA7]/90">
                <Plus className="w-4 h-4 mr-1" /> Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'IBM Plex Sans' }}>Submit Ground Report</DialogTitle>
                <DialogDescription>Report road conditions, weather, traffic incidents or route advisories.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Map Location Picker */}
                <div style={{ height: 200, marginBottom: 12, borderRadius: 8, overflow: "hidden" }}>
                  <MapContainer center={[19.076, 72.878]} zoom={12} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker 
                      position={reportPosition} 
                      setPosition={(pos) => {
                        setReportPosition(pos);
                        // Also update the lat/lng form fields
                        setForm(prev => ({ ...prev, lat: pos[0].toFixed(6), lng: pos[1].toFixed(6) }));
                      }} 
                    />
                  </MapContainer>
                </div>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Click on the map to set location, or type coordinates below:</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Latitude</Label>
                    <Input 
                      data-testid="report-lat" 
                      type="number" 
                      step="any" 
                      value={form.lat} 
                      onChange={e => {
                        setForm({...form, lat: e.target.value});
                        updatePositionFromInputs(e.target.value, form.lng);
                      }} 
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input 
                      data-testid="report-lng" 
                      type="number" 
                      step="any" 
                      value={form.lng} 
                      onChange={e => {
                        setForm({...form, lng: e.target.value});
                        updatePositionFromInputs(form.lat, e.target.value);
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v, report_type: categories.find(c => c.value === v)?.types[0] || ''})}>
                    <SelectTrigger data-testid="report-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.report_type} onValueChange={v => setForm({...form, report_type: v})}>
                    <SelectTrigger data-testid="report-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selectedCat?.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <RadioGroup value={form.severity} onValueChange={v => setForm({...form, severity: v})} className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="minor" id="sev-minor" data-testid="severity-minor" />
                      <Label htmlFor="sev-minor" className="text-sm text-emerald-700 cursor-pointer">Minor</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="moderate" id="sev-mod" data-testid="severity-moderate" />
                      <Label htmlFor="sev-mod" className="text-sm text-amber-700 cursor-pointer">Moderate</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="critical" id="sev-crit" data-testid="severity-critical" />
                      <Label htmlFor="sev-crit" className="text-sm text-red-700 cursor-pointer">Critical</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea data-testid="report-description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the issue..." rows={3} required />
                </div>
                <div>
                  <Label>Time Advisory (optional)</Label>
                  <Input data-testid="report-advisory" value={form.time_advisory} onChange={e => setForm({...form, time_advisory: e.target.value})} placeholder="e.g., Avoid 2-4 PM today" />
                </div>
                <Button type="submit" data-testid="submit-report-btn" className="w-full bg-[#002FA7]" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'under_review', 'resolved'].map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                filter === f ? 'bg-[#002FA7] text-white border-[#002FA7]' : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#002FA7]'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Reports list */}
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] p-8 text-center text-sm text-[#6B7280]">
              No reports found
            </div>
          ) : (
            reports.map(report => {
              const sStyle = severityStyles[report.severity] || severityStyles.minor;
              const stStyle = statusStyles[report.status] || statusStyles.active;
              return (
                <div
                  key={report.report_id}
                  data-testid={`report-card-${report.report_id}`}
                  className="bg-white border border-[#E5E7EB] p-4 hover:border-[#002FA7]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${sStyle.bg} ${sStyle.text} ${sStyle.border} border text-[10px]`}>
                          {report.severity.toUpperCase()}
                        </Badge>
                        <Badge className={`${stStyle.bg} ${stStyle.text} border text-[10px]`}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-[#6B7280]">{report.report_type}</span>
                      </div>
                      <p className="text-sm font-medium text-[#0A0A0A] mt-1">{report.description}</p>
                      {report.time_advisory && (
                        <p className="text-xs text-[#002FA7] font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {report.time_advisory}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="font-mono">{report.lat}, {report.lng}</span>
                        </span>
                        <span>By {report.user_name}</span>
                        <span>{timeSince(report.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 ml-4">
                      <button
                        data-testid={`upvote-${report.report_id}`}
                        onClick={() => handleVote(report.report_id, 'upvote')}
                        className="p-1.5 hover:bg-emerald-50 text-[#6B7280] hover:text-emerald-600 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-sm font-bold text-[#0A0A0A]">{report.upvotes - report.downvotes}</span>
                      <button
                        data-testid={`downvote-${report.report_id}`}
                        onClick={() => handleVote(report.report_id, 'downvote')}
                        className="p-1.5 hover:bg-red-50 text-[#6B7280] hover:text-red-600 transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
