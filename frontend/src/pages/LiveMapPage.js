import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { RefreshCw, MapPin, Truck, AlertTriangle, Eye, EyeOff, Wifi, Navigation, Route } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;

const createTruckIcon = (isMock) => {
  const color = isMock ? '#002FA7' : '#E02424';
  const pulseClass = isMock ? '' : 'live-marker';
  return L.divIcon({
    className: '',
    html: `<div class="${pulseClass}" style="
      width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16]
  });
};

const severityColors = { critical: '#E02424', moderate: '#FACA15', minor: '#10B981' };

const createReportIcon = (severity) => {
  const color = severityColors[severity] || '#6B7280';
  const cls = severity === 'critical' ? 'critical-marker' : '';
  return L.divIcon({
    className: '',
    html: `<div class="${cls}" style="width:22px;height:22px;background:${color};border:2px solid white;border-radius:4px;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14]
  });
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LiveMapPage() {
  const [trucks, setTrucks] = useState([]);
  const [reports, setReports] = useState([]);
  const [trails, setTrails] = useState({});
  const [showMock, setShowMock] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showCongestionZones, setShowCongestionZones] = useState(true);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [followTruck, setFollowTruck] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const trailsRef = useRef({});
  const socketRef = useRef(null);

  // MOCK DATA — Replace with API call to GET /api/congestion-zones when backend supports it
  const congestionZones = [
    { id: 1, name: 'Crawford Market', lat: 18.9475, lng: 72.8335, level: 'high', vehicles: 23, threshold: 15, radius: 1000 },
    { id: 2, name: 'Andheri Station', lat: 19.1197, lng: 72.8464, level: 'high', vehicles: 19, threshold: 15, radius: 900 },
    { id: 3, name: 'Dadar TT Circle', lat: 19.0178, lng: 72.8478, level: 'medium', vehicles: 12, threshold: 15, radius: 850 },
    { id: 4, name: 'Borivali East', lat: 19.2288, lng: 72.8567, level: 'low', vehicles: 5, threshold: 15, radius: 800 },
    { id: 5, name: 'Powai Lake Area', lat: 19.1176, lng: 72.9060, level: 'medium', vehicles: 9, threshold: 15, radius: 900 },
    { id: 6, name: 'BKC Junction', lat: 19.0596, lng: 72.8656, level: 'high', vehicles: 21, threshold: 15, radius: 1100 },
    { id: 7, name: 'Vashi APMC', lat: 19.0771, lng: 72.9987, level: 'medium', vehicles: 11, threshold: 15, radius: 950 },
    { id: 8, name: 'Thane Wagle Estate', lat: 19.1975, lng: 72.9569, level: 'low', vehicles: 4, threshold: 15, radius: 800 },
  ];

  const congestionColors = { high: '#ef4444', medium: '#f97316', low: '#22c55e' };

  // MOCK DATA — Replace with API call to GET /api/route-suggestions when backend supports it
  const mockRoutes = {
    optimal: {
      name: 'Optimal Route (Low Congestion)',
      positions: [
        [19.0760, 72.8777], [19.0890, 72.8650], [19.1020, 72.8720],
        [19.1150, 72.8550], [19.1280, 72.8680], [19.1400, 72.8500]
      ],
      color: '#22c55e',
      distance: '12.3 km',
      time: '28 min',
      fuelSaving: '15%',
      congestionScore: 'Low'
    },
    alternative: {
      name: 'Alternative Route',
      positions: [
        [19.0760, 72.8777], [19.0850, 72.8900], [19.1000, 72.8850],
        [19.1180, 72.8780], [19.1300, 72.8650], [19.1400, 72.8500]
      ],
      color: '#3b82f6',
      distance: '14.1 km',
      time: '35 min',
      fuelSaving: '8%',
      congestionScore: 'Medium'
    }
  };

  // Initial data fetch via REST
  const fetchInitialData = useCallback(async () => {
    try {
      const [posRes, repRes] = await Promise.all([
        axios.get(`${API}/trucks/live-positions`, { withCredentials: true }),
        axios.get(`${API}/reports`, { withCredentials: true })
      ]);
      setTrucks(posRes.data);
      setReports(repRes.data);
      setLastUpdate(new Date());

      // Initialize trails from current positions
      const newTrails = {};
      posRes.data.forEach(t => {
        newTrails[t.truck_id] = [[t.lat, t.lng]];
      });
      trailsRef.current = newTrails;
      setTrails({ ...newTrails });
    } catch (err) {
      console.error('Initial fetch error:', err);
    }
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    fetchInitialData();

    // Connect to Socket.IO for live truck position updates
    const socket = io(SOCKET_URL, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket.IO connected - receiving real-time truck updates');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Real-time truck position update
    socket.on('truck-position-update', (data) => {
      setTrucks(prev => {
        const idx = prev.findIndex(t => t.truck_id === data.truck_id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });

      // Update trail
      const tid = data.truck_id;
      if (!trailsRef.current[tid]) trailsRef.current[tid] = [];
      const trail = trailsRef.current[tid];
      const last = trail[trail.length - 1];
      if (!last || last[0] !== data.lat || last[1] !== data.lng) {
        trail.push([data.lat, data.lng]);
        if (trail.length > 50) trailsRef.current[tid] = trail.slice(-50);
      }
      setTrails({ ...trailsRef.current });
      setLastUpdate(new Date());

      // Update selected truck if same one
      setSelectedTruck(prev => {
        if (prev && prev.truck_id === data.truck_id) return data;
        return prev;
      });
    });

    // Truck removed (driver stopped trip)
    socket.on('truck-removed', (data) => {
      setTrucks(prev => prev.filter(t => t.truck_id !== data.truck_id));
      delete trailsRef.current[data.truck_id];
      setTrails({ ...trailsRef.current });
    });

    // Refresh reports periodically (less critical, 30s interval)
    const reportInterval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/reports`, { withCredentials: true });
        setReports(data);
      } catch (err) {
        console.error(err);
      }
    }, 30000);

    return () => {
      socket.disconnect();
      clearInterval(reportInterval);
    };
  }, [fetchInitialData]);

  const displayTrucks = showMock ? trucks : trucks.filter(t => !t.is_mock);
  const mockCount = trucks.filter(t => t.is_mock).length;
  const liveCount = trucks.filter(t => !t.is_mock).length;

  return (
    <div className="flex-1 relative" data-testid="live-map-page">
      <MapContainer
        center={[19.076, 72.8777]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        {followTruck && <MapUpdater center={followTruck} />}

        {displayTrucks.map(truck => (
          <Marker
            key={truck.truck_id}
            position={[truck.lat, truck.lng]}
            icon={createTruckIcon(truck.is_mock)}
            eventHandlers={{ click: () => setSelectedTruck(truck) }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]" data-testid={`truck-popup-${truck.truck_id}`}>
                <div className="font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>
                  {truck.driver_name}
                </div>
                <div className="text-[#6B7280] text-xs">{truck.org_name}</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div><span className="text-[#6B7280]">Speed:</span> <span className="font-mono font-medium">{truck.speed} km/h</span></div>
                  <div><span className="text-[#6B7280]">Route:</span> {truck.route_name}</div>
                  <div className="flex items-center gap-1"><span className="text-[#6B7280]">Status:</span>
                    <Badge variant={truck.is_mock ? "secondary" : "destructive"} className="text-[10px]">
                      {truck.is_mock ? 'Simulated' : 'LIVE'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {Object.entries(trails).map(([id, points]) => {
          if (!showMock && id.startsWith('mock_')) return null;
          if (points.length < 2) return null;
          const isMock = id.startsWith('mock_');
          return (
            <Polyline
              key={id}
              positions={points}
              pathOptions={{ color: isMock ? '#002FA7' : '#E02424', weight: 2, opacity: 0.4, dashArray: '6, 8' }}
            />
          );
        })}

        {showReports && reports.filter(r => r.status === 'active').map(report => (
          <Marker
            key={report.report_id}
            position={[report.lat, report.lng]}
            icon={createReportIcon(report.severity)}
          >
            <Popup>
              <div className="text-sm min-w-[180px]" data-testid={`report-popup-${report.report_id}`}>
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" style={{ color: severityColors[report.severity] }} />
                  <span className="font-bold text-xs uppercase">{report.severity}</span>
                </div>
                <div className="font-medium text-[#0A0A0A]">{report.report_type}</div>
                <div className="text-[#6B7280] text-xs mt-1">{report.description}</div>
                {report.time_advisory && (
                  <div className="text-xs mt-1 text-[#002FA7] font-medium">{report.time_advisory}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Congestion Zone Circles */}
        {showCongestionZones && congestionZones.map(zone => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: congestionColors[zone.level],
              fillColor: congestionColors[zone.level],
              fillOpacity: 0.15,
              weight: 2,
              dashArray: zone.level === 'high' ? '' : '5,5'
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-base">{zone.name}</p>
                <p>Status: <span style={{color: congestionColors[zone.level]}}>{zone.level.toUpperCase()}</span></p>
                <p>Vehicles: {zone.vehicles}/{zone.threshold}</p>
                <p className="text-xs mt-1">
                  {zone.level === 'high' ? '⚠️ Rerouting recommended' : zone.level === 'medium' ? '⏳ Monitor closely' : '✅ Clear for delivery'}
                </p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Route Suggestion Polylines */}
        {showRouteOptimization && (
          <>
            <Polyline
              positions={mockRoutes.optimal.positions}
              pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.8, dashArray: '10,6' }}
            />
            <Polyline
              positions={mockRoutes.alternative.positions}
              pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.6, dashArray: '8,8' }}
            />
          </>
        )}
      </MapContainer>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2" data-testid="map-controls">
        <div className="map-overlay-panel p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[#0A0A0A]" style={{ fontFamily: 'IBM Plex Sans' }}>
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#10B981]' : 'bg-amber-500'} animate-pulse`} />
            {socketConnected ? 'WEBSOCKET LIVE' : 'CONNECTING...'}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#002FA7] border border-white" />
              Mock: {mockCount}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#E02424] border border-white" />
              Live: {liveCount}
            </span>
          </div>
          {lastUpdate && (
            <div className="text-[10px] text-[#6B7280] font-mono flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="map-overlay-panel p-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-mock-btn"
            className="justify-start text-xs h-7"
            onClick={() => setShowMock(!showMock)}
          >
            {showMock ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Mock Trucks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-reports-btn"
            className="justify-start text-xs h-7"
            onClick={() => setShowReports(!showReports)}
          >
            {showReports ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Reports
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-zones-btn"
            className={`justify-start text-xs h-7 ${showCongestionZones ? 'text-orange-600' : ''}`}
            onClick={() => setShowCongestionZones(!showCongestionZones)}
          >
            {showCongestionZones ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Congestion Zones
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="toggle-routes-btn"
            className={`justify-start text-xs h-7 ${showRouteOptimization ? 'text-green-600' : ''}`}
            onClick={() => setShowRouteOptimization(!showRouteOptimization)}
          >
            {showRouteOptimization ? <Route className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
            Route Suggestions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="refresh-map-btn"
            className="justify-start text-xs h-7"
            onClick={fetchInitialData}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Route Comparison Panel */}
      {showRouteOptimization && (
        <div className="absolute bottom-4 left-4 z-[1000] map-overlay-panel p-4 max-w-xs" data-testid="route-info-panel">
          <p className="text-sm font-semibold text-[#0A0A0A] mb-3" style={{ fontFamily: 'IBM Plex Sans' }}>Route Comparison</p>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-[#0A0A0A]">Optimal: {mockRoutes.optimal.distance} · {mockRoutes.optimal.time}</p>
                <p className="text-[#6B7280]">Fuel saving: {mockRoutes.optimal.fuelSaving} · Congestion: {mockRoutes.optimal.congestionScore}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-[#0A0A0A]">Alternative: {mockRoutes.alternative.distance} · {mockRoutes.alternative.time}</p>
                <p className="text-[#6B7280]">Fuel saving: {mockRoutes.alternative.fuelSaving} · Congestion: {mockRoutes.alternative.congestionScore}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-left truck info */}
      {selectedTruck && (
        <div className="absolute bottom-4 left-4 z-[1000] map-overlay-panel p-4 max-w-[320px]" data-testid="truck-info-panel">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm" style={{ fontFamily: 'IBM Plex Sans' }}>{selectedTruck.driver_name}</h3>
              <p className="text-xs text-[#6B7280]">{selectedTruck.org_name}</p>
            </div>
            <Badge variant={selectedTruck.is_mock ? "secondary" : "destructive"} className="text-[10px]">
              {selectedTruck.is_mock ? 'SIMULATED' : 'LIVE GPS'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#F3F4F6] p-2 border border-[#E5E7EB]">
              <p className="text-[#6B7280]">Speed</p>
              <p className="font-mono font-bold text-sm">{selectedTruck.speed} <span className="text-[10px] font-normal">km/h</span></p>
            </div>
            <div className="bg-[#F3F4F6] p-2 border border-[#E5E7EB]">
              <p className="text-[#6B7280]">Heading</p>
              <p className="font-mono font-bold text-sm">{selectedTruck.heading}&deg;</p>
            </div>
            <div className="col-span-2 bg-[#F3F4F6] p-2 border border-[#E5E7EB]">
              <p className="text-[#6B7280]">Route</p>
              <p className="font-medium">{selectedTruck.route_name}</p>
            </div>
            <div className="col-span-2 bg-[#F3F4F6] p-2 border border-[#E5E7EB]">
              <p className="text-[#6B7280]">Coordinates</p>
              <p className="font-mono text-[11px]">{selectedTruck.lat}, {selectedTruck.lng}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              data-testid="follow-truck-btn"
              className="flex-1 text-xs h-7"
              onClick={() => setFollowTruck([selectedTruck.lat, selectedTruck.lng])}
            >
              <MapPin className="w-3 h-3 mr-1" /> Follow
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="close-truck-info-btn"
              className="text-xs h-7"
              onClick={() => { setSelectedTruck(null); setFollowTruck(null); }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
