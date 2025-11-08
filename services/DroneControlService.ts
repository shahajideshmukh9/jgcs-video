/**
 * TelemetryPanel Component - TypeScript Version
 * Displays real-time drone telemetry data with full type safety
 */

import React from 'react';
import { 
  Activity, 
  Navigation, 
  Battery, 
  Satellite,
  Gauge,
  Wind
} from 'lucide-react';
import { TelemetryPanelProps, TelemetryData, GPSFixType } from './types';

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry, compact = false }) => {
  if (!telemetry) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
        <p className="text-sm">Waiting for telemetry data...</p>
      </div>
    );
  }

  // Helper function to get battery color
  const getBatteryColor = (percentage: number): string => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get GPS fix label
  const getGPSFixLabel = (fixType: number): string => {
    switch (fixType) {
      case GPSFixType.NO_FIX:
      case GPSFixType.NO_GPS:
        return 'No Fix';
      case GPSFixType.FIX_2D:
        return '2D Fix';
      case GPSFixType.FIX_3D:
        return '3D Fix';
      case GPSFixType.DGPS:
        return 'DGPS';
      case GPSFixType.RTK_FLOAT:
        return 'RTK Float';
      case GPSFixType.RTK_FIXED:
        return 'RTK Fixed';
      default:
        return 'Unknown';
    }
  };

  // Compact mode display
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Status */}
        <div className="col-span-2 flex items-center justify-between bg-gray-700 rounded p-2">
          <span className="text-gray-400">Status:</span>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{telemetry.mode}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              telemetry.armed ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {telemetry.armed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 text-xs">Altitude</div>
          <div className="font-mono font-semibold">
            {telemetry.relative_altitude.toFixed(1)}m
          </div>
        </div>

        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 text-xs">Speed</div>
          <div className="font-mono font-semibold">
            {telemetry.ground_speed.toFixed(1)}m/s
          </div>
        </div>

        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 text-xs">Battery</div>
          <div className="font-mono font-semibold">
            {telemetry.battery_remaining}%
          </div>
        </div>

        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400 text-xs">GPS</div>
          <div className="font-mono font-semibold">
            {telemetry.satellites_visible} sats
          </div>
        </div>
      </div>
    );
  }

  // Full display mode
  return (
    <div className="space-y-3">
      {/* Flight Status */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">Flight Status</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            telemetry.armed ? 'bg-green-600' : 'bg-gray-600'
          }`}>
            {telemetry.armed ? 'ARMED' : 'DISARMED'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-400">Mode</div>
            <div className="font-semibold text-lg">{telemetry.mode}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Heading</div>
            <div className="font-mono text-lg">{telemetry.heading.toFixed(0)}°</div>
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Navigation className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Position</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-400">Latitude</div>
            <div className="font-mono text-sm">{telemetry.latitude.toFixed(6)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Longitude</div>
            <div className="font-mono text-sm">{telemetry.longitude.toFixed(6)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Altitude (MSL)</div>
            <div className="font-mono text-lg">{telemetry.altitude.toFixed(1)} m</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Altitude (AGL)</div>
            <div className="font-mono text-lg">{telemetry.relative_altitude.toFixed(1)} m</div>
          </div>
        </div>
      </div>

      {/* Speed & Movement */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Wind className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Speed & Movement</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-sm text-gray-400">Ground Speed</div>
            <div className="font-mono text-lg">{telemetry.ground_speed.toFixed(1)}</div>
            <div className="text-xs text-gray-500">m/s</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Air Speed</div>
            <div className="font-mono text-lg">{telemetry.air_speed.toFixed(1)}</div>
            <div className="text-xs text-gray-500">m/s</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Climb Rate</div>
            <div className={`font-mono text-lg ${
              telemetry.climb_rate > 0 ? 'text-green-400' : 
              telemetry.climb_rate < 0 ? 'text-red-400' : ''
            }`}>
              {telemetry.climb_rate > 0 ? '+' : ''}{telemetry.climb_rate.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">m/s</div>
          </div>
        </div>
      </div>

      {/* Battery */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Battery className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Battery</span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-400">Voltage</div>
              <div className="font-mono text-lg">{telemetry.battery_voltage.toFixed(2)} V</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Current</div>
              <div className="font-mono text-lg">{telemetry.battery_current.toFixed(2)} A</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400 mb-2">Remaining Capacity</div>
            <div className="relative w-full bg-gray-600 rounded-full h-6 overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${getBatteryColor(telemetry.battery_remaining)}`}
                style={{ width: `${telemetry.battery_remaining}%` }}
              >
                <div className="absolute inset-0 opacity-20 animate-pulse bg-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono font-bold text-white drop-shadow-lg">
                  {telemetry.battery_remaining}%
                </span>
              </div>
            </div>
          </div>
          
          {telemetry.battery_remaining < 20 && (
            <div className="bg-red-900 border border-red-700 rounded p-2 text-sm">
              ⚠️ Low battery warning!
            </div>
          )}
        </div>
      </div>

      {/* GPS */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Satellite className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">GPS</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-400">Fix Type</div>
            <div className={`font-semibold text-lg ${
              telemetry.gps_fix >= GPSFixType.FIX_3D ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {getGPSFixLabel(telemetry.gps_fix)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Satellites</div>
            <div className="font-mono text-lg">{telemetry.satellites_visible}</div>
          </div>
        </div>
        
        {telemetry.gps_fix < GPSFixType.FIX_3D && (
          <div className="mt-3 bg-yellow-900 border border-yellow-700 rounded p-2 text-sm">
            ⚠️ Waiting for GPS lock...
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Gauge className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">System Info</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400">Last Update</div>
            <div className="font-mono">
              {new Date(telemetry.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">System Status</div>
            <div className="text-green-400 font-semibold">HEALTHY</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;

// Export compact version as separate component
export const CompactTelemetryPanel: React.FC<Omit<TelemetryPanelProps, 'compact'>> = (props) => (
  <TelemetryPanel {...props} compact={true} />
);