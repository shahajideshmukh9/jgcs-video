/**
 * MissionExecutionView Component - TypeScript Version
 * Main execution interface with map, controls, and real-time telemetry
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Power, 
  PowerOff, 
  ArrowUp,
  AlertCircle,
  Activity,
  Navigation,
  Battery,
  Satellite
} from 'lucide-react';
import droneControlService from './DroneControlService';
import TelemetryPanel from './TelemetryPanel';
import { 
  MissionExecutionViewProps, 
  MissionExecutionState,
  TelemetryData,
  Waypoint
} from './types';

// Custom marker icons
const createCustomIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const startIcon = createCustomIcon('#10b981');
const waypointIcon = createCustomIcon('#3b82f6');
const endIcon = createCustomIcon('#ef4444');
const droneIcon = createCustomIcon('#f59e0b');

const MissionExecutionView: React.FC<MissionExecutionViewProps> = ({ 
  mission, 
  onBack,
  onComplete,
  onAbort
}) => {
  // State management with proper typing
  const [state, setState] = useState<MissionExecutionState>({
    droneConnected: false,
    droneArmed: false,
    missionUploaded: false,
    missionRunning: false,
    telemetry: null,
    loading: false,
    error: null
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  // Update individual state properties
  const updateState = useCallback((updates: Partial<MissionExecutionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Connect to drone on mount
  useEffect(() => {
    connectToDrone();
    
    return () => {
      if (wsRef.current) {
        droneControlService.stopTelemetryStream();
      }
    };
  }, []);

  // Connect to drone
  const connectToDrone = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      
      const response = await droneControlService.connect();
      
      if (response.success) {
        updateState({ 
          droneConnected: true, 
          error: null 
        });
        startTelemetryStream();
      } else {
        updateState({ error: 'Failed to connect to drone' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  // Start WebSocket telemetry stream
  const startTelemetryStream = (): void => {
    wsRef.current = droneControlService.startTelemetryStream({
      onMessage: (data: TelemetryData) => {
        updateState({ 
          telemetry: data,
          droneArmed: data.armed 
        });
      },
      onError: (error: Event) => {
        console.error('WebSocket error:', error);
      },
      onClose: () => {
        console.log('Telemetry stream disconnected');
      }
    });
  };

  // Drone control commands
  const handleArm = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.arm();
      
      if (response.success) {
        updateState({ droneArmed: true });
      } else {
        updateState({ error: 'Failed to arm drone' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Arm error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleDisarm = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.disarm();
      
      if (response.success) {
        updateState({ droneArmed: false });
      } else {
        updateState({ error: 'Failed to disarm drone' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disarm error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleTakeoff = async (altitude: number = 10): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.takeoff(altitude);
      
      if (!response.success) {
        updateState({ error: 'Failed to takeoff' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Takeoff error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleUploadMission = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      
      // Convert mission waypoints to required format
      const waypoints = droneControlService.formatWaypoints(mission.waypoints);

      const response = await droneControlService.uploadMission(mission.id, waypoints);
      
      if (response.success) {
        updateState({ 
          missionUploaded: true, 
          error: null 
        });
      } else {
        updateState({ error: 'Failed to upload mission' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleStartMission = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.startMission();
      
      if (response.success) {
        updateState({ missionRunning: true });
      } else {
        updateState({ error: 'Failed to start mission' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Start mission error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleStopMission = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.stopMission();
      
      if (response.success) {
        updateState({ missionRunning: false });
        if (onAbort) onAbort();
      } else {
        updateState({ error: 'Failed to stop mission' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stop mission error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleReturnToLaunch = async (): Promise<void> => {
    try {
      updateState({ loading: true });
      const response = await droneControlService.returnToLaunch();
      
      if (response.success) {
        updateState({ 
          missionRunning: false,
          error: null 
        });
      } else {
        updateState({ error: 'Failed to return to launch' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'RTL error';
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  };

  // Calculate map center from waypoints
  const getMapCenter = (): [number, number] => {
    if (mission?.waypoints && mission.waypoints.length > 0) {
      const lats = mission.waypoints.map(wp => wp.lat);
      const lngs = mission.waypoints.map(wp => wp.lng);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2
      ];
    }
    return [26.7465, 80.8760]; // Default center
  };

  // Get flight path coordinates
  const getFlightPath = (): [number, number][] => {
    return mission.waypoints.map(wp => [wp.lat, wp.lng]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Missions
          </button>
          <div>
            <h1 className="text-xl font-bold">{mission?.name || 'Mission Execution'}</h1>
            <p className="text-sm text-gray-400">
              Distance: {mission?.distance || 0} km • Duration: {mission?.duration || 0} min
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${state.droneConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            {state.droneConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative">
          <MapContainer
            center={getMapCenter()}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
            
            {/* Flight Path */}
            {mission?.waypoints && (
              <Polyline
                positions={getFlightPath()}
                pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '10, 10' }}
              />
            )}
            
            {/* Waypoint Markers */}
            {mission?.waypoints && mission.waypoints.map((wp: Waypoint, index: number) => (
              <Marker
                key={index}
                position={[wp.lat, wp.lng]}
                icon={
                  index === 0 
                    ? startIcon 
                    : index === mission.waypoints.length - 1 
                    ? endIcon 
                    : waypointIcon
                }
              >
                <Popup>
                  <div className="text-gray-900">
                    <strong>{wp.name || `Waypoint ${index + 1}`}</strong>
                    <br />
                    Lat: {wp.lat.toFixed(4)}
                    <br />
                    Lng: {wp.lng.toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Live Drone Position */}
            {state.telemetry && state.telemetry.latitude !== 0 && (
              <Marker
                position={[state.telemetry.latitude, state.telemetry.longitude]}
                icon={droneIcon}
              >
                <Popup>
                  <div className="text-gray-900">
                    <strong>Drone Position</strong>
                    <br />
                    Alt: {state.telemetry.relative_altitude.toFixed(1)}m
                    <br />
                    Speed: {state.telemetry.ground_speed.toFixed(1)}m/s
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Control Panel - CONTINUED IN NEXT FILE */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
          {/* Error Display */}
          {state.error && (
            <div className="bg-red-900 border border-red-700 p-3 m-4 rounded flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm">{state.error}</span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="p-4 space-y-3">
            <h3 className="text-lg font-semibold mb-3">Drone Controls</h3>
            
            {/* Arm/Disarm */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleArm}
                disabled={!state.droneConnected || state.droneArmed || state.loading}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded transition ${
                  state.droneArmed 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
                }`}
              >
                <Power className="w-5 h-5" />
                <span>Arm</span>
              </button>
              
              <button
                onClick={handleDisarm}
                disabled={!state.droneConnected || !state.droneArmed || state.loading}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded transition ${
                  !state.droneArmed 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
                }`}
              >
                <PowerOff className="w-5 h-5" />
                <span>Disarm</span>
              </button>
            </div>

            {/* Takeoff */}
            <button
              onClick={() => handleTakeoff(10)}
              disabled={!state.droneConnected || !state.droneArmed || state.loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-5 h-5" />
              <span>Takeoff</span>
            </button>

            {/* Mission Controls */}
            <div className="border-t border-gray-700 pt-3 mt-3">
              <h4 className="text-sm font-semibold mb-2">Mission Controls</h4>
              
              <button
                onClick={handleUploadMission}
                disabled={!state.droneConnected || state.loading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded mb-2 transition ${
                  state.missionUploaded
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                <Upload className="w-5 h-5" />
                <span>{state.missionUploaded ? 'Mission Uploaded ✓' : 'Upload Mission'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStartMission}
                  disabled={!state.droneConnected || !state.missionUploaded || state.missionRunning || state.loading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded bg-green-600 hover:bg-green-700 transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </button>
                
                <button
                  onClick={handleStopMission}
                  disabled={!state.droneConnected || !state.missionRunning || state.loading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded bg-red-600 hover:bg-red-700 transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Display */}
          <div className="flex-1 p-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Live Telemetry</span>
            </h3>
            
            <TelemetryPanel telemetry={state.telemetry} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionExecutionView;