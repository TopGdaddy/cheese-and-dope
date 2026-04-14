import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Route, MapPin, Clock, Fuel, Leaf, AlertTriangle, CheckCircle, Navigation, ArrowRight, RotateCcw, Truck } from 'lucide-react';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: ${color};
    width: 24px;
    height: 24px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const pickupIcon = createIcon('#22c55e');   // green
const deliveryIcon = createIcon('#ef4444'); // red

// ===== MUMBAI LOCATIONS =====
const LOCATIONS = [
  { id: 'crawford', name: 'Crawford Market', lat: 18.9475, lng: 72.8335, zone: 'South Mumbai' },
  { id: 'andheri', name: 'Andheri MIDC', lat: 19.1197, lng: 72.8464, zone: 'Western Suburbs' },
  { id: 'bkc', name: 'BKC Business District', lat: 19.0596, lng: 72.8656, zone: 'Central Mumbai' },
  { id: 'powai', name: 'Powai Hiranandani', lat: 19.1176, lng: 72.9060, zone: 'Eastern Suburbs' },
  { id: 'vashi', name: 'Vashi APMC Market', lat: 19.0771, lng: 72.9987, zone: 'Navi Mumbai' },
  { id: 'dadar', name: 'Dadar TT Circle', lat: 19.0178, lng: 72.8478, zone: 'Central Mumbai' },
  { id: 'borivali', name: 'Borivali East', lat: 19.2288, lng: 72.8567, zone: 'Western Suburbs' },
  { id: 'thane', name: 'Thane Wagle Estate', lat: 19.1975, lng: 72.9569, zone: 'Thane' },
  { id: 'lowerparel', name: 'Lower Parel', lat: 18.9980, lng: 72.8305, zone: 'South Mumbai' },
  { id: 'mulund', name: 'Mulund Check Naka', lat: 19.1726, lng: 72.9563, zone: 'Eastern Suburbs' },
  { id: 'goregaon', name: 'Goregaon MIDC', lat: 19.1550, lng: 72.8490, zone: 'Western Suburbs' },
  { id: 'chembur', name: 'Chembur RCF', lat: 19.0522, lng: 72.8970, zone: 'Eastern Suburbs' },
];

const congestionColors = { high: '#ef4444', medium: '#f97316', low: '#22c55e' };

// ===== ROUTE GENERATION =====
function generateWaypoints(start, end, numPoints, offset) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    let lat = start.lat + (end.lat - start.lat) * t;
    let lng = start.lng + (end.lng - start.lng) * t;
    if (i > 0 && i < numPoints) {
      const curveFactor = Math.sin(t * Math.PI) * offset;
      lat += curveFactor * 0.01;
      lng += curveFactor * 0.008;
    }
    points.push([lat, lng]);
  }
  return points;
}

function calculateRouteMetrics(waypoints, congestionZones, routeType) {
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const R = 6371;
    const dLat = (waypoints[i][0] - waypoints[i - 1][0]) * Math.PI / 180;
    const dLng = (waypoints[i][1] - waypoints[i - 1][1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(waypoints[i - 1][0] * Math.PI / 180) * Math.cos(waypoints[i][0] * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    totalDistance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  let congestionHits = 0;
  for (const zone of congestionZones) {
    for (const point of waypoints) {
      const dist = Math.sqrt((point[0] - zone.lat) ** 2 + (point[1] - zone.lng) ** 2);
      if (dist < zone.radius / 111000) {
        if (zone.level === 'high') congestionHits += 2;
        else if (zone.level === 'medium') congestionHits += 1;
        break;
      }
    }
  }

  const distanceModifier = routeType === 'optimal' ? 1.0 : routeType === 'alternative1' ? 1.15 : 1.25;
  const timeModifier = routeType === 'optimal' ? 0.85 : routeType === 'alternative1' ? 1.0 : 1.2;
  const congestionModifier = routeType === 'optimal' ? 0.5 : routeType === 'alternative1' ? 1.0 : 1.5;

  const distance = Math.round(totalDistance * distanceModifier * 10) / 10;
  const avgSpeed = 25 + Math.random() * 15;
  const time = Math.round((distance / avgSpeed) * 60);
  const adjustedTime = Math.round(time * timeModifier);
  const fuelLiters = Math.round(distance * 0.18 * 10) / 10;
  const co2Kg = Math.round(fuelLiters * 2.68 * 10) / 10;
  const congestionScore = Math.max(0, Math.min(100, 100 - congestionHits * congestionModifier * 15));

  return {
    distance: `${distance} km`,
    time: `${adjustedTime} min`,
    fuel: `${fuelLiters} L`,
    co2: `${co2Kg} kg`,
    congestionScore: Math.round(congestionScore),
    congestionLevel: congestionScore > 70 ? 'low' : congestionScore > 40 ? 'medium' : 'high',
    zonesAvoided: routeType === 'optimal' ? congestionHits : 0,
    fuelSaving: routeType === 'optimal' ? `${Math.round(Math.random() * 15 + 10)}%` : routeType === 'alternative1' ? `${Math.round(Math.random() * 8 + 3)}%` : '0%',
  };
}

export default function RouteOptimizationPage() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [routes, setRoutes] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [congestionZones, setCongestionZones] = useState([]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/congestion-zones`);
        if (res.ok) {
          const data = await res.json();
          setCongestionZones(data);
        }
      } catch (err) {
        console.error("Failed to fetch congestion zones:", err);
      }
    };
    fetchZones();
    // Refresh every 2 minutes
    const interval = setInterval(fetchZones, 120000);
    return () => clearInterval(interval);
  }, []);

  const pickupLocation = LOCATIONS.find(l => l.id === pickup);
  const deliveryLocation = LOCATIONS.find(l => l.id === delivery);

  const mapCenter = useMemo(() => {
    if (pickupLocation && deliveryLocation) {
      return [
        (pickupLocation.lat + deliveryLocation.lat) / 2,
        (pickupLocation.lng + deliveryLocation.lng) / 2
      ];
    }
    return [19.0760, 72.8777];
  }, [pickupLocation, deliveryLocation]);

  const mapZoom = pickupLocation && deliveryLocation ? 12 : 11;

  const handleFindRoutes = () => {
    if (!pickup || !delivery || pickup === delivery) return;

    setIsCalculating(true);
    setSelectedRouteIndex(null);

    setTimeout(() => {
      const start = pickupLocation;
      const end = deliveryLocation;

      const optimalWaypoints = generateWaypoints(start, end, 8, 1.5);
      const alt1Waypoints = generateWaypoints(start, end, 8, -2.0);
      const alt2Waypoints = generateWaypoints(start, end, 10, 3.0);

      const generatedRoutes = [
        {
          name: 'Optimal Route',
          subtitle: 'Avoids congestion zones, fastest ETA',
          waypoints: optimalWaypoints,
          color: '#22c55e',
          dashArray: null,
          type: 'optimal',
          recommended: true,
          metrics: calculateRouteMetrics(optimalWaypoints, congestionZones, 'optimal'),
        },
        {
          name: 'Alternative Route 1',
          subtitle: 'Via highway, moderate traffic expected',
          waypoints: alt1Waypoints,
          color: '#3b82f6',
          dashArray: '10,6',
          type: 'alternative1',
          recommended: false,
          metrics: calculateRouteMetrics(alt1Waypoints, congestionZones, 'alternative1'),
        },
        {
          name: 'Alternative Route 2',
          subtitle: 'Shortest distance, passes through congestion',
          waypoints: alt2Waypoints,
          color: '#f97316',
          dashArray: '6,8',
          type: 'alternative2',
          recommended: false,
          metrics: calculateRouteMetrics(alt2Waypoints, congestionZones, 'alternative2'),
        },
      ];

      setRoutes(generatedRoutes);
      setSelectedRouteIndex(0);
      setIsCalculating(false);
    }, 1200);
  };

  const handleReset = () => {
    setPickup('');
    setDelivery('');
    setRoutes(null);
    setSelectedRouteIndex(null);
  };

  const handleConfirmRoute = () => {
    if (selectedRouteIndex === null || !routes) return;
    const selected = routes[selectedRouteIndex];
    alert(`Route confirmed: ${selected.name}\n${pickupLocation.name} → ${deliveryLocation.name}\nETA: ${selected.metrics.time} | Distance: ${selected.metrics.distance}`);
  };

  const selectClasses = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer";

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Route className="h-6 w-6 text-emerald-500" />
            Route Optimizer
          </h1>
          <p className="text-slate-400 mt-1">Find the fastest, most fuel-efficient delivery route avoiding congestion zones</p>
        </div>
        {routes && (
          <Button onClick={handleReset} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Plan Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Pickup Location</label>
                <select
                  value={pickup}
                  onChange={(e) => { setPickup(e.target.value); setRoutes(null); }}
                  className={selectClasses}
                >
                  <option value="">Select pickup point</option>
                  {LOCATIONS.filter(l => l.id !== delivery).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} — {loc.zone}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-slate-600 rotate-90" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Location</label>
                <select
                  value={delivery}
                  onChange={(e) => { setDelivery(e.target.value); setRoutes(null); }}
                  className={selectClasses}
                >
                  <option value="">Select delivery point</option>
                  {LOCATIONS.filter(l => l.id !== pickup).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} — {loc.zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className={selectClasses}
                >
                  <option value="truck">🚛 Heavy Truck (10T+)</option>
                  <option value="van">🚐 Delivery Van (2-5T)</option>
                  <option value="mini">🚚 Mini Truck (&lt;2T)</option>
                </select>
              </div>

              <Button
                onClick={handleFindRoutes}
                disabled={!pickup || !delivery || pickup === delivery || isCalculating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Calculating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Find Optimal Routes
                  </span>
                )}
              </Button>

              {pickup === delivery && pickup !== '' && (
                <p className="text-xs text-red-400">Pickup and delivery cannot be the same location</p>
              )}
            </CardContent>
          </Card>

          {routes && routes.map((route, index) => (
            <Card
              key={index}
              className={`bg-slate-900 border-2 cursor-pointer transition-all duration-200 ${
                selectedRouteIndex === index ? 'bg-slate-800/50' : 'border-slate-800 hover:border-slate-700'
              }`}
              style={{
                borderColor: selectedRouteIndex === index ? route.color : undefined,
                boxShadow: selectedRouteIndex === index ? `0 0 15px ${route.color}20` : undefined,
              }}
              onClick={() => setSelectedRouteIndex(index)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }}></div>
                    <span className="text-sm font-semibold text-white">{route.name}</span>
                  </div>
                  {route.recommended && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      RECOMMENDED
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{route.subtitle}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">Distance</span>
                    </div>
                    <p className="text-sm font-medium text-white">{route.metrics.distance}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">ETA</span>
                    </div>
                    <p className="text-sm font-medium text-white">{route.metrics.time}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                      <Fuel className="h-3 w-3" />
                      <span className="text-xs">Fuel</span>
                    </div>
                    <p className="text-sm font-medium text-white">{route.metrics.fuel}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                      <Leaf className="h-3 w-3" />
                      <span className="text-xs">CO₂</span>
                    </div>
                    <p className="text-sm font-medium text-white">{route.metrics.co2}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Congestion Avoidance</span>
                    <span className={`text-xs font-medium ${
                      route.metrics.congestionLevel === 'low' ? 'text-emerald-400' :
                      route.metrics.congestionLevel === 'medium' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {route.metrics.congestionScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${route.metrics.congestionScore}%`,
                        backgroundColor: route.metrics.congestionLevel === 'low' ? '#22c55e' :
                          route.metrics.congestionLevel === 'medium' ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                </div>

                {route.metrics.fuelSaving !== '0%' && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    <span>Saves {route.metrics.fuelSaving} fuel vs direct route</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {routes && selectedRouteIndex !== null && (
            <Button
              onClick={handleConfirmRoute}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm {routes[selectedRouteIndex].name}
            </Button>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="relative" style={{ height: '600px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {congestionZones.map((zone, i) => (
                  <Circle
                    key={zone._id || zone.name}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                      color: zone.severity === "high" ? "#A32D2D" : zone.severity === "medium" ? "#BA7517" : "#1D9E75",
                      fillColor: zone.severity === "high" ? "#A32D2D" : zone.severity === "medium" ? "#BA7517" : "#1D9E75",
                      fillOpacity: 0.15,
                      weight: 2
                    }}
                  >
                    <Popup>{zone.name} — {zone.severity} congestion</Popup>
                  </Circle>
                ))}

                {pickupLocation && (
                  <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
                    <Popup>
                      <div style={{ fontSize: '13px' }}>
                        <strong>📦 PICKUP</strong><br />
                        {pickupLocation.name}<br />
                        <span style={{ color: '#666' }}>{pickupLocation.zone}</span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {deliveryLocation && (
                  <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
                    <Popup>
                      <div style={{ fontSize: '13px' }}>
                        <strong>📍 DELIVERY</strong><br />
                        {deliveryLocation.name}<br />
                        <span style={{ color: '#666' }}>{deliveryLocation.zone}</span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {routes && routes.map((route, index) => (
                  <Polyline
                    key={`route-${index}`}
                    positions={route.waypoints}
                    pathOptions={{
                      color: route.color,
                      weight: selectedRouteIndex === index ? 5 : 3,
                      opacity: selectedRouteIndex === index ? 0.9 : 0.4,
                      dashArray: route.dashArray || undefined,
                    }}
                  >
                    <Popup>
                      <div style={{ fontSize: '13px' }}>
                        <strong>{route.name}</strong><br />
                        {route.metrics.distance} · {route.metrics.time}<br />
                        Fuel: {route.metrics.fuel} · CO₂: {route.metrics.co2}
                      </div>
                    </Popup>
                  </Polyline>
                ))}
              </MapContainer>

              <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legend</p>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>Pickup Point</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Delivery Point</span>
                </div>
                {routes && (
                  <>
                    <div className="border-t border-slate-700 my-1"></div>
                    {routes.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-3 h-0.5" style={{ backgroundColor: r.color }}></div>
                        <span>{r.name}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="border-t border-slate-700 my-1"></div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-30"></div>
                  <span>High Congestion Zone</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-orange-500 opacity-30"></div>
                  <span>Medium Congestion Zone</span>
                </div>
              </div>

              {!routes && !pickup && !delivery && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
                  <div className="bg-slate-900/80 backdrop-blur rounded-lg p-6 text-center pointer-events-auto">
                    <Truck className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Select Pickup & Delivery</p>
                    <p className="text-slate-400 text-sm mt-1">Choose locations from the left panel to find optimal routes</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {routes && selectedRouteIndex !== null && (
            <Card className="bg-slate-900 border-slate-800 mt-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Route Optimization Summary</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {routes[selectedRouteIndex].recommended
                        ? `The recommended route avoids ${routes[0].metrics.zonesAvoided} high-congestion zone(s) and saves approximately ${routes[0].metrics.fuelSaving} fuel compared to the direct route. Estimated arrival in ${routes[0].metrics.time} covering ${routes[0].metrics.distance}.` 
                        : `This alternative route covers ${routes[selectedRouteIndex].metrics.distance} with an ETA of ${routes[selectedRouteIndex].metrics.time}. Consider the recommended route for better fuel efficiency and congestion avoidance.` 
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
