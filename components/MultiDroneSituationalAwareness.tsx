'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  X,
  Target,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
  Play,
  Pause
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
  type: 'surveillance' | 'campus' | 'highway' | 'regional';
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

interface AnimatedDroneState {
  position: Position;
  heading: number;
  currentWaypointIndex: number;
  progress: number;
}

interface SelectedMissionData {
  id: number | string;
  mission_name: string;
  mission_type?: string;
  status?: string;
  corridor_label?: string;
  corridor_value?: string;
  corridor_color?: string;
  total_distance?: number;
  flight_time?: number;
  battery_usage?: number;
  created_at?: string;
  updated_at?: string;
  waypoints: Array<{
    lat: number;
    lon: number;
    lng?: number;
    alt?: number;
    label?: string;
  }>;
}

interface TelemetryData {
  timestamp?: string;
  position?: {
    lat: number;
    lon: number;
    alt: number;
  };
  velocity?: {
    vx: number;
    vy: number;
    vz: number;
  };
  attitude?: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  battery?: {
    voltage: number;
    current: number;
    remaining: number;
  };
  gps?: {
    satellites: number;
    fix_type: number;
    hdop: number;
  };
  armed?: boolean;
  mode?: string;
  mission_current?: number;
  mission_count?: number;
}

interface FlightPathPoint {
  lat: number;
  lon: number;
  timestamp: number;
}

// ============================================================================
// ANIMATED HELICOPTER ICON FOR MISSION DRONE (WITH SPINNING ROTORS)
// ============================================================================

const createAnimatedHelicopterIcon = (color: string, heading: number = 0, size: number = 48, isLive: boolean = false) => {
  // Animation class for spinning rotors
  const rotorAnimation = isLive ? 'animate-spin' : '';
  
  const helicopterSVG = `
    <div style="width: ${size}px; height: ${size}px; position: relative; transform: rotate(${heading}deg);">
      <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Main Rotor (Top) - Animated when live -->
        <g class="${rotorAnimation}" style="transform-origin: 24px 12px; ${isLive ? 'animation: spin 0.3s linear infinite;' : ''}">
          <ellipse cx="24" cy="12" rx="18" ry="3" fill="${color}" opacity="0.5"/>
          <line x1="6" y1="12" x2="42" y2="12" stroke="${color}" stroke-width="2.5" opacity="0.8"/>
          <line x1="24" y1="0" x2="24" y2="24" stroke="${color}" stroke-width="2" opacity="0.6"/>
        </g>
        
        <!-- Rotor Hub -->
        <circle cx="24" cy="12" r="3.5" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="24" cy="12" r="1.5" fill="white"/>
        
        <!-- Rotor Mast -->
        <rect x="22.5" y="12" width="3" height="8" fill="${color}" stroke="white" stroke-width="1"/>
        
        <!-- Main Body (Fuselage) -->
        <ellipse cx="24" cy="26" rx="9" ry="11" fill="${color}" stroke="white" stroke-width="2.5"/>
        
        <!-- Cockpit Window -->
        <ellipse cx="24" cy="22" rx="6" ry="5" fill="white" opacity="0.9" stroke="${color}" stroke-width="1.5"/>
        <ellipse cx="24" cy="22" rx="4" ry="3" fill="${isLive ? '#22c55e' : color}" opacity="0.4"/>
        
        <!-- Glass Reflection -->
        <ellipse cx="22" cy="20" rx="2" ry="1.5" fill="white" opacity="0.6"/>
        
        <!-- Tail Boom -->
        <path d="M 32 26 L 44 26.5 Q 46 26.5 46 28 L 46 28 Q 46 29.5 44 29.5 L 32 30" 
              fill="${color}" stroke="white" stroke-width="2"/>
        
        <!-- Tail Rotor - Animated when live -->
        <g style="transform-origin: 45px 28px; ${isLive ? 'animation: spin 0.2s linear infinite;' : ''}">
          <circle cx="45" cy="28" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <line x1="45" y1="24" x2="45" y2="32" stroke="white" stroke-width="1.5" opacity="0.9"/>
          <line x1="41" y1="28" x2="49" y2="28" stroke="white" stroke-width="1.5" opacity="0.9"/>
        </g>
        
        <!-- Landing Skids -->
        <path d="M 16 34 Q 16 38 18 39 L 30 39 Q 32 38 32 34" 
              stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <line x1="18" y1="32" x2="18" y2="39" stroke="${color}" stroke-width="2.5"/>
        <line x1="30" y1="32" x2="30" y2="39" stroke="${color}" stroke-width="2.5"/>
        
        <!-- Skid Cross Bars -->
        <line x1="18" y1="36" x2="30" y2="36" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
        
        <!-- Side Windows -->
        <ellipse cx="19" cy="26" rx="2.5" ry="3.5" fill="white" opacity="0.5"/>
        <ellipse cx="29" cy="26" rx="2.5" ry="3.5" fill="white" opacity="0.5"/>
        
        <!-- Body Details -->
        <line x1="24" y1="30" x2="24" y2="34" stroke="white" stroke-width="1" opacity="0.4"/>
        
        <!-- Direction Indicator (nose) -->
        <circle cx="24" cy="18" r="2.5" fill="white" stroke="${color}" stroke-width="1"/>
        
        ${isLive ? `
          <!-- Live Indicator Lights -->
          <circle cx="20" cy="24" r="1.5" fill="#22c55e" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite"/>
          </circle>
          <circle cx="28" cy="24" r="1.5" fill="#22c55e" opacity="0.9">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        
        <!-- Shadow effect -->
        <ellipse cx="24" cy="40" rx="12" ry="2.5" fill="black" opacity="0.25"/>
      </svg>
      
      ${isLive ? `
        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'helicopter-marker',
    html: helicopterSVG,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ============================================================================
// STATIC HELICOPTER ICON (NO ANIMATION)
// ============================================================================

const createHelicopterIcon = (color: string, heading: number = 0, size: number = 48) => {
  return createAnimatedHelicopterIcon(color, heading, size, false);
};

// ============================================================================
// CUSTOM DRONE ICONS - DIFFERENT SHAPES FOR EACH TYPE
// ============================================================================

const createDroneIcon = (type: 'surveillance' | 'campus' | 'highway' | 'regional', color: string, heading: number = 0) => {
  const icons = {
    // Type 1: Quadcopter (X-shape) - For Surveillance
    surveillance: `
      <div style="width: 36px; height: 36px; position: relative; transform: rotate(${heading}deg);">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main body -->
          <circle cx="18" cy="18" r="7" fill="${color}" stroke="white" stroke-width="2.5"/>
          <!-- Arms (X pattern) -->
          <line x1="7" y1="7" x2="29" y2="29" stroke="${color}" stroke-width="3"/>
          <line x1="29" y1="7" x2="7" y2="29" stroke="${color}" stroke-width="3"/>
          <!-- Propellers -->
          <circle cx="7" cy="7" r="5" fill="${color}" stroke="white" stroke-width="2" opacity="0.8"/>
          <circle cx="29" cy="7" r="5" fill="${color}" stroke="white" stroke-width="2" opacity="0.8"/>
          <circle cx="7" cy="29" r="5" fill="${color}" stroke="white" stroke-width="2" opacity="0.8"/>
          <circle cx="29" cy="29" r="5" fill="${color}" stroke="white" stroke-width="2" opacity="0.8"/>
          <!-- Direction indicator -->
          <circle cx="18" cy="13" r="2.5" fill="white"/>
        </svg>
      </div>
    `,
    
    // Type 2: Hexacopter (Star-shape) - For Campus
    campus: `
      <div style="width: 36px; height: 36px; position: relative; transform: rotate(${heading}deg);">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main body -->
          <circle cx="18" cy="18" r="6" fill="${color}" stroke="white" stroke-width="2.5"/>
          <!-- 6 Arms (Hexagon pattern) -->
          <line x1="18" y1="18" x2="18" y2="6" stroke="${color}" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="28" y2="11" stroke="${color}" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="28" y2="25" stroke="${color}" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="18" y2="30" stroke="${color}" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="8" y2="25" stroke="${color}" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="8" y2="11" stroke="${color}" stroke-width="2.5"/>
          <!-- 6 Propellers -->
          <circle cx="18" cy="6" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="28" cy="11" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="28" cy="25" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="18" cy="30" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="8" cy="25" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="8" cy="11" r="4" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <!-- Direction indicator -->
          <circle cx="18" cy="12" r="2" fill="white"/>
        </svg>
      </div>
    `,
    
    // Type 3: Fixed-Wing (Airplane-shape) - For Highway
    highway: `
      <div style="width: 36px; height: 36px; position: relative; transform: rotate(${heading}deg);">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Fuselage -->
          <ellipse cx="18" cy="18" rx="4" ry="10" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Wings -->
          <rect x="6" y="15" width="24" height="6" rx="3" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Tail -->
          <path d="M 18 25 L 15 32 L 21 32 Z" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Cockpit -->
          <circle cx="18" cy="12" r="3" fill="white" stroke="${color}" stroke-width="1.5"/>
          <!-- Direction indicator -->
          <circle cx="18" cy="8" r="2" fill="white"/>
        </svg>
      </div>
    `,
    
    // Type 4: Octocopter (Plus-shape) - For Regional
    regional: `
      <div style="width: 36px; height: 36px; position: relative; transform: rotate(${heading}deg);">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main body -->
          <circle cx="18" cy="18" r="6" fill="${color}" stroke="white" stroke-width="2.5"/>
          <!-- 8 Arms (Plus + X pattern) -->
          <line x1="18" y1="6" x2="18" y2="12" stroke="${color}" stroke-width="3"/>
          <line x1="27" y1="9" x2="23" y2="13" stroke="${color}" stroke-width="3"/>
          <line x1="30" y1="18" x2="24" y2="18" stroke="${color}" stroke-width="3"/>
          <line x1="27" y1="27" x2="23" y2="23" stroke="${color}" stroke-width="3"/>
          <line x1="18" y1="30" x2="18" y2="24" stroke="${color}" stroke-width="3"/>
          <line x1="9" y1="27" x2="13" y2="23" stroke="${color}" stroke-width="3"/>
          <line x1="6" y1="18" x2="12" y2="18" stroke="${color}" stroke-width="3"/>
          <line x1="9" y1="9" x2="13" y2="13" stroke="${color}" stroke-width="3"/>
          <!-- 8 Propellers -->
          <circle cx="18" cy="6" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="27" cy="9" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="30" cy="18" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="27" cy="27" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="18" cy="30" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="9" cy="27" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="6" cy="18" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <circle cx="9" cy="9" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.8"/>
          <!-- Direction indicator -->
          <circle cx="18" cy="12" r="2" fill="white"/>
        </svg>
      </div>
    `
  };

  return L.divIcon({
    className: 'drone-marker',
    html: icons[type],
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// ============================================================================
// DEMO DRONES DATA - UPDATED LOCATIONS IN LUCKNOW-KANPUR REGION
// ============================================================================

const DEMO_DRONES: DemoDrone[] = [
  {
    id: 'UAV-001',
    name: 'Lucknow Central Patrol',
    callsign: 'LKO-01',
    type: 'surveillance',
    position: { lat: 26.8467, lon: 80.9462, alt: 100 },
    waypoints: [
      { lat: 26.8467, lon: 80.9462, alt: 100, label: 'Hazratganj' },
      { lat: 26.8650, lon: 80.9800, alt: 110, label: 'Aminabad' },
      { lat: 26.8850, lon: 81.0100, alt: 120, label: 'Alambagh' },
      { lat: 26.9000, lon: 81.0300, alt: 100, label: 'Gomti Nagar Ext' },
    ],
    status: 'patrol',
    battery: 85,
    speed: 20,
    heading: 45,
    corridor: 'City Surveillance',
    corridorColor: '#3b82f6',
    mission: 'Lucknow Urban Patrol',
  },
  {
    id: 'UAV-002',
    name: 'IIT Kanpur Campus',
    callsign: 'IITK-02',
    type: 'campus',
    position: { lat: 26.5123, lon: 80.2329, alt: 120 },
    waypoints: [
      { lat: 26.5123, lon: 80.2329, alt: 120, label: 'IIT Main Gate' },
      { lat: 26.5180, lon: 80.2360, alt: 120, label: 'Academic Complex' },
      { lat: 26.5095, lon: 80.2380, alt: 125, label: 'Hall 1-3' },
      { lat: 26.5140, lon: 80.2300, alt: 120, label: 'Sports Complex' },
    ],
    status: 'active',
    battery: 92,
    speed: 20,
    heading: 90,
    corridor: 'Campus Security',
    corridorColor: '#10b981',
    mission: 'IIT Campus Monitor',
  },
  {
    id: 'UAV-003',
    name: 'Kanpur City Monitor',
    callsign: 'KNP-03',
    type: 'surveillance',
    position: { lat: 26.4499, lon: 80.3319, alt: 95 },
    waypoints: [
      { lat: 26.4499, lon: 80.3319, alt: 95, label: 'Civil Lines' },
      { lat: 26.4650, lon: 80.3500, alt: 100, label: 'Mall Road' },
      { lat: 26.4750, lon: 80.3200, alt: 105, label: 'Kakadeo' },
      { lat: 26.4550, lon: 80.3150, alt: 95, label: 'Swaroop Nagar' },
    ],
    status: 'active',
    battery: 78,
    speed: 20,
    heading: 135,
    corridor: 'City Surveillance',
    corridorColor: '#06b6d4',
    mission: 'Kanpur Urban Patrol',
  },
  {
    id: 'UAV-004',
    name: 'Highway Monitor',
    callsign: 'HWY-04',
    type: 'highway',
    position: { lat: 26.4499, lon: 80.3319, alt: 200 },
    waypoints: [
      { lat: 26.4499, lon: 80.3319, alt: 200, label: 'Kanpur' },
      { lat: 26.5000, lon: 80.5000, alt: 200, label: 'Rania' },
      { lat: 26.6500, lon: 80.7000, alt: 200, label: 'Unnao' },
      { lat: 26.8467, lon: 80.9462, alt: 200, label: 'Lucknow' },
    ],
    status: 'patrol',
    battery: 88,
    speed: 20,
    heading: 270,
    corridor: 'Highway Monitoring',
    corridorColor: '#f97316',
    mission: 'Expressway Surveillance',
  },
  {
    id: 'UAV-005',
    name: 'Gomti Nagar Patrol',
    callsign: 'GMN-05',
    type: 'surveillance',
    position: { lat: 26.8550, lon: 81.0150, alt: 110 },
    waypoints: [
      { lat: 26.8550, lon: 81.0150, alt: 110, label: 'Gomti Nagar' },
      { lat: 26.8700, lon: 81.0250, alt: 115, label: 'Vibhuti Khand' },
      { lat: 26.8600, lon: 81.0400, alt: 110, label: 'Indira Nagar' },
      { lat: 26.8450, lon: 81.0300, alt: 110, label: 'Nirala Nagar' },
    ],
    status: 'active',
    battery: 91,
    speed: 20,
    heading: 180,
    corridor: 'Residential Area',
    corridorColor: '#ec4899',
    mission: 'Gomti Nagar Security',
  },
  {
    id: 'UAV-006',
    name: 'Regional Patrol North',
    callsign: 'REG-06',
    type: 'regional',
    position: { lat: 27.3968, lon: 80.1250, alt: 150 },
    waypoints: [
      { lat: 27.3968, lon: 80.1250, alt: 150, label: 'Hardoi' },
      { lat: 27.1500, lon: 80.4000, alt: 155, label: 'Sandila' },
      { lat: 26.9500, lon: 80.7000, alt: 150, label: 'Malihabad' },
      { lat: 26.8467, lon: 80.9462, alt: 150, label: 'Lucknow' },
    ],
    status: 'patrol',
    battery: 79,
    speed: 20,
    heading: 180,
    corridor: 'Regional Surveillance',
    corridorColor: '#8b5cf6',
    mission: 'North UP Patrol',
  },
  {
    id: 'UAV-007',
    name: 'Border Monitor East',
    callsign: 'BRD-07',
    type: 'highway',
    position: { lat: 26.7500, lon: 81.2000, alt: 180 },
    waypoints: [
      { lat: 26.7500, lon: 81.2000, alt: 180, label: 'East Border' },
      { lat: 26.8000, lon: 81.3000, alt: 185, label: 'Barabanki' },
      { lat: 26.8500, lon: 81.1500, alt: 180, label: 'Sector 12' },
      { lat: 26.8467, lon: 80.9462, alt: 180, label: 'Lucknow' },
    ],
    status: 'patrol',
    battery: 83,
    speed: 20,
    heading: 90,
    corridor: 'Border Surveillance',
    corridorColor: '#eab308',
    mission: 'Eastern Border Patrol',
  },
  {
    id: 'UAV-008',
    name: 'Airport Perimeter',
    callsign: 'APT-08',
    type: 'campus',
    position: { lat: 26.7606, lon: 80.8893, alt: 130 },
    waypoints: [
      { lat: 26.7606, lon: 80.8893, alt: 130, label: 'Airport Terminal' },
      { lat: 26.7650, lon: 80.8950, alt: 130, label: 'North Runway' },
      { lat: 26.7550, lon: 80.8950, alt: 135, label: 'South Runway' },
      { lat: 26.7580, lon: 80.8850, alt: 130, label: 'Cargo Area' },
    ],
    status: 'active',
    battery: 95,
    speed: 18,
    heading: 45,
    corridor: 'Airport Security',
    corridorColor: '#14b8a6',
    mission: 'Airport Perimeter Security',
  },
];

// ============================================================================
// CORRIDOR POLYGON CALCULATOR
// ============================================================================

const createCorridorPolygon = (waypoints: DemoWaypoint[], corridorWidth: number = 0.005): [number, number][] => {
  if (waypoints.length < 2) return [];
  
  const halfWidth = corridorWidth / 2;
  const polygon: [number, number][] = [];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    
    const dx = next.lon - current.lon;
    const dy = next.lat - current.lat;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * halfWidth;
    const offsetY = (dx / length) * halfWidth;
    
    if (i === 0) {
      polygon.push([current.lat + offsetY, current.lon + offsetX]);
    }
    polygon.push([next.lat + offsetY, next.lon + offsetX]);
  }
  
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
// ANIMATION HELPER FUNCTIONS
// ============================================================================

const calculateHeading = (from: Position, to: Position): number => {
  const dLon = to.lon - from.lon;
  const dLat = to.lat - from.lat;
  const angle = Math.atan2(dLon, dLat) * (180 / Math.PI);
  return (angle + 360) % 360;
};

const interpolatePosition = (
  from: DemoWaypoint,
  to: DemoWaypoint,
  progress: number
): Position => {
  return {
    lat: from.lat + (to.lat - from.lat) * progress,
    lon: from.lon + (to.lon - from.lon) * progress,
    alt: from.alt + (to.alt - from.alt) * progress,
  };
};

const calculateDistance = (from: DemoWaypoint, to: DemoWaypoint): number => {
  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;
  return Math.sqrt(dLat * dLat + dLon * dLon);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MultiDroneAwareness: React.FC = () => {
  const searchParams = useSearchParams();
  
  // State - ALL HOOKS MUST BE AT THE TOP OF THE COMPONENT
  const [demoDrones] = useState<DemoDrone[]>(DEMO_DRONES);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true);
  const [showMissionPanel, setShowMissionPanel] = useState<boolean>(true);
  const [showDemoDrones, setShowDemoDrones] = useState<boolean>(true);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [animatedDrones, setAnimatedDrones] = useState<Map<string, AnimatedDroneState>>(new Map());
  
  // Mission state
  const [selectedMission, setSelectedMission] = useState<SelectedMissionData | null>(null);
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  
  // Simulation state
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [flightPath, setFlightPath] = useState<FlightPathPoint[]>([]);
  const [dronePosition, setDronePosition] = useState<Position | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [missionProgress, setMissionProgress] = useState({ current: 0, total: 0 });
  
  // Helicopter animation state
  const [helicopterHeading, setHelicopterHeading] = useState<number>(0);
  
  // Map center
  const [mapCenter] = useState<[number, number]>(() => {
    const avgLat = DEMO_DRONES.reduce((sum, drone) => sum + drone.position.lat, 0) / DEMO_DRONES.length;
    const avgLon = DEMO_DRONES.reduce((sum, drone) => sum + drone.position.lon, 0) / DEMO_DRONES.length;
    return [avgLat, avgLon];
  });
  const [mapZoom] = useState<number>(9);
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10;
  
  // Animation ref
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  
  // Previous position ref for heading calculation
  const prevPositionRef = useRef<Position | null>(null);
  
  // API Configuration
  const WS_BASE = process.env.NEXT_PUBLIC_DRONE_API_URL || 'ws://localhost:8002';
  const API_BASE = process.env.NEXT_PUBLIC_DRONE_API_URL || 'http://localhost:7000';
  
  // ============================================================================
  // INITIALIZE ANIMATED DRONE STATES
  // ============================================================================
  
  useEffect(() => {
    const initialStates = new Map<string, AnimatedDroneState>();
    demoDrones.forEach(drone => {
      if (drone.waypoints.length > 0) {
        initialStates.set(drone.id, {
          position: { ...drone.waypoints[0] },
          heading: drone.heading,
          currentWaypointIndex: 0,
          progress: 0,
        });
      }
    });
    setAnimatedDrones(initialStates);
  }, [demoDrones]);
  
  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
  
  useEffect(() => {
    if (!isAnimating) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;
      
      setAnimatedDrones(prevStates => {
        const newStates = new Map(prevStates);
        
        demoDrones.forEach(drone => {
          const state = newStates.get(drone.id);
          if (!state || drone.waypoints.length < 2) return;
          
          const currentWp = drone.waypoints[state.currentWaypointIndex];
          const nextWpIndex = (state.currentWaypointIndex + 1) % drone.waypoints.length;
          const nextWp = drone.waypoints[nextWpIndex];
          
          const distance = calculateDistance(currentWp, nextWp);
          const speedInDegreesPerSecond = (drone.speed / 111000);
          const progressIncrement = (speedInDegreesPerSecond * deltaTime) / distance;
          
          let newProgress = state.progress + progressIncrement;
          let newWaypointIndex = state.currentWaypointIndex;
          
          if (newProgress >= 1.0) {
            newProgress = 0;
            newWaypointIndex = nextWpIndex;
          }
          
          const from = drone.waypoints[newWaypointIndex];
          const toIndex = (newWaypointIndex + 1) % drone.waypoints.length;
          const to = drone.waypoints[toIndex];
          
          const newPosition = interpolatePosition(from, to, newProgress);
          const newHeading = calculateHeading(from, to);
          
          newStates.set(drone.id, {
            position: newPosition,
            heading: newHeading,
            currentWaypointIndex: newWaypointIndex,
            progress: newProgress,
          });
        });
        
        return newStates;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    lastUpdateRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, demoDrones]);
  
  // ============================================================================
  // UPDATE HELICOPTER HEADING FROM TELEMETRY
  // ============================================================================
  
  useEffect(() => {
    if (dronePosition && prevPositionRef.current) {
      const heading = calculateHeading(prevPositionRef.current, dronePosition);
      setHelicopterHeading(heading);
    }
    
    if (dronePosition) {
      prevPositionRef.current = { ...dronePosition };
    }
  }, [dronePosition]);
  
  // ============================================================================
  // LOAD MISSION FROM SESSION STORAGE
  // ============================================================================
  
  useEffect(() => {
    const missionId = searchParams?.get('missionId');
    const mode = searchParams?.get('mode');
    
    console.log('URL Params:', { missionId, mode });
    
    if (mode === 'simulate') {
      setSimulationMode(true);
    }
    
    try {
      const storedMission = sessionStorage.getItem('selectedMission');
      
      if (storedMission) {
        const mission = JSON.parse(storedMission);
        console.log('📦 Loaded mission from sessionStorage:', mission);
        
        setSelectedMission(mission);
        setShowMissionPanel(true);
        
        if (mode === 'simulate') {
          setSimulationActive(true);
        }
      } else {
        console.log('⚠️ No mission found in sessionStorage');
      }
    } catch (error) {
      console.error('Error loading mission from sessionStorage:', error);
    }
  }, [searchParams]);
  
  // ============================================================================
  // WEBSOCKET TELEMETRY CONNECTION
  // ============================================================================
  
  const connectWebSocket = () => {
    if (!simulationMode || !simulationActive || !selectedMission) {
      console.log('Skipping WebSocket connection - conditions not met');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('❌ Max WebSocket reconnection attempts reached');
      return;
    }
    
    try {
      console.log(`🔌 Connecting to WebSocket: ${WS_BASE}/ws/telemetry`);
      const ws = new WebSocket(`${WS_BASE}/ws/telemetry`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        if (selectedMission?.id) {
          ws.send(JSON.stringify({
            action: 'subscribe',
            mission_id: selectedMission.id
          }));
          console.log(`📡 Subscribed to mission: ${selectedMission.id}`);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'telemetry_update':
              handleTelemetryUpdate(message.data);
              break;
            case 'connection_info':
              console.log('Connection info:', message);
              break;
            case 'error':
              console.error('WebSocket error:', message.message);
              break;
            case 'pong':
              break;
            default:
              console.log('Unknown message type:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsConnected(false);
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed (Code: ${event.code})`);
        setWsConnected(false);
        
        if (simulationActive && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          console.log(`🔄 Reconnecting in ${delay}ms (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
      
      wsRef.current = ws;
      
      const pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'ping' }));
        }
      }, 30000);
      
      return () => clearInterval(pingInterval);
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setWsConnected(false);
    }
  };
  
  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWsConnected(false);
    reconnectAttemptsRef.current = 0;
  };
  
  // ============================================================================
  // TELEMETRY UPDATE HANDLER
  // ============================================================================
  
  const handleTelemetryUpdate = (data: any) => {
    try {
      setTelemetry({
        timestamp: data.timestamp,
        position: data.position || data.current_position,
        velocity: data.velocity,
        attitude: data.attitude,
        battery: data.battery,
        gps: data.gps,
        armed: data.armed,
        mode: data.mode,
        mission_current: data.mission_current,
        mission_count: data.mission_count
      });
      
      if (data.position || data.current_position) {
        const pos = data.position || data.current_position;
        setDronePosition({
          lat: pos.lat || pos.latitude,
          lon: pos.lon || pos.longitude,
          alt: pos.alt || pos.altitude
        });
        
        setFlightPath(prev => {
          const newPath = [...prev, {
            lat: pos.lat || pos.latitude,
            lon: pos.lon || pos.longitude,
            timestamp: Date.now()
          }];
          return newPath.slice(-500);
        });
      }
      
      if (data.mission_current !== undefined && data.mission_count !== undefined) {
        setMissionProgress({
          current: data.mission_current,
          total: data.mission_count
        });
      }
      
    } catch (error) {
      console.error('Error handling telemetry update:', error);
    }
  };
  
  // ============================================================================
  // AUTOMATIC MISSION UPLOAD AND START
  // ============================================================================
  
  const uploadAndStartMission = async () => {
    if (!simulationMode || !simulationActive || !selectedMission) {
      return;
    }
    
    try {
      console.log('📤 Uploading mission to PX4...');
      
      const waypoints = selectedMission.waypoints.map((wp, index) => ({
        lat: wp.lat,
        lon: wp.lng || wp.lon,
        alt: wp.alt || 100,
        sequence: index
      }));
      
      const uploadResponse = await fetch(`${API_BASE}/mission/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints })
      });
      
      const uploadData = await uploadResponse.json();
      
      if (uploadData.success) {
        console.log('✅ Mission uploaded successfully');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🚀 Starting mission...');
        const startResponse = await fetch(`${API_BASE}/mission/start`, {
          method: 'POST'
        });
        
        const startData = await startResponse.json();
        
        if (startData.success) {
          console.log('✅ Mission started successfully');
        } else {
          console.error('Failed to start mission:', startData.message);
        }
      } else {
        console.error('Failed to upload mission:', uploadData.message);
      }
      
    } catch (error) {
      console.error('Error uploading/starting mission:', error);
    }
  };
  
  // ============================================================================
  // SIMULATION CONTROL FUNCTIONS
  // ============================================================================
  
  const handleStartSimulation = () => {
    if (selectedMission) {
      setSimulationMode(true);
      setSimulationActive(true);
      console.log('🎮 Starting simulation...');
    }
  };
  
  const handleStopSimulation = () => {
    setSimulationActive(false);
    disconnectWebSocket();
    setFlightPath([]);
    setDronePosition(null);
    setTelemetry(null);
    setHelicopterHeading(0);
    prevPositionRef.current = null;
    console.log('⏹️ Simulation stopped');
  };
  
  const handleClearMission = () => {
    setSelectedMission(null);
    setSimulationMode(false);
    setSimulationActive(false);
    setShowMissionPanel(false);
    sessionStorage.removeItem('selectedMission');
    disconnectWebSocket();
    setFlightPath([]);
    setDronePosition(null);
    setTelemetry(null);
    setHelicopterHeading(0);
    prevPositionRef.current = null;
  };
  
  // ============================================================================
  // ANIMATION CONTROL FUNCTIONS
  // ============================================================================
  
  const handleToggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    if (simulationMode && simulationActive && selectedMission) {
      console.log('🎮 Simulation activated - initializing...');
      
      uploadAndStartMission();
      
      const connectTimer = setTimeout(() => {
        connectWebSocket();
      }, 2000);
      
      return () => {
        clearTimeout(connectTimer);
        disconnectWebSocket();
      };
    } else {
      disconnectWebSocket();
    }
  }, [simulationMode, simulationActive, selectedMission]);
  
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
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

  const getMissionWaypoints = (): DemoWaypoint[] => {
    if (!selectedMission?.waypoints) return [];
    
    return selectedMission.waypoints.map(wp => ({
      lat: wp.lat,
      lon: wp.lng ?? wp.lon,
      alt: wp.alt ?? 100,
      label: wp.label
    }));
  };

  const getCorridorColor = (): string => {
    if (selectedMission?.corridor_color) {
      const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f97316',
        purple: '#a855f7',
        red: '#ef4444',
        yellow: '#eab308',
        cyan: '#06b6d4',
        pink: '#ec4899',
      };
      return colorMap[selectedMission.corridor_color.toLowerCase()] || '#10b981';
    }
    return '#10b981';
  };

  const missionWaypoints = getMissionWaypoints();
  const missionCorridorPolygon = missionWaypoints.length > 1 
    ? createCorridorPolygon(missionWaypoints, 0.015)
    : [];

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getMissionDroneType = (): 'surveillance' | 'campus' | 'highway' | 'regional' => {
    if (!selectedMission) return 'surveillance';
    
    const corridorValue = selectedMission.corridor_value?.toLowerCase() || '';
    const missionType = selectedMission.mission_type?.toLowerCase() || '';
    
    if (corridorValue.includes('highway') || corridorValue.includes('expressway') || missionType.includes('highway')) {
      return 'highway';
    } else if (corridorValue.includes('campus') || corridorValue.includes('university') || missionType.includes('campus')) {
      return 'campus';
    } else if (corridorValue.includes('regional') || corridorValue.includes('border') || missionType.includes('regional')) {
      return 'regional';
    }
    return 'surveillance';
  };
  
  // Calculate ground speed from telemetry
  const getGroundSpeed = (): number => {
    if (!telemetry?.velocity) return 0;
    return Math.sqrt(
      Math.pow(telemetry.velocity.vx, 2) + 
      Math.pow(telemetry.velocity.vy, 2)
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="relative h-full w-full bg-slate-900">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* Esri Satellite Imagery */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        {/* DEMO DRONES CORRIDORS */}
        {showDemoDrones && showCorridors && demoDrones.map((drone) => (
          drone.waypoints.length > 1 && (
            <Polygon
              key={`${drone.id}-corridor`}
              positions={createCorridorPolygon(drone.waypoints, 0.02)}
              pathOptions={{
                color: drone.corridorColor,
                fillColor: drone.corridorColor,
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.5,
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-semibold text-sm">{drone.corridor}</div>
                  <div className="text-xs text-gray-600">{drone.name}</div>
                </div>
              </Popup>
            </Polygon>
          )
        ))}
        
        {/* DEMO DRONES PATHS */}
        {showDemoDrones && demoDrones.map((drone) => (
          drone.waypoints.length > 1 && (
            <Polyline
              key={`${drone.id}-path`}
              positions={drone.waypoints.map(wp => [wp.lat, wp.lon])}
              pathOptions={{
                color: drone.corridorColor,
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 5',
              }}
            />
          )
        ))}
        
        {/* DEMO DRONES WAYPOINTS */}
        {showDemoDrones && showWaypoints && demoDrones.map((drone) => (
          drone.waypoints.map((wp, index) => (
            <Marker
              key={`${drone.id}-wp-${index}`}
              position={[wp.lat, wp.lon]}
              icon={L.divIcon({
                className: 'waypoint-marker',
                html: `
                  <div style="
                    background: ${drone.corridorColor};
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 11px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ">
                    ${index + 1}
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Tooltip direction="top" offset={[0, -15]}>
                <div className="text-xs">
                  <strong>{wp.label || `WP${index + 1}`}</strong>
                </div>
              </Tooltip>
            </Marker>
          ))
        ))}
        
        {/* DEMO DRONES MARKERS (ANIMATED OR STATIC) */}
        {showDemoDrones && demoDrones.map((drone) => {
          const animatedState = animatedDrones.get(drone.id);
          const position = isAnimating && animatedState
            ? animatedState.position
            : drone.position;
          const heading = isAnimating && animatedState
            ? animatedState.heading
            : drone.heading;
          
          return (
            <Marker
              key={drone.id}
              position={[position.lat, position.lon]}
              icon={createDroneIcon(drone.type, drone.corridorColor, heading)}
              eventHandlers={{
                click: () => setSelectedDrone(selectedDrone === drone.id ? null : drone.id),
              }}
            >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-base">{drone.name}</div>
                      <div className="text-xs text-gray-600">{drone.callsign}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded font-semibold ${getStatusBadgeColor(drone.status)}`}>
                      {drone.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Type:</span>
                      <span className="font-semibold capitalize">{drone.type}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Mission:</span>
                      <span className="font-semibold text-right">{drone.mission}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Corridor:</span>
                      <span className="font-semibold">{drone.corridor}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Altitude:</span>
                      <span className="font-semibold">{position.alt.toFixed(0)}m AGL</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Speed:</span>
                      <span className="font-semibold">{drone.speed} m/s</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Battery:</span>
                      <span className={`font-semibold ${drone.battery > 30 ? 'text-green-600' : 'text-red-600'}`}>
                        {drone.battery}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Heading:</span>
                      <span className="font-semibold">{heading.toFixed(0)}°</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* SELECTED MISSION CORRIDOR */}
        {selectedMission && showCorridors && missionCorridorPolygon.length > 0 && (
          <Polygon
            positions={missionCorridorPolygon}
            pathOptions={{
              color: getCorridorColor(),
              fillColor: getCorridorColor(),
              fillOpacity: 0.3,
              weight: 3,
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="font-semibold text-sm">{selectedMission.corridor_label || 'Mission Corridor'}</div>
                <div className="text-xs text-gray-600 mt-1">{selectedMission.corridor_value || ''}</div>
              </div>
            </Popup>
          </Polygon>
        )}
        
        {/* SELECTED MISSION WAYPOINTS */}
        {selectedMission && showWaypoints && missionWaypoints.map((waypoint, index) => (
          <Marker
            key={`mission-wp-${index}`}
            position={[waypoint.lat, waypoint.lon]}
            icon={L.divIcon({
              className: 'waypoint-marker',
              html: `
                <div style="
                  background: ${getCorridorColor()};
                  color: white;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 14px;
                  border: 3px solid white;
                  box-shadow: 0 3px 6px rgba(0,0,0,0.5);
                ">
                  ${index + 1}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
            zIndexOffset={1000}
          >
            <Tooltip permanent direction="top" offset={[0, -20]}>
              <div className="text-xs font-semibold">
                <strong>{waypoint.label || `WP${index + 1}`}</strong>
                <br />
                Alt: {waypoint.alt}m
              </div>
            </Tooltip>
          </Marker>
        ))}
        
        {/* SELECTED MISSION FLIGHT PATH */}
        {selectedMission && missionWaypoints.length > 1 && (
          <Polyline
            positions={missionWaypoints.map(wp => [wp.lat, wp.lon])}
            pathOptions={{
              color: getCorridorColor(),
              weight: 4,
              opacity: 0.9,
              dashArray: '10, 10',
            }}
          />
        )}
        
        {/* SELECTED MISSION HELICOPTER (STANDBY MODE) */}
        {selectedMission && !simulationActive && missionWaypoints.length > 0 && (
          <Marker
            position={[missionWaypoints[0].lat, missionWaypoints[0].lon]}
            icon={createHelicopterIcon(getCorridorColor(), 0, 48)}
            zIndexOffset={1500}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-base">{selectedMission.mission_name}</div>
                    <div className="text-xs text-gray-600">Mission</div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded font-semibold bg-yellow-600">
                    STANDBY
                  </span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="font-semibold capitalize">Helicopter</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Mission:</span>
                    <span className="font-semibold text-right">{selectedMission.mission_name}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Corridor:</span>
                    <span className="font-semibold">{selectedMission.corridor_label || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Start Point:</span>
                    <span className="font-semibold">{missionWaypoints[0].label || 'WP1'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Battery:</span>
                    <span className="font-semibold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="font-semibold text-yellow-600">Ready to Fly</span>
                  </div>
                </div>
              </div>
            </Popup>
            
            <Tooltip permanent direction="top" offset={[0, -28]}>
              <div className="text-xs font-bold bg-white px-2 py-1 rounded shadow-lg border-2" style={{ borderColor: getCorridorColor() }}>
                <strong style={{ color: getCorridorColor() }}>🚁 MISSION</strong>
                <br />
                <span className="text-yellow-600">⏸ STANDBY</span>
              </div>
            </Tooltip>
          </Marker>
        )}
        
        {/* SIMULATION FLIGHT PATH */}
        {simulationMode && flightPath.length > 1 && (
          <Polyline
            positions={flightPath.map(p => [p.lat, p.lon])}
            pathOptions={{
              color: '#22c55e',
              weight: 3,
              opacity: 1,
            }}
          />
        )}
        
        {/* LIVE ANIMATED HELICOPTER POSITION (SIMULATION) */}
        {simulationMode && dronePosition && (
          <Marker
            position={[dronePosition.lat, dronePosition.lon]}
            icon={createAnimatedHelicopterIcon('#22c55e', helicopterHeading, 54, true)}
            zIndexOffset={2000}
          >
            <Popup>
              <div className="p-3 min-w-[240px]">
                <div className="font-semibold text-sm mb-2 flex items-center space-x-2">
                  <span>🚁</span>
                  <span>{selectedMission?.mission_name || 'Live Helicopter'}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between bg-green-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="font-semibold text-green-600">{telemetry?.mode || 'UNKNOWN'}</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Altitude:</span>
                    <span className="font-semibold">{dronePosition.alt.toFixed(1)}m AGL</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Ground Speed:</span>
                    <span className="font-semibold">{getGroundSpeed().toFixed(1)} m/s</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Heading:</span>
                    <span className="font-semibold">{helicopterHeading.toFixed(0)}°</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Battery:</span>
                    <span className={`font-semibold ${(telemetry?.battery?.remaining || 0) > 30 ? 'text-green-600' : 'text-red-600'}`}>
                      {telemetry?.battery?.remaining?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">GPS Sats:</span>
                    <span className="font-semibold">{telemetry?.gps?.satellites || 0}</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">Waypoint:</span>
                    <span className="font-semibold">{missionProgress.current} / {missionProgress.total}</span>
                  </div>
                  {telemetry?.armed !== undefined && (
                    <div className="flex justify-between bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Armed:</span>
                      <span className={`font-semibold ${telemetry.armed ? 'text-red-600' : 'text-gray-600'}`}>
                        {telemetry.armed ? 'YES' : 'NO'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
            <Tooltip permanent direction="top" offset={[0, -32]}>
              <div className="text-xs font-bold bg-white px-3 py-2 rounded-lg shadow-xl border-2 border-green-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <strong className="text-green-600">🚁 LIVE</strong>
                </div>
                <div className="text-gray-700 mt-1">
                  {telemetry?.battery?.remaining?.toFixed(0) || 0}% • {dronePosition.alt.toFixed(0)}m • {getGroundSpeed().toFixed(1)} m/s
                </div>
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
      
      {/* Selected Mission Info Panel */}
      {selectedMission && showMissionPanel && (
        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl w-96">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Target className="text-green-400" size={20} />
              <h3 className="text-white font-semibold">Selected Mission</h3>
            </div>
            <button
              onClick={() => setShowMissionPanel(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Mission Info */}
          <div className="p-4 space-y-4">
            {/* Mission Name & Status */}
            <div>
              <h4 className="text-lg font-bold text-white mb-1">
                {selectedMission.mission_name}
              </h4>
              <div className="flex items-center space-x-2">
                {selectedMission.mission_type && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {selectedMission.mission_type}
                  </span>
                )}
                {selectedMission.status && (
                  <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(selectedMission.status)}`}>
                    {selectedMission.status.toUpperCase()}
                  </span>
                )}
                {!simulationActive && (
                  <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                    STANDBY
                  </span>
                )}
              </div>
            </div>
            
            {/* Corridor Info */}
            {selectedMission.corridor_label && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getCorridorColor() }}
                />
                <div>
                  <div className="text-white font-medium text-sm">
                    {selectedMission.corridor_label}
                  </div>
                  {selectedMission.corridor_value && (
                    <div className="text-slate-400 text-xs capitalize">
                      {selectedMission.corridor_value}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Mission Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Distance</div>
                <div className="text-white font-semibold">
                  {selectedMission.total_distance?.toFixed(2) || 'N/A'} km
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Duration</div>
                <div className="text-white font-semibold">
                  {selectedMission.flight_time?.toFixed(1) || 'N/A'} min
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Battery</div>
                <div className="text-white font-semibold">
                  {selectedMission.battery_usage?.toFixed(1) || 'N/A'}%
                </div>
              </div>
            </div>
            
            {/* Waypoints Count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Waypoints:</span>
              <span className="text-white font-medium">
                {selectedMission.waypoints?.length || 0}
              </span>
            </div>
            
            {/* Created Date */}
            {selectedMission.created_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Created:</span>
                <span className="text-white">
                  {formatDate(selectedMission.created_at)}
                </span>
              </div>
            )}
            
            {/* Simulation Controls */}
            <div className="pt-3 border-t border-slate-700 space-y-2">
              {!simulationActive ? (
                <button
                  onClick={handleStartSimulation}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  <Plane size={18} />
                  <span>Start Simulation</span>
                </button>
              ) : (
                <button
                  onClick={handleStopSimulation}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  <AlertTriangle size={18} />
                  <span>Stop Simulation</span>
                </button>
              )}
              
              <button
                onClick={handleClearMission}
                className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <X size={16} />
                <span>Clear Mission</span>
              </button>
            </div>
            
            {/* Live Telemetry */}
            {simulationActive && (
              <div className="pt-3 border-t border-slate-700 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Live Telemetry</span>
                  {wsConnected ? (
                    <div className="flex items-center space-x-1">
                      <Wifi size={14} className="text-green-400" />
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <WifiOff size={14} className="text-red-400" />
                      <span className="text-xs text-red-400">Disconnected</span>
                    </div>
                  )}
                </div>
                
                {telemetry && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">Flight Mode:</span>
                      <span className="text-white font-medium">{telemetry.mode || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">Altitude:</span>
                      <span className="text-white font-medium">
                        {dronePosition?.alt.toFixed(1) || 'N/A'}m
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">Battery:</span>
                      <span className={
                        (telemetry.battery?.remaining || 0) > 30 
                          ? 'text-green-400 font-medium' 
                          : 'text-red-400 font-medium'
                      }>
                        {telemetry.battery?.remaining?.toFixed(0) || 0}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">GPS Satellites:</span>
                      <span className="text-white font-medium">
                        {telemetry.gps?.satellites || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">Waypoint Progress:</span>
                      <span className="text-white font-medium">
                        {missionProgress.current} / {missionProgress.total}
                      </span>
                    </div>
                    
                    {telemetry.velocity && (
                      <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                        <span className="text-slate-400">Ground Speed:</span>
                        <span className="text-white font-medium">
                          {Math.sqrt(
                            Math.pow(telemetry.velocity.vx, 2) + 
                            Math.pow(telemetry.velocity.vy, 2)
                          ).toFixed(1)} m/s
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Map Controls Panel */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-4 space-y-3 min-w-[280px]">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Map Controls</h3>
          <div className="flex items-center space-x-2">
            {/* Animation Toggle Button */}
            {/* <button
              onClick={handleToggleAnimation}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 text-xs font-medium ${
                isAnimating 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isAnimating ? (
                <>
                  <Pause size={14} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Play</span>
                </>
              )}
            </button> */}
            
            {simulationMode && simulationActive && wsConnected && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Legend with Icons */}
        <div className="pt-3 border-t border-slate-700 space-y-2">
          <div className="text-xs text-slate-400 font-medium mb-2 flex items-center justify-between">
            <span>Active Aircraft:</span>
            {isAnimating && (
              <span className="text-green-400 flex items-center space-x-1">
                <Activity size={12} className="animate-pulse" />
                <span>Animating</span>
              </span>
            )}
          </div>
          
          {/* Mission Helicopter (if selected) */}
          {selectedMission && (
            <div className="flex items-center justify-between text-xs bg-slate-800 p-2 rounded border border-purple-500/30">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getCorridorColor() }}
                />
                <div>
                  <div className="text-slate-300 font-medium flex items-center space-x-1">
                    <span>🚁</span>
                    <span>{selectedMission.mission_name}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">Helicopter</div>
                </div>
              </div>
              <span className={simulationActive ? "text-green-400" : "text-yellow-400"}>
                {simulationActive ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
          )}
          
          {/* Demo Drones */}
          {demoDrones.slice(0, 5).map((drone) => (
            <div key={drone.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: drone.corridorColor }}
                />
                <div>
                  <div className="text-slate-300 font-medium">{drone.callsign}</div>
                  <div className="text-slate-500 text-[10px] capitalize">{drone.type}</div>
                </div>
              </div>
              <span className="text-slate-500">{drone.battery}%</span>
            </div>
          ))}
          
          {demoDrones.length > 5 && (
            <div className="text-xs text-slate-500 italic">
              +{demoDrones.length - 5} more drones...
            </div>
          )}
        </div>
        
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
          {selectedMission 
            ? `🚁 Mission + ${demoDrones.length} Demo Drones` 
            : `${demoDrones.length} Demo Drones • Lucknow-Kanpur Region`
          }
        </div>
      </div>
    </div>
  );
};

export default MultiDroneAwareness;