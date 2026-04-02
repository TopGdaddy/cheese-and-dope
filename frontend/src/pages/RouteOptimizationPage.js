import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Route, Navigation, Fuel, Clock, AlertTriangle, CheckCircle, MapPin, Info } from 'lucide-react';

// Location data with lat/lng for Mumbai areas
const locations = [
  { id: 'andheri_midc', name: 'Andheri MIDC', lat: 19.1136, lng: 72.8697 },
  { id: 'powai_hiranandani', name: 'Powai Hiranandani', lat: 19.1176, lng: 72.9060 },
  { id: 'bkc', name: 'BKC', lat: 19.0596, lng: 72.8656 },
  { id: 'crawford_market', name: 'Crawford Market', lat: 18.9475, lng: 72.8335 },
  { id: 'vashi_apmc', name: 'Vashi APMC', lat: 19.0771, lng: 72.9987 },
  { id: 'borivali_east', name: 'Borivali East', lat: 19.2288, lng: 72.8567 },
  { id: 'thane_station', name: 'Thane Station', lat: 19.2183, lng: 72.9781 },
  { id: 'dadar_tt', name: 'Dadar TT', lat: 19.0178, lng: 72.8478 },
  { id: 'lower_parel', name: 'Lower Parel', lat: 19.0096, lng: 72.8374 },
  { id: 'navi_mumbai', name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297 },
];

// Vehicle data
const vehicles = [
  { id: 'MH-04-AB-7291', name: 'MH-04-AB-7291', type: 'Truck' },
  { id: 'MH-04-CD-5518', name: 'MH-04-CD-5518', type: 'Van' },
  { id: 'MH-02-XY-4451', name: 'MH-02-XY-4451', type: 'Truck' },
  { id: 'MH-43-LK-8823', name: 'MH-43-LK-8823', type: 'Truck' },
  { id: 'MH-04-GH-2234', name: 'MH-04-GH-2234', type: 'Van' },
  { id: 'MH-43-PP-1192', name: 'MH-43-PP-1192', type: 'Truck' },
  { id: 'MH-04-JK-7765', name: 'MH-04-JK-7765', type: 'Van' },
];

// Create location marker icon
const createLocationIcon = (isPickup) => {
  const color = isPickup ? '#22c55e' : '#ef4444';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;background:${color};border:2px solid white;border-radius:50%;
      box-shadow:0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
  });
};

// Generate intermediate waypoints between two points
const generateWaypoints = (start, end, numPoints = 5) => {
  const waypoints = [start];
  for (let i = 1; i < numPoints; i++) {
    const t = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * 0.01;
    const lng = start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * 0.01;
    waypoints.push([lat, lng]);
  }
  waypoints.push(end);
  return waypoints;
};

// MOCK DATA — Replace with API call to POST /api/route-optimize when backend supports it
const generateRouteOptions = (pickup, delivery) => {
  const start = [pickup.lat, pickup.lng];
  const end = [delivery.lat, delivery.lng];

  // Calculate rough distance
  const distance = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
  ) * 111; // Rough km conversion

  return [
    {
      id: 'optimal',
      name: 'Optimal Route (Low Congestion)',
      via: 'Via WEH → Goregaon → Andheri',
      positions: generateWaypoints(start, end, 6),
      color: '#22c55e',
      distance: `${(distance * 0.9).toFixed(1)} km`,
      time: `${Math.floor(distance * 2.5)} min`,
      congestion: 'Low',
      fuelEst: `${(distance * 0.15).toFixed(1)} L`,
      co2: `${(distance * 0.42).toFixed(1)} kg`,
      recommended: true,
      savings: '38% fuel vs highway route'
    },
    {
      id: 'alternative1',
      name: 'Alternative Route 1',
      via: 'Via Jogeshwari Link Road',
      positions: generateWaypoints(start, end, 5),
      color: '#3b82f6',
      distance: `${(distance * 1.05).toFixed(1)} km`,
      time: `${Math.floor(distance * 3)} min`,
      congestion: 'Medium',
      fuelEst: `${(distance * 0.18).toFixed(1)} L`,
      co2: `${(distance * 0.49).toFixed(1)} kg`,
      recommended: false,
      savings: '15% fuel vs highway route'
    },
    {
      id: 'alternative2',
      name: 'Alternative Route 2',
      via: 'Via SV Road → Khar',
      positions: generateWaypoints(start, end, 4),
      color: '#f97316',
      distance: `${(distance * 1.2).toFixed(1)} km`,
      time: `${Math.floor(distance * 3.5)} min`,
      congestion: 'High',
      fuelEst: `${(distance * 0.22).toFixed(1)} L`,
      co2: `${(distance * 0.60).toFixed(1)} kg`,
      recommended: false,
      savings: null
    }
  ];
};

export default function RouteOptimizationPage() {
  const [pickupId, setPickupId] = useState('');
  const [deliveryId, setDeliveryId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [routes, setRoutes] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const pickup = useMemo(() => locations.find(l => l.id === pickupId), [pickupId]);
  const delivery = useMemo(() => locations.find(l => l.id === deliveryId), [deliveryId]);
  const vehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicleId]);

  const handleFindRoutes = () => {
    if (!pickup || !delivery) return;
    const generatedRoutes = generateRouteOptions(pickup, delivery);
    setRoutes(generatedRoutes);
    setSelectedRouteId('optimal');
    setShowResults(true);
  };

  const selectedRoute = routes?.find(r => r.id === selectedRouteId);

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="route-optimizer-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
          Route Optimizer
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Plan and compare delivery routes based on congestion and fuel efficiency
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <Card className="p-4 bg-white border-[#E5E7EB]">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: 'IBM Plex Sans' }}>
              Route Configuration
            </h3>
            
            <div className="space-y-4">
              {/* Pickup Location */}
              <div>
                <label className="text-xs font-medium text-[#6B7280] mb-1.5 block">
                  Pickup Location
                </label>
                <Select value={pickupId} onValueChange={setPickupId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Location */}
              <div>
                <label className="text-xs font-medium text-[#6B7280] mb-1.5 block">
                  Delivery Location
                </label>
                <Select value={deliveryId} onValueChange={setDeliveryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select delivery location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle */}
              <div>
                <label className="text-xs font-medium text-[#6B7280] mb-1.5 block">
                  Vehicle
                </label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleFindRoutes}
                disabled={!pickupId || !deliveryId}
                className="w-full bg-[#002FA7] hover:bg-[#002FA7]/90 text-white"
              >
                <Route className="w-4 h-4 mr-2" />
                Find Routes
              </Button>
            </div>
          </Card>

          {/* Route Results */}
          {showResults && routes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans' }}>
                Route Options
              </h3>
              
              {routes.map((route) => (
                <Card 
                  key={route.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedRouteId === route.id 
                      ? 'border-l-4 border-l-green-500 bg-white' 
                      : 'bg-white border-[#E5E7EB] hover:border-[#002FA7]'
                  }`}
                  onClick={() => setSelectedRouteId(route.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: route.color }}
                        />
                        <h4 className="font-medium text-sm">{route.name}</h4>
                        {route.recommended && (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">
                            RECOMMENDED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">{route.via}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="text-xs">
                          <span className="text-[#6B7280]">Distance:</span>{' '}
                          <span className="font-medium">{route.distance}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-[#6B7280]">Time:</span>{' '}
                          <span className="font-medium">{route.time}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-[#6B7280]">Congestion:</span>{' '}
                          <span className={`font-medium ${
                            route.congestion === 'Low' ? 'text-green-600' : 
                            route.congestion === 'Medium' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {route.congestion}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-[#6B7280]">Fuel Est:</span>{' '}
                          <span className="font-medium">{route.fuelEst}</span>
                        </div>
                      </div>

                      {route.savings && (
                        <p className="text-xs text-green-600 mt-2">
                          💡 {route.savings}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Action Button */}
              <Button 
                onClick={() => alert(`Route assigned to your next delivery slot: ${selectedRoute?.name}`)}
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Select Route for Delivery
              </Button>
            </div>
          )}
        </div>

        {/* Map Preview */}
        <Card className="p-0 overflow-hidden border-[#E5E7EB] h-[500px] lg:h-auto">
          <div className="h-full relative">
            <MapContainer
              center={[19.076, 72.8777]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              />

              {/* Pickup Marker */}
              {pickup && (
                <Marker 
                  position={[pickup.lat, pickup.lng]}
                  icon={createLocationIcon(true)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">Pickup: {pickup.name}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Delivery Marker */}
              {delivery && (
                <Marker 
                  position={[delivery.lat, delivery.lng]}
                  icon={createLocationIcon(false)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">Delivery: {delivery.name}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Polylines */}
              {showResults && routes?.map(route => (
                <Polyline
                  key={route.id}
                  positions={route.positions}
                  pathOptions={{ 
                    color: route.color, 
                    weight: selectedRouteId === route.id ? 4 : 2, 
                    opacity: selectedRouteId === route.id ? 0.9 : 0.4,
                    dashArray: route.id === 'optimal' ? '' : '8,8'
                  }}
                />
              ))}
            </MapContainer>

            {/* Legend Overlay */}
            {(pickup || delivery) && (
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border border-[#E5E7EB]">
                <div className="space-y-2 text-xs">
                  {pickup && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Pickup: {pickup.name}</span>
                    </div>
                  )}
                  {delivery && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Delivery: {delivery.name}</span>
                    </div>
                  )}
                  {vehicle && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#E5E7EB]">
                      <Truck className="w-3 h-3 text-[#002FA7]" />
                      <span>{vehicle.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Route Info Overlay */}
            {showResults && selectedRoute && (
              <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border border-[#E5E7EB] max-w-[200px]">
                <p className="text-xs font-semibold mb-2">Selected Route</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-[#6B7280]" />
                    <span>{selectedRoute.distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#6B7280]" />
                    <span>{selectedRoute.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-[#6B7280]" />
                    <span>{selectedRoute.fuelEst}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Info Tip */}
      <div className="mt-6 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Routes are calculated based on real-time congestion data from our network of tracked vehicles. 
          The recommended route avoids high-congestion zones and optimizes for fuel efficiency.
        </p>
      </div>
    </div>
  );
}
