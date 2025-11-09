'use client';

/**
 * Flight Monitor Page
 * 
 * This page provides real-time drone flight visualization with mission control.
 * To use in your Next.js app, create this file at:
 * app/dashboard/flight-monitor/page.tsx
 * 
 * Or integrate it into your DashboardLayout component with dynamic import.
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import DroneFlightVisualization with SSR disabled
// Leaflet requires window object which is not available during SSR
const DroneFlightVisualization = dynamic(
  () => import('@/components/DroneFlightVisualization'),
  { 
    ssr: false,
    loading: () => <FlightMonitorLoading />
  }
);

/**
 * Loading component shown while DroneFlightVisualization is being loaded
 */
function FlightMonitorLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950">
      <div className="text-center">
        {/* Animated drone icon */}
        <div className="mb-6 animate-bounce">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-500"
          >
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="white" strokeWidth="1"/>
            <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="6" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="6" cy="18" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="18" cy="18" r="2.5" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* Loading text */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Loading Flight Monitor
        </h2>
        <p className="text-gray-400 mb-6">
          Initializing map and telemetry systems...
        </p>
        
        {/* Loading spinner */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Flight Monitor Page Component
 */
export default function FlightMonitorPage() {
  return (
    <Suspense fallback={<FlightMonitorLoading />}>
      <DroneFlightVisualization />
    </Suspense>
  );
}