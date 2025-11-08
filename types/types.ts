/**
 * Type Definitions for Mission Execution System
 * Complete TypeScript interfaces and types
 */

// ============================================================================
// Telemetry Types
// ============================================================================

export interface TelemetryData {
  timestamp: string;
  armed: boolean;
  mode: string;
  latitude: number;
  longitude: number;
  altitude: number;
  relative_altitude: number;
  heading: number;
  ground_speed: number;
  air_speed: number;
  climb_rate: number;
  battery_voltage: number;
  battery_current: number;
  battery_remaining: number;
  gps_fix: number;
  satellites_visible: number;
}

// ============================================================================
// Mission Types
// ============================================================================

export interface Waypoint {
  lat: number;
  lng: number;
  altitude?: number;
  name?: string;
  holdTime?: number;
}

export interface Mission {
  id: string;
  name: string;
  distance: number;
  duration: number;
  corridor?: string;
  waypoints: Waypoint[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MissionWaypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  sequence: number;
  hold_time?: number;
}

export interface MissionUploadPayload {
  mission_id: string;
  waypoints: MissionWaypoint[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface ConnectionStatus {
  connected: boolean;
  connection_string?: string;
  target_system?: number;
  target_component?: number;
}

export interface MissionUploadResponse extends CommandResponse {
  data?: {
    waypoint_count: number;
  };
}

export interface TakeoffResponse extends CommandResponse {
  data?: {
    altitude: number;
  };
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface MissionExecutionViewProps {
  mission: Mission;
  onBack: () => void;
  onComplete?: () => void;
  onAbort?: () => void;
}

export interface TelemetryPanelProps {
  telemetry: TelemetryData | null;
  compact?: boolean;
}

// ============================================================================
// Service Types
// ============================================================================

export interface DroneControlConfig {
  baseUrl?: string;
  connectionString?: string;
}

export interface MissionStats {
  distance: string;
  estimatedTime: number;
}

export interface WebSocketCallbacks {
  onMessage?: (data: TelemetryData) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

// ============================================================================
// Map Types
// ============================================================================

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ============================================================================
// Flight Modes
// ============================================================================

export enum FlightMode {
  MANUAL = 'MANUAL',
  HOLD = 'HOLD',
  AUTO = 'AUTO',
  RTL = 'RTL',
  LAND = 'LAND',
  OFFBOARD = 'OFFBOARD',
  GUIDED = 'GUIDED',
  STABILIZED = 'STABILIZED',
  ACRO = 'ACRO',
  ALTCTL = 'ALTCTL',
  POSCTL = 'POSCTL'
}

// ============================================================================
// GPS Fix Types
// ============================================================================

export enum GPSFixType {
  NO_FIX = 0,
  NO_GPS = 1,
  FIX_2D = 2,
  FIX_3D = 3,
  DGPS = 4,
  RTK_FLOAT = 5,
  RTK_FIXED = 6
}

// ============================================================================
// Error Types
// ============================================================================

export interface DroneError {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export class DroneConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DroneConnectionError';
  }
}

export class MissionUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionUploadError';
  }
}

export class TelemetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelemetryError';
  }
}

// ============================================================================
// State Types
// ============================================================================

export interface MissionExecutionState {
  droneConnected: boolean;
  droneArmed: boolean;
  missionUploaded: boolean;
  missionRunning: boolean;
  telemetry: TelemetryData | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Leaflet Custom Types (for proper TypeScript support)
// ============================================================================

export interface CustomMarkerIcon {
  color: string;
  size: number;
}

export interface FlightPathOptions {
  color: string;
  weight: number;
  dashArray?: string;
  opacity?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CONNECTION_STRING = 'udp:127.0.0.1:14550';
export const DEFAULT_TAKEOFF_ALTITUDE = 10;
export const TELEMETRY_UPDATE_RATE = 100; // milliseconds (10Hz)
export const MAX_MISSION_WAYPOINTS = 100;

// ============================================================================
// Type Guards
// ============================================================================

export function isTelemetryData(data: any): data is TelemetryData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'timestamp' in data &&
    'armed' in data &&
    'latitude' in data &&
    'longitude' in data
  );
}

export function isCommandResponse(data: any): data is CommandResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'message' in data &&
    typeof data.success === 'boolean' &&
    typeof data.message === 'string'
  );
}

export function isWaypoint(data: any): data is Waypoint {
  return (
    typeof data === 'object' &&
    data !== null &&
    'lat' in data &&
    'lng' in data &&
    typeof data.lat === 'number' &&
    typeof data.lng === 'number'
  );
}

// ============================================================================
// Helper Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;

// Export all types as a namespace as well
export namespace DroneControl {
  export type Telemetry = TelemetryData;
  export type Mission = Mission;
  export type Waypoint = Waypoint;
  export type Response = CommandResponse;
}