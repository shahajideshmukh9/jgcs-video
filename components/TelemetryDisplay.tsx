import React from 'react';

interface TelemetryDisplayProps {
  telemetry: any;
  status: any;
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
  
  // Helper function to format time ago
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

  // Helper to get data freshness color
  const getDataFreshnessColor = (timestamp?: number): string => {
    if (!timestamp) return 'text-gray-400';
    const ageMs = Date.now() - timestamp;
    
    if (ageMs < 1000) return 'text-green-400';      // < 1s - Fresh
    if (ageMs < 3000) return 'text-yellow-400';     // < 3s - Acceptable  
    if (ageMs < 10000) return 'text-orange-400';    // < 10s - Stale
    return 'text-red-400';                           // > 10s - Very stale
  };

  return (
    <div className={`absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg border ${
      isPulsing ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-700'
    } w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto z-[1000] shadow-2xl transition-all duration-200`}>
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Live Telemetry</h3>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
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
        
        {/* Real-time Update Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className={getDataFreshnessColor(lastUpdate)}>
            {formatTimeAgo(lastUpdate)}
          </div>
          {updateFrequency > 0 && (
            <div className="text-cyan-400 font-semibold">
              {updateFrequency} Hz
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Data */}
      <div className="p-4 space-y-4">
        
        {/* Flight Status Section */}
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

        {/* Position Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Position</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Latitude:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.position?.lat ?? status?.current_position?.lat ?? 0).toFixed(6)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Longitude:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.position?.lon ?? status?.current_position?.lon ?? 0).toFixed(6)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Altitude:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.position?.alt ?? status?.current_position?.alt ?? 0).toFixed(2)} m
              </span>
            </div>
          </div>
        </div>

        {/* Velocity Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Velocity</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">VX (N):</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.velocity?.vx ?? 0).toFixed(2)} m/s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">VY (E):</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.velocity?.vy ?? 0).toFixed(2)} m/s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">VZ (D):</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.velocity?.vz ?? 0).toFixed(2)} m/s
              </span>
            </div>
          </div>
        </div>

        {/* Attitude Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Attitude</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Roll:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.attitude?.roll ?? 0).toFixed(3)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Pitch:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.attitude?.pitch ?? 0).toFixed(3)}°
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Yaw:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.attitude?.yaw ?? 0).toFixed(3)}°
              </span>
            </div>
          </div>
        </div>

        {/* Battery Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Battery</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Voltage:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.battery?.voltage ?? 0).toFixed(2)} V
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Current:</span>
              <span className="text-white font-mono text-xs">
                {Number(telemetry?.battery?.current ?? 0).toFixed(2)} A
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Remaining:</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-semibold ${
                    Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0) > 50 
                      ? 'text-green-400' 
                      : Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0) > 20 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                  }`}>
                    {Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0) > 50 
                        ? 'bg-green-500' 
                        : Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0) > 20 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Number(telemetry?.battery?.remaining ?? status?.battery_level ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GPS Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">GPS</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Satellites:</span>
              <span className={`font-mono text-xs font-semibold ${
                Number(telemetry?.gps?.satellites ?? telemetry?.gps?.num_satellites ?? 0) >= 8 
                  ? 'text-green-400' 
                  : Number(telemetry?.gps?.satellites ?? telemetry?.gps?.num_satellites ?? 0) >= 5 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {telemetry?.gps?.satellites ?? telemetry?.gps?.num_satellites ?? 0} 🛰️
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-16">Fix Type:</span>
              <span className={`text-xs font-semibold ${
                (telemetry?.gps?.fix_type ?? 0) >= 3 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {(telemetry?.gps?.fix_type ?? 0) >= 3 ? '3D FIX' : 
                 (telemetry?.gps?.fix_type ?? 0) === 2 ? '2D FIX' : 'NO FIX'}
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