import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { UserCheck, UserPlus, UserMinus, Mail, Truck, MapPin, AlertTriangle, CheckCircle, Loader2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrgDrivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/org/drivers`, { withCredentials: true });
      setDrivers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.detail || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleLinkDriver = async (e) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;

    setLinkLoading(true);
    setLinkMessage(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/org/drivers/link`,
        { driver_email: linkEmail.trim() },
        { withCredentials: true }
      );
      setLinkMessage({ type: 'success', text: response.data.message });
      setLinkEmail('');
      fetchDrivers(); // Refresh list
    } catch (err) {
      setLinkMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to link driver'
      });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkDriver = async (driverId, driverName) => {
    if (!window.confirm(`Remove ${driverName} from your organization? They will no longer be assigned to your deliveries.`)) return;

    try {
      await axios.post(
        `${API_URL}/api/org/drivers/unlink`,
        { driver_id: driverId },
        { withCredentials: true }
      );
      setLinkMessage({ type: 'success', text: `${driverName} has been unlinked.` });
      fetchDrivers(); // Refresh list
    } catch (err) {
      setLinkMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to unlink driver'
      });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#F3F4F6] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2" style={{ fontFamily: 'IBM Plex Sans' }}>
          <UserCheck className="h-6 w-6 text-[#002FA7]" />
          My Drivers
        </h1>
        <p className="text-[#6B7280] mt-1 text-sm">Manage and verify drivers linked to your organization</p>
      </div>

      {/* Link Driver Form */}
      <Card className="bg-white border border-[#E5E7EB]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#111827] flex items-center gap-2" style={{ fontFamily: 'IBM Plex Sans' }}>
            <UserPlus className="h-4 w-4 text-[#10B981]" />
            Link a Driver
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#6B7280] mb-3">
            The driver must already have an account on UrbanLogix with the "driver" role. Enter their registered email to link them to your organization.
          </p>
          <form onSubmit={handleLinkDriver} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="driver@example.com"
                className="w-full bg-white border border-[#E5E7EB] text-[#111827] rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] focus:border-[#002FA7] placeholder:text-[#9CA3AF]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={linkLoading || !linkEmail.trim()}
              className="bg-[#002FA7] hover:bg-[#002FA7]/90 text-white disabled:opacity-50 px-6"
            >
              {linkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Link Driver
                </>
              )}
            </Button>
          </form>

          {/* Link Message */}
          {linkMessage && (
            <div className={`mt-3 flex items-center gap-2 text-sm p-3 rounded-lg ${
              linkMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {linkMessage.type === 'success'
                ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                : <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              }
              <span>{linkMessage.text}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card className="bg-white border border-[#E5E7EB]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#111827]" style={{ fontFamily: 'IBM Plex Sans' }}>
              Linked Drivers ({drivers.length})
            </CardTitle>
            <Button onClick={fetchDrivers} variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#111827]">
              <Loader2 className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#002FA7]" />
              <span className="ml-2 text-[#6B7280]">Loading drivers...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 text-sm">{error}</p>
              <Button onClick={fetchDrivers} variant="outline" size="sm" className="mt-3 border-[#E5E7EB] text-[#374151]">
                Retry
              </Button>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-[#6B7280] text-sm">No drivers linked yet</p>
              <p className="text-[#9CA3AF] text-xs mt-1">Use the form above to link drivers by their email</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div
                  key={driver._id}
                  className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      driver.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-[#E5E7EB] text-[#6B7280]'
                    }`}>
                      {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    
                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">{driver.name}</span>
                        <Badge className={`text-xs ${
                          driver.is_active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-[#E5E7EB] text-[#6B7280] border-[#D1D5DB]'
                        }`}>
                          {driver.is_active ? '● Active' : '○ Offline'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6B7280]">{driver.email}</p>
                      {driver.last_position && (
                        <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {driver.last_position.lat?.toFixed(4)}, {driver.last_position.lng?.toFixed(4)}
                          {driver.last_position.route_name && ` — ${driver.last_position.route_name}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => handleUnlinkDriver(driver._id, driver.name)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#6B7280] space-y-1">
              <p className="font-semibold text-[#374151]">How driver verification works:</p>
              <p>1. The driver must first create their own account at UrbanLogix and select "Driver" as their role.</p>
              <p>2. You enter their registered email address in the form above to link them to your organization.</p>
              <p>3. Once linked, they can be assigned to your delivery slots and their trips will count towards your organization's analytics.</p>
              <p>4. Drivers can only be linked to one organization at a time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
