import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MapPin, Navigation, Gauge, Compass, Radio, Square, Play, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;

export default function DriverPage() {
  const { user } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [trip, setTrip] = useState(null);
  const watchRef = useRef(null);
  const socketRef = useRef(null);

  const fetchTrip = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/driver/trip`, { withCredentials: true });
      if (data.status === 'active') {
        setTrip(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTrip();
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchTrip]);

  const startTracking = async () => {
    // Check GPS support first
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please use a modern browser with GPS capability.');
      return;
    }

    // Connect Socket.IO
    const socket = io(SOCKET_URL, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket.IO connected for GPS broadcasting');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setSocketConnected(false);
    });

    // Start trip on backend
    try {
      await axios.post(`${API}/driver/start-trip`, {}, { withCredentials: true });
      setTrip({ status: 'active', started_at: new Date().toISOString() });
      setTracking(true);
      setGpsError(null);
    } catch (err) {
      setGpsError('Failed to start trip on server.');
      socket.disconnect();
      return;
    }

    // Start watching GPS position
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: (pos.coords.speed || 0) * 3.6, // m/s to km/h
          heading: pos.coords.heading || 0,
          accuracy: pos.coords.accuracy || 0
        };
        setPosition(loc);
        setGpsError(null);

        // Send via Socket.IO for instant broadcast
        socket.emit('location-update', {
          driver_id: user.id,
          driver_name: user.name,
          org_name: user.organization_id ? 'Organization' : 'Independent',
          lat: loc.lat,
          lng: loc.lng,
          speed: loc.speed,
          heading: loc.heading,
          accuracy: loc.accuracy
        });
        setUpdateCount(c => c + 1);
      },
      (err) => {
        // Real GPS error - no fake fallback
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location permission denied. Please enable location access in your browser settings and reload.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Position unavailable. Make sure GPS is enabled on your device and you are outdoors.');
            break;
          case err.TIMEOUT:
            setGpsError('GPS request timed out. Retrying... Make sure you have a clear view of the sky.');
            break;
          default:
            setGpsError(`GPS error: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = async () => {
    // Stop GPS watch
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    // Notify server via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('stop-tracking', { driver_id: user.id });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Also call REST API
    try {
      await axios.post(`${API}/driver/stop-trip`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Stop trip error:', err);
    }

    setTracking(false);
    setTrip(null);
    setPosition(null);
    setUpdateCount(0);
    setSocketConnected(false);
    setGpsError(null);
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="driver-page">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6" style={{ fontFamily: 'IBM Plex Sans' }}>
          Driver Control Panel
        </h1>

        {/* GPS Status */}
        <div className="bg-white border border-[#E5E7EB] p-6 mb-4" data-testid="gps-status-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className={`w-5 h-5 ${tracking ? 'text-[#E02424]' : 'text-[#6B7280]'}`} />
              <h2 className="text-lg font-bold" style={{ fontFamily: 'IBM Plex Sans' }}>
                GPS Tracking
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {tracking && (
                <Badge
                  data-testid="socket-status-badge"
                  variant={socketConnected ? "default" : "secondary"}
                  className={`text-[10px] ${socketConnected ? 'bg-[#10B981]' : ''}`}
                >
                  {socketConnected ? 'SOCKET LIVE' : 'CONNECTING...'}
                </Badge>
              )}
              <Badge
                data-testid="tracking-status-badge"
                variant={tracking ? "destructive" : "secondary"}
                className="text-xs"
              >
                {tracking ? 'BROADCASTING' : 'INACTIVE'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-[#6B7280]">
            {tracking && socketConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4" />}
            <span>Driver: {user?.name}</span>
          </div>

          {!tracking ? (
            <Button
              data-testid="start-trip-btn"
              className="w-full bg-[#10B981] hover:bg-[#10B981]/90 text-white h-12 text-base"
              onClick={startTracking}
            >
              <Play className="w-5 h-5 mr-2" /> Start Trip
            </Button>
          ) : (
            <Button
              data-testid="stop-trip-btn"
              className="w-full bg-[#E02424] hover:bg-[#E02424]/90 text-white h-12 text-base"
              onClick={stopTracking}
            >
              <Square className="w-5 h-5 mr-2" /> Stop Trip
            </Button>
          )}

          {gpsError && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 text-red-700" data-testid="gps-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">GPS Error</p>
                <p className="text-xs mt-0.5">{gpsError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Position Data */}
        {tracking && (
          <div className="bg-white border border-[#E5E7EB] p-6 mb-4" data-testid="position-data">
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
              Live Position Data
            </h3>
            {position ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F3F4F6] p-3 border border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">Coordinates</span>
                  </div>
                  <p className="font-mono text-sm font-bold" data-testid="position-coords">
                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                  </p>
                </div>
                <div className="bg-[#F3F4F6] p-3 border border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gauge className="w-3 h-3 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">Speed</span>
                  </div>
                  <p className="font-mono text-sm font-bold" data-testid="position-speed">
                    {position.speed.toFixed(1)} km/h
                  </p>
                </div>
                <div className="bg-[#F3F4F6] p-3 border border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Compass className="w-3 h-3 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">Heading</span>
                  </div>
                  <p className="font-mono text-sm font-bold" data-testid="position-heading">
                    {position.heading.toFixed(0)}&deg;
                  </p>
                </div>
                <div className="bg-[#F3F4F6] p-3 border border-[#E5E7EB]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Navigation className="w-3 h-3 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">Updates Sent</span>
                  </div>
                  <p className="font-mono text-sm font-bold" data-testid="update-count">
                    {updateCount}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[#6B7280]">
                <MapPin className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Waiting for GPS signal...</p>
                <p className="text-xs mt-1">Ensure location permissions are granted</p>
              </div>
            )}
          </div>
        )}

        {/* Trip Info */}
        {trip && trip.status === 'active' && (
          <div className="bg-white border border-[#E5E7EB] p-6 mb-4" data-testid="trip-info">
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: 'IBM Plex Sans' }}>Trip Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Status</span>
                <Badge variant="destructive" className="text-[10px]">IN TRANSIT</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Connection</span>
                <span className="font-mono text-xs">{socketConnected ? 'WebSocket' : 'Connecting...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Started</span>
                <span className="font-mono">{new Date(trip.started_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Accuracy</span>
                <span className="font-mono">{position ? `${position.accuracy.toFixed(0)}m` : 'Waiting...'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!tracking && (
          <div className="bg-[#E0E7FF] border border-[#002FA7]/20 p-4 mt-4" data-testid="driver-instructions">
            <h3 className="text-sm font-bold text-[#002FA7] mb-2" style={{ fontFamily: 'IBM Plex Sans' }}>
              How GPS Tracking Works
            </h3>
            <ul className="text-xs text-[#002FA7]/80 space-y-1.5">
              <li>1. Click "Start Trip" to begin broadcasting your real location</li>
              <li>2. Your browser will ask for location permission - tap "Allow"</li>
              <li>3. Your position is sent via <strong>WebSocket</strong> for instant updates on the Live Map</li>
              <li>4. Uses your device's real GPS (same as Google Maps / Uber)</li>
              <li>5. Your marker appears as a <strong>red pulsing dot</strong> on the map</li>
              <li>6. Click "Stop Trip" when done - your marker is removed</li>
            </ul>
            <div className="mt-3 p-2 bg-white/50 border border-[#002FA7]/10">
              <p className="text-xs text-[#002FA7]/70">
                <strong>Tip:</strong> Use Chrome or Safari on your phone. Works best outdoors with clear sky view for accurate GPS.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
