'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Plane, 
  Radio, 
  Battery, 
  Navigation, 
  Eye,
  MapPin,
  Activity,
  Circle,
  AlertTriangle
} from 'lucide-react';

// ============================================================================
// FIX LEAFLET ICONS
// ============================================================================

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Position {
  lat: number;
  lon: number;
  alt: number;
}

interface DemoWaypoint {
  lat: number;
  lon: number;
  alt: number;
  label?: string;
}

interface DemoDrone {
  id: string;
  name: string;
  callsign: string;
  position: Position;
  waypoints: DemoWaypoint[];
  status: 'active' | 'patrol' | 'rtl' | 'standby';
  battery: number;
  speed: number;
  heading: number;
  corridor: string;
  corridorColor: string;
  mission: string;
}

interface SelectedMissionData {
  id: string;
  mission_name: string;
  waypoints: Array<{
    lat: number;
    lon: number;
    lng?: number;
    alt?: number;
    label?: string;
  }>;
  corridor?: {
    value: string;
    label: string;
    color: string;
    description: string;
  };
  total_distance?: number;
  mission_type?: string;
  status?: string;
}

interface SituationalAwarenessProps {
  selectedMission?: SelectedMissionData | null;
}

// ============================================================================
// CUSTOM DRONE ICONS
// ============================================================================

const createDroneIcon = (color: string, heading: number = 0) => {
  return L.divIcon({
    className: 'drone-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        position: relative;
        transform: rotate(${heading}deg);
      ">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Drone body -->
          <circle cx="16" cy="16" r="6" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Drone arms -->
          <line x1="8" y1="8" x2="24" y2="24" stroke="${color}" stroke-width="2"/>
          <line x1="24" y1="8" x2="8" y2="24" stroke="${color}" stroke-width="2"/>
          <!-- Propellers -->
          <circle cx="8" cy="8" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/>
          <circle cx="24" cy="8" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/>
          <circle cx="8" cy="24" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/>
          <circle cx="24" cy="24" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/>
          <!-- Direction indicator -->
          <circle cx="16" cy="12" r="2" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// ============================================================================
// DEMO DRONES DATA
// ============================================================================

const DEMO_DRONES: DemoDrone[] = [
  {
    id: 'UAV-001',
    name: 'Northern Guardian',
    callsign: 'ALPHA-1',
    position: { lat: 26.7465, lon: 80.8769, alt: 120 },
    waypoints: [
      { lat: 26.7465, lon: 80.8769, alt: 120, label: 'Start: Mohanlalganj' },
      { lat: 26.8123, lon: 80.9456, alt: 130, label: 'WP1: Checkpoint Alpha' },
      { lat: 26.8789, lon: 81.0123, alt: 125, label: 'WP2: Border Zone' },
      { lat: 26.9234, lon: 81.0789, alt: 135, label: 'End: Forward Base' },
    ],
    status: 'patrol',
    battery: 78,
    speed: 12.5,
    heading: 45,
    corridor: 'Northern Border',
    corridorColor: '#3b82f6', // blue
    mission: 'Border Patrol Alpha'
  },
  {
    id: 'UAV-002',
    name: 'Western Scout',
    callsign: 'BRAVO-2',
    position: { lat: 26.6234, lon: 80.7123, alt: 115 },
    waypoints: [
      { lat: 26.6234, lon: 80.7123, alt: 115, label: 'Start: Outpost West' },
      { lat: 26.5678, lon: 80.6456, alt: 125, label: 'WP1: Recon Point' },
      { lat: 26.4789, lon: 80.5789, alt: 120, label: 'WP2: Valley Pass' },
      { lat: 26.4123, lon: 80.5123, alt: 110, label: 'End: Base West' },
    ],
    status: 'active',
    battery: 92,
    speed: 15.2,
    heading: 225,
    corridor: 'Western Border',
    corridorColor: '#f97316', // orange
    mission: 'Western Recon Bravo'
  },
  {
    id: 'UAV-003',
    name: 'Eastern Sentinel',
    callsign: 'CHARLIE-3',
    position: { lat: 26.5678, lon: 81.2345, alt: 110 },
    waypoints: [
      { lat: 26.5678, lon: 81.2345, alt: 110, label: 'Start: Forward Base' },
      { lat: 26.6234, lon: 81.3456, alt: 130, label: 'WP1: Surveillance Alpha' },
      { lat: 26.6789, lon: 81.4012, alt: 125, label: 'WP2: Surveillance Beta' },
      { lat: 26.5678, lon: 81.2345, alt: 110, label: 'End: Return Base' },
    ],
    status: 'patrol',
    battery: 65,
    speed: 10.8,
    heading: 135,
    corridor: 'Eastern Border',
    corridorColor: '#22c55e', // green
    mission: 'Eastern Surveillance Charlie'
  },
  {
    id: 'UAV-004',
    name: 'Coastal Watcher',
    callsign: 'DELTA-4',
    position: { lat: 26.3456, lon: 80.1234, alt: 100 },
    waypoints: [
      { lat: 26.3456, lon: 80.1234, alt: 100, label: 'Start: Coastal Station' },
      { lat: 26.4123, lon: 80.2456, alt: 120, label: 'WP1: Beach Sector 1' },
      { lat: 26.4789, lon: 80.3678, alt: 115, label: 'WP2: Beach Sector 2' },
      { lat: 26.5234, lon: 80.4123, alt: 130, label: 'WP3: Harbor Zone' },
      { lat: 26.3456, lon: 80.1234, alt: 100, label: 'End: Return' },
    ],
    status: 'active',
    battery: 88,
    speed: 13.5,
    heading: 90,
    corridor: 'Southern Coastal',
    corridorColor: '#a855f7', // purple
    mission: 'Coastal Monitoring Delta'
  },
];

// ============================================================================
// CORRIDOR POLYGON GENERATOR
// ============================================================================

const generateCorridorPolygon = (waypoints: DemoWaypoint[], width: number = 0.02): [number, number][] => {
  if (waypoints.length < 2) return [];
  
  const polygon: [number, number][] = [];
  const halfWidth = width / 2;
  
  // Create offset points on both sides of the path
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    
    // Calculate perpendicular offset
    const dx = next.lon - current.lon;
    const dy = next.lat - current.lat;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * halfWidth;
    const offsetY = (dx / length) * halfWidth;
    
    // Add points to polygon
    if (i === 0) {
      polygon.push([current.lat + offsetY, current.lon + offsetX]);
    }
    polygon.push([next.lat + offsetY, next.lon + offsetX]);
  }
  
  // Add points on the other side (reverse order)
  for (let i = waypoints.length - 1; i > 0; i--) {
    const current = waypoints[i];
    const previous = waypoints[i - 1];
    
    const dx = previous.lon - current.lon;
    const dy = previous.lat - current.lat;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * halfWidth;
    const offsetY = (dx / length) * halfWidth;
    
    polygon.push([current.lat + offsetY, current.lon + offsetX]);
    if (i === 1) {
      polygon.push([previous.lat + offsetY, previous.lon + offsetX]);
    }
  }
  
  return polygon;
};

// ============================================================================
// MAP CENTER UPDATER
// ============================================================================

const MapCenterUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SituationalAwareness: React.FC<SituationalAwarenessProps> = ({ selectedMission }) => {
  const [demoDrones] = useState<DemoDrone[]>(DEMO_DRONES);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true);
  
  // Calculate map center based on all drones and mission
  const getMapCenter = (): [number, number] => {
    if (selectedMission?.waypoints?.[0]) {
      const firstWp = selectedMission.waypoints[0];
      const lon = firstWp.lng ?? firstWp.lon;
      return [firstWp.lat, lon];
    }
    
    // Center on average of all drone positions
    const avgLat = demoDrones.reduce((sum, drone) => sum + drone.position.lat, 0) / demoDrones.length;
    const avgLon = demoDrones.reduce((sum, drone) => sum + drone.position.lon, 0) / demoDrones.length;
    return [avgLat, avgLon];
  };

  const [mapCenter, setMapCenter] = useState<[number, number]>(getMapCenter());
  const [mapZoom] = useState<number>(selectedMission ? 12 : 11);

  // Update map center when selected mission changes
  useEffect(() => {
    setMapCenter(getMapCenter());
  }, [selectedMission]);

  // Get status color
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      active: 'text-green-400',
      patrol: 'text-blue-400',
      rtl: 'text-yellow-400',
      standby: 'text-gray-400',
    };
    return statusColors[status] || 'text-gray-400';
  };

  const getStatusBadgeColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-600',
      patrol: 'bg-blue-600',
      rtl: 'bg-yellow-600',
      standby: 'bg-gray-600',
    };
    return statusColors[status] || 'bg-gray-600';
  };

  // Format mission waypoints to match demo waypoint format
  const getMissionWaypoints = (): DemoWaypoint[] => {
    if (!selectedMission?.waypoints) return [];
    
    return selectedMission.waypoints.map(wp => ({
      lat: wp.lat,
      lon: wp.lng ?? wp.lon,
      alt: wp.alt ?? 100,
      label: wp.label
    }));
  };

  const missionWaypoints = getMissionWaypoints();
  const missionCorridorPolygon = missionWaypoints.length > 1 
    ? generateCorridorPolygon(missionWaypoints, 0.025) 
    : [];

  return (
    <div className="h-screen w-full bg-slate-950 flex">
      {/* Left Sidebar - Drone Status */}
      <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="text-blue-400" size={24} />
            <h1 className="text-xl font-bold text-white">Situational Awareness</h1>
          </div>
          <p className="text-sm text-slate-400">Real-time fleet monitoring</p>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-700 space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCorridors}
              onChange={(e) => setShowCorridors(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Show Corridors</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWaypoints}
              onChange={(e) => setShowWaypoints(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Show Waypoints</span>
          </label>
        </div>

        {/* Selected Mission Info */}
        {selectedMission && (
          <div className="p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-b border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-blue-400" size={16} />
              <span className="text-xs font-semibold text-blue-300">SELECTED MISSION</span>
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{selectedMission.mission_name}</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                selectedMission.corridor?.color === 'blue' ? 'bg-blue-600' :
                selectedMission.corridor?.color === 'orange' ? 'bg-orange-600' :
                selectedMission.corridor?.color === 'green' ? 'bg-green-600' :
                selectedMission.corridor?.color === 'purple' ? 'bg-purple-600' :
                selectedMission.corridor?.color === 'yellow' ? 'bg-yellow-600' :
                'bg-gray-600'
              }`}>
                {selectedMission.corridor?.label || 'No Corridor'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Type:</span>
                <span className="text-white ml-1">{selectedMission.mission_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Distance:</span>
                <span className="text-white ml-1">{selectedMission.total_distance?.toFixed(1) || 'N/A'} km</span>
              </div>
              <div>
                <span className="text-slate-400">Waypoints:</span>
                <span className="text-white ml-1">{selectedMission.waypoints?.length || 0}</span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <span className="text-white ml-1 capitalize">{selectedMission.status || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Demo Drones List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Plane className="text-slate-400" size={16} />
            <span className="text-xs font-semibold text-slate-400">ACTIVE DRONES ({demoDrones.length})</span>
          </div>
          
          {demoDrones.map((drone) => (
            <div
              key={drone.id}
              onClick={() => setSelectedDrone(selectedDrone === drone.id ? null : drone.id)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${selectedDrone === drone.id 
                  ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {/* Drone Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: drone.corridorColor }}
                  />
                  <span className="text-white font-semibold text-sm">{drone.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(drone.status)}`}>
                  {drone.status.toUpperCase()}
                </span>
              </div>

              {/* Callsign and Corridor */}
              <div className="text-xs text-slate-400 mb-2">
                <span className="font-mono">{drone.callsign}</span>
                <span className="mx-2">•</span>
                <span>{drone.corridor}</span>
              </div>

              {/* Mission */}
              <div className="text-xs text-slate-300 mb-2">
                <span className="text-slate-500">Mission:</span> {drone.mission}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/50 rounded p-1.5">
                  <Battery className={`${drone.battery > 70 ? 'text-green-400' : drone.battery > 30 ? 'text-yellow-400' : 'text-red-400'} mb-1`} size={14} />
                  <div className="text-white font-semibold">{drone.battery}%</div>
                  <div className="text-slate-500 text-[10px]">Battery</div>
                </div>
                <div className="bg-slate-900/50 rounded p-1.5">
                  <Navigation className="text-blue-400 mb-1" size={14} />
                  <div className="text-white font-semibold">{drone.speed} m/s</div>
                  <div className="text-slate-500 text-[10px]">Speed</div>
                </div>
                <div className="bg-slate-900/50 rounded p-1.5">
                  <Circle className="text-purple-400 mb-1" size={14} />
                  <div className="text-white font-semibold">{drone.position.alt}m</div>
                  <div className="text-slate-500 text-[10px]">Altitude</div>
                </div>
              </div>

              {/* Position */}
              {selectedDrone === drone.id && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                  <div className="text-slate-400">Position:</div>
                  <div className="text-white font-mono">
                    {drone.position.lat.toFixed(4)}°N, {drone.position.lon.toFixed(4)}°E
                  </div>
                  <div className="text-slate-400 mt-1">Heading: {drone.heading}°</div>
                  <div className="text-slate-400">Waypoints: {drone.waypoints.length}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
          
          {/* Satellite Base Layer */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={19}
          />
          
          {/* Labels Overlay */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          {/* Render Demo Drones */}
          {demoDrones.map((drone) => (
            <React.Fragment key={drone.id}>
              {/* Corridor Polygon */}
              {showCorridors && drone.waypoints.length > 1 && (
                <Polygon
                  positions={generateCorridorPolygon(drone.waypoints)}
                  pathOptions={{
                    color: drone.corridorColor,
                    fillColor: drone.corridorColor,
                    fillOpacity: 0.15,
                    weight: 2,
                    opacity: 0.6,
                  }}
                />
              )}

              {/* Flight Path */}
              <Polyline
                positions={drone.waypoints.map(wp => [wp.lat, wp.lon])}
                pathOptions={{
                  color: drone.corridorColor,
                  weight: 3,
                  opacity: 0.8,
                  dashArray: '10, 5',
                }}
              />

              {/* Waypoints */}
              {showWaypoints && drone.waypoints.map((wp, idx) => (
                <Marker
                  key={`${drone.id}-wp-${idx}`}
                  position={[wp.lat, wp.lon]}
                  icon={L.divIcon({
                    className: 'waypoint-marker',
                    html: `
                      <div style="
                        width: 20px;
                        height: 20px;
                        background-color: ${drone.corridorColor};
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      ">
                        ${idx + 1}
                      </div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div className="text-xs">
                      <div className="font-semibold">{wp.label || `WP${idx + 1}`}</div>
                      <div className="text-slate-600">{wp.alt}m AGL</div>
                    </div>
                  </Tooltip>
                </Marker>
              ))}

              {/* Drone Position */}
              <Marker
                position={[drone.position.lat, drone.position.lon]}
                icon={createDroneIcon(drone.corridorColor, drone.heading)}
              >
                <Popup>
                  <div className="text-sm p-2">
                    <div className="font-bold text-base mb-1">{drone.name}</div>
                    <div className="text-xs space-y-1">
                      <div><strong>Callsign:</strong> {drone.callsign}</div>
                      <div><strong>Status:</strong> {drone.status}</div>
                      <div><strong>Mission:</strong> {drone.mission}</div>
                      <div><strong>Corridor:</strong> {drone.corridor}</div>
                      <div><strong>Battery:</strong> {drone.battery}%</div>
                      <div><strong>Speed:</strong> {drone.speed} m/s</div>
                      <div><strong>Altitude:</strong> {drone.position.alt}m</div>
                      <div><strong>Heading:</strong> {drone.heading}°</div>
                      <div><strong>Position:</strong> {drone.position.lat.toFixed(4)}°N, {drone.position.lon.toFixed(4)}°E</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Render Selected Mission */}
          {selectedMission && missionWaypoints.length > 0 && (
            <React.Fragment>
              {/* Mission Corridor Polygon */}
              {showCorridors && missionCorridorPolygon.length > 0 && (
                <Polygon
                  positions={missionCorridorPolygon}
                  pathOptions={{
                    color: selectedMission.corridor?.color === 'blue' ? '#3b82f6' :
                           selectedMission.corridor?.color === 'orange' ? '#f97316' :
                           selectedMission.corridor?.color === 'green' ? '#22c55e' :
                           selectedMission.corridor?.color === 'purple' ? '#a855f7' :
                           selectedMission.corridor?.color === 'yellow' ? '#eab308' :
                           '#3b82f6',
                    fillColor: selectedMission.corridor?.color === 'blue' ? '#3b82f6' :
                              selectedMission.corridor?.color === 'orange' ? '#f97316' :
                              selectedMission.corridor?.color === 'green' ? '#22c55e' :
                              selectedMission.corridor?.color === 'purple' ? '#a855f7' :
                              selectedMission.corridor?.color === 'yellow' ? '#eab308' :
                              '#3b82f6',
                    fillOpacity: 0.25,
                    weight: 3,
                    opacity: 0.8,
                  }}
                />
              )}

              {/* Mission Flight Path */}
              <Polyline
                positions={missionWaypoints.map(wp => [wp.lat, wp.lon])}
                pathOptions={{
                  color: selectedMission.corridor?.color === 'blue' ? '#3b82f6' :
                         selectedMission.corridor?.color === 'orange' ? '#f97316' :
                         selectedMission.corridor?.color === 'green' ? '#22c55e' :
                         selectedMission.corridor?.color === 'purple' ? '#a855f7' :
                         selectedMission.corridor?.color === 'yellow' ? '#eab308' :
                         '#3b82f6',
                  weight: 4,
                  opacity: 1,
                }}
              />

              {/* Mission Waypoints */}
              {showWaypoints && missionWaypoints.map((wp, idx) => (
                <Marker
                  key={`mission-wp-${idx}`}
                  position={[wp.lat, wp.lon]}
                  icon={L.divIcon({
                    className: 'mission-waypoint-marker',
                    html: `
                      <div style="
                        width: 24px;
                        height: 24px;
                        background-color: ${
                          selectedMission.corridor?.color === 'blue' ? '#3b82f6' :
                          selectedMission.corridor?.color === 'orange' ? '#f97316' :
                          selectedMission.corridor?.color === 'green' ? '#22c55e' :
                          selectedMission.corridor?.color === 'purple' ? '#a855f7' :
                          selectedMission.corridor?.color === 'yellow' ? '#eab308' :
                          '#3b82f6'
                        };
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                      ">
                        ${idx + 1}
                      </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                    <div className="text-xs">
                      <div className="font-semibold text-blue-600">{wp.label || `Waypoint ${idx + 1}`}</div>
                      <div className="text-slate-600">{wp.alt || 100}m AGL</div>
                    </div>
                  </Tooltip>
                </Marker>
              ))}

              {/* Mission Start Marker (larger) */}
              {missionWaypoints.length > 0 && (
                <Marker
                  position={[missionWaypoints[0].lat, missionWaypoints[0].lon]}
                  icon={L.divIcon({
                    className: 'mission-start-marker',
                    html: `
                      <div style="
                        width: 32px;
                        height: 32px;
                        background-color: #22c55e;
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                      ">
                        S
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]} className="font-semibold">
                    START
                  </Tooltip>
                </Marker>
              )}

              {/* Mission End Marker (larger) */}
              {missionWaypoints.length > 1 && (
                <Marker
                  position={[
                    missionWaypoints[missionWaypoints.length - 1].lat,
                    missionWaypoints[missionWaypoints.length - 1].lon
                  ]}
                  icon={L.divIcon({
                    className: 'mission-end-marker',
                    html: `
                      <div style="
                        width: 32px;
                        height: 32px;
                        background-color: #ef4444;
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                      ">
                        E
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]} className="font-semibold">
                    END
                  </Tooltip>
                </Marker>
              )}
            </React.Fragment>
          )}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="text-xs font-semibold text-white mb-2">LEGEND</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-slate-300">Northern Border</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
              <span className="text-slate-300">Western Border</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
              <span className="text-slate-300">Eastern Border</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
              <span className="text-slate-300">Southern Coastal</span>
            </div>
            {selectedMission && (
              <>
                <div className="border-t border-slate-700 my-2" />
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border-2 border-white ${
                    selectedMission.corridor?.color === 'blue' ? 'bg-blue-500' :
                    selectedMission.corridor?.color === 'orange' ? 'bg-orange-500' :
                    selectedMission.corridor?.color === 'green' ? 'bg-green-500' :
                    selectedMission.corridor?.color === 'purple' ? 'bg-purple-500' :
                    selectedMission.corridor?.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-yellow-300 font-semibold">Selected Mission</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SituationalAwareness;