import React, { useEffect, useState, useRef } from 'react';

interface Position {
  lat?: number;
  lon?: number;
  alt?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

interface Battery {
  voltage?: number;
  current?: number;
  remaining?: number;
  level?: number;
}

interface GPS {
  satellites?: number;
  num_satellites?: number;
  fix_type?: number;
  hdop?: number;
}

interface Telemetry {
  position?: Position;
  battery?: Battery;
  gps?: GPS;
  flight_mode?: string;
  attitude?: {
    roll?: number;
    pitch?: number;
    yaw?: number;
  };
  velocity?: {
    vx?: number;
    vy?: number;
    vz?: number;
    ground_speed?: number;
  };
}

interface Status {
  connected?: boolean;
  armed?: boolean;
  flying?: boolean;
  current_position?: Position;
  battery_level?: number;
  flight_mode?: string;
  mission_active?: boolean;
  mission_current?: number;
  mission_count?: number;
}

interface TelemetryDisplayProps {
  telemetry: Telemetry | null;
  status: Status | null;
  wsConnected: boolean;
  lastUpdate?: number;
  updateFrequency?: number;
  isPulsing?: boolean;
}

const TelemetryDisplay: React.FC<TelemetryDisplayProps> = ({
  telemetry,
  status,
  wsConnected,
  lastUpdate,
  updateFrequency = 0,
  isPulsing = false
}) => {
  
  const [updateCount, setUpdateCount] = useState(0);
  const prevTelemetryRef = useRef<Telemetry | null>(null);

  useEffect(() => {
    if (telemetry && telemetry !== prevTelemetryRef.current) {
      setUpdateCount(prev => prev + 1);
      prevTelemetryRef.current = telemetry;
    }
  }, [telemetry]);

  const formatTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 1) return 'Just now';
    if (seconds === 1) return '1 second ago';
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getDataFreshnessColor = (timestamp?: number): string => {
    if (!timestamp) return 'text-gray-400';
    const ageMs = Date.now() - timestamp;
    if (ageMs < 1000) return 'text-green-400';
    if (ageMs < 3000) return 'text-yellow-400';
    if (ageMs < 10000) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPositionValue = (field: 'lat' | 'lon' | 'alt'): number => {
    const telemetryPos = telemetry?.position;
    const statusPos = status?.current_position;
    
    if (field === 'lat') {
      return Number(telemetryPos?.lat ?? telemetryPos?.latitude ?? statusPos?.lat ?? statusPos?.latitude ?? 0);
    } else if (field === 'lon') {
      return Number(telemetryPos?.lon ?? telemetryPos?.longitude ?? statusPos?.lon ?? statusPos?.longitude ?? 0);
    } else {
      return Number(telemetryPos?.alt ?? telemetryPos?.altitude ?? statusPos?.alt ?? statusPos?.altitude ?? 0);
    }
  };

  const getBatteryRemaining = (): number => {
    return Number(telemetry?.battery?.remaining ?? telemetry?.battery?.level ?? status?.battery_level ?? 0);
  };

  const getSatelliteCount = (): number => {
    return Number(telemetry?.gps?.satellites ?? telemetry?.gps?.num_satellites ?? 0);
  };

  const getGPSFixType = (): number => {
    return Number(telemetry?.gps?.fix_type ?? 0);
  };

  const getGPSFixString = (fixType: number): string => {
    if (fixType >= 3) return '3D FIX';
    if (fixType === 2) return '2D FIX';
    return 'NO FIX';
  };

  const getBatteryColor = (remaining: number): string => {
    if (remaining > 50) return 'text-green-400';
    if (remaining > 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryBarColor = (remaining: number): string => {
    if (remaining > 50) return 'bg-green-500';
    if (remaining > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGPSColor = (satellites: number): string => {
    if (satellites >= 8) return 'text-green-400';
    if (satellites >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGPSFixColor = (fixType: number): string => {
    return fixType >= 3 ? 'text-green-400' : 'text-yellow-400';
  };

  const batteryRemaining = getBatteryRemaining();
  const satelliteCount = getSatelliteCount();
  const gpsFixType = getGPSFixType();

  return (
    <div className={`absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg border ${
      isPulsing ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-700'
    } w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto z-[1000] shadow-2xl transition-all duration-200`}>
      
      <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Live Telemetry</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 ${
              status?.connected ? 'text-green-400' : 'text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                status?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></span>
              {status?.connected ? 'Connected' : 'Disconnected'}
            </span>
            {wsConnected && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                WebSocket
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className={getDataFreshnessColor(lastUpdate)}>
            {formatTimeAgo(lastUpdate)}
          </div>
          <div className="flex items-center gap-2">
            {updateFrequency > 0 && (
              <div className="text-cyan-400 font-semibold">
                {updateFrequency} Hz
              </div>
            )}
            <div className="text-gray-500 text-[10px]">
              #{updateCount}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Flight Status */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Flight Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Status:</span>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  status?.armed ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {status?.armed ? '🔓 ARMED' : '🔒 DISARMED'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  status?.flying ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {status?.flying ? '✈️ FLYING' : '🛬 LANDED'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Mode:</span>
              <span className="text-cyan-400 font-mono text-xs font-semibold">
                {status?.flight_mode || telemetry?.flight_mode || 'N/A'}
              </span>
            </div>
            {status?.mission_active && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">Mission:</span>
                <span className="text-blue-400 font-mono text-xs">
                  WP {status?.mission_current || 0} / {status?.mission_count || 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Position */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Position</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Latitude:</span>
              <span className="text-white font-mono text-xs">
                {getPositionValue('lat').toFixed(6)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Longitude:</span>
              <span className="text-white font-mono text-xs">
                {getPositionValue('lon').toFixed(6)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Altitude:</span>
              <span className="text-white font-mono text-xs">
                {getPositionValue('alt').toFixed(2)} m
              </span>
            </div>
          </div>
        </div>

        {/* Velocity */}
        {telemetry?.velocity && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Velocity</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">Ground:</span>
                <span className="text-white font-mono text-xs">
                  {telemetry.velocity.ground_speed?.toFixed(1) ?? 
                   Math.sqrt(Math.pow(telemetry.velocity.vx ?? 0, 2) + Math.pow(telemetry.velocity.vy ?? 0, 2)).toFixed(1)} m/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">Vertical:</span>
                <span className="text-white font-mono text-xs">
                  {(telemetry.velocity.vz ?? 0).toFixed(1)} m/s
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Battery */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Battery</h4>
          <div className="space-y-2">
            {telemetry?.battery?.voltage !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">Voltage:</span>
                <span className="text-white font-mono text-xs">
                  {Number(telemetry.battery.voltage).toFixed(2)} V
                </span>
              </div>
            )}
            {telemetry?.battery?.current !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">Current:</span>
                <span className="text-white font-mono text-xs">
                  {Number(telemetry.battery.current).toFixed(2)} A
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Remaining:</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-semibold ${getBatteryColor(batteryRemaining)}`}>
                    {batteryRemaining.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${getBatteryBarColor(batteryRemaining)}`}
                    style={{ width: `${batteryRemaining}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GPS */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">GPS</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Satellites:</span>
              <span className={`font-mono text-xs font-semibold ${getGPSColor(satelliteCount)}`}>
                {satelliteCount} 🛰️
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Fix Type:</span>
              <span className={`text-xs font-semibold ${getGPSFixColor(gpsFixType)}`}>
                {getGPSFixString(gpsFixType)}
              </span>
            </div>
            {telemetry?.gps?.hdop !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-16">HDOP:</span>
                <span className="text-white font-mono text-xs">
                  {Number(telemetry.gps.hdop).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryDisplay;