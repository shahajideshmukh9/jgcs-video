/**
 * useWebSocketTelemetry Hook
 * Real-time WebSocket telemetry for drone position updates
 */

import { useState, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  lat: number;
  lon: number;
  alt: number;
}

export interface TelemetryData {
  timestamp?: number;
  position?: Position;
  velocity?: {
    vx: number;
    vy: number;
    vz: number;
    ground_speed?: number;
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
    num_satellites?: number;
    fix_type: number;
    hdop?: number;
  };
  flight_mode?: string;
}

export interface DroneStatus {
  connected: boolean;
  armed: boolean;
  flying: boolean;
  current_position: Position;
  battery_level: number;
  flight_mode: string;
  mission_active: boolean;
  mission_current: number;
  mission_count: number;
}

export interface FlightPathPoint {
  lat: number;
  lon: number;
  alt: number;
  timestamp: number;
}

interface UseWebSocketTelemetryProps {
  wsUrl: string;
  missionId?: string;
  autoConnect?: boolean;
}

interface UseWebSocketTelemetryReturn {
  telemetry: TelemetryData | null;
  status: DroneStatus | null;
  dronePosition: Position | null;
  flightPath: FlightPathPoint[];
  wsConnected: boolean;
  lastUpdate: number;
  updateFrequency: number;
  connect: () => void;
  disconnect: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export const useWebSocketTelemetry = ({
  wsUrl,
  missionId,
  autoConnect = true
}: UseWebSocketTelemetryProps): UseWebSocketTelemetryReturn => {
  
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [status, setStatus] = useState<DroneStatus | null>(null);
  const [dronePosition, setDronePosition] = useState<Position | null>(null);
  const [flightPath, setFlightPath] = useState<FlightPathPoint[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [updateFrequency, setUpdateFrequency] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const frequencyWindowRef = useRef<number>(Date.now());

  const maxReconnectAttempts = 10;

  // Handle telemetry updates
  const handleTelemetryUpdate = (data: any) => {
    const now = Date.now();
    
    try {
      // Calculate frequency
      updateCountRef.current += 1;
      const windowDuration = now - frequencyWindowRef.current;
      
      if (windowDuration >= 1000) {
        const frequency = (updateCountRef.current / windowDuration) * 1000;
        setUpdateFrequency(Math.round(frequency));
        updateCountRef.current = 0;
        frequencyWindowRef.current = now;
      }

      setLastUpdate(now);

      // Extract position
      const positionData = data.position || data.current_position;
      
      if (positionData) {
        const newPosition: Position = {
          lat: positionData.lat || positionData.latitude || 0,
          lon: positionData.lon || positionData.lng || positionData.longitude || 0,
          alt: positionData.alt || positionData.altitude || positionData.relative_alt || 0
        };

        setDronePosition(newPosition);

        setFlightPath(prev => {
          const newPath = [...prev, { ...newPosition, timestamp: now }];
          return newPath.slice(-500);
        });
      }

      // Update telemetry
      setTelemetry({
        timestamp: data.timestamp || now,
        position: positionData ? {
          lat: positionData.lat || positionData.latitude || 0,
          lon: positionData.lon || positionData.lng || positionData.longitude || 0,
          alt: positionData.alt || positionData.altitude || positionData.relative_alt || 0
        } : undefined,
        velocity: data.velocity,
        attitude: data.attitude,
        battery: data.battery,
        gps: data.gps,
        flight_mode: data.flight_mode || data.mode
      });

      // Update status
      if (data.armed !== undefined || data.flying !== undefined) {
        setStatus(prev => ({
          connected: true,
          armed: data.armed ?? prev?.armed ?? false,
          flying: data.flying ?? prev?.flying ?? false,
          current_position: positionData ? {
            lat: positionData.lat || positionData.latitude || 0,
            lon: positionData.lon || positionData.lng || positionData.longitude || 0,
            alt: positionData.alt || positionData.altitude || 0
          } : prev?.current_position ?? { lat: 0, lon: 0, alt: 0 },
          battery_level: data.battery?.remaining ?? data.battery_level ?? prev?.battery_level ?? 0,
          flight_mode: data.flight_mode || data.mode || prev?.flight_mode || 'UNKNOWN',
          mission_active: data.mission_active ?? prev?.mission_active ?? false,
          mission_current: data.mission_current ?? data.current_waypoint ?? prev?.mission_current ?? 0,
          mission_count: data.mission_count ?? data.total_waypoints ?? prev?.mission_count ?? 0
        }));
      }
    } catch (error) {
      console.error('❌ Error processing telemetry:', error);
    }
  };

  // Connect to WebSocket
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    try {
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        reconnectAttemptsRef.current = 0;

        if (missionId) {
          ws.send(JSON.stringify({
            action: 'subscribe',
            mission_id: missionId
          }));
          console.log(`📡 Subscribed to mission: ${missionId}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'telemetry_update':
            case 'telemetry':
              handleTelemetryUpdate(message.data || message);
              break;
            case 'status_update':
              if (message.data) {
                setStatus(prev => ({ ...prev, ...message.data } as DroneStatus));
              }
              break;
            case 'error':
              console.error('❌ WebSocket error:', message.message);
              break;
            case 'pong':
              break;
            default:
              if (message.position || message.current_position) {
                handleTelemetryUpdate(message);
              }
              break;
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed (Code: ${event.code})`);
        setWsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;

      const pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'ping' }));
        }
      }, 30000);

      ws.addEventListener('close', () => {
        clearInterval(pingInterval);
      });

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setWsConnected(false);
    }
  };

  // Disconnect
  const disconnect = () => {
    console.log('🔌 Disconnecting WebSocket...');

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

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [wsUrl, autoConnect]);

  // Update subscription
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && missionId) {
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        mission_id: missionId
      }));
    }
  }, [missionId]);

  return {
    telemetry,
    status,
    dronePosition,
    flightPath,
    wsConnected,
    lastUpdate,
    updateFrequency,
    connect,
    disconnect
  };
};