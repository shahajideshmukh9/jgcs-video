'use client';

import dynamic from 'next/dynamic';

// Import with SSR disabled due to Leaflet's window dependency
const DroneFlightVisualization = dynamic(
  () => import('@/components/DroneFlightVisualization'),
  { ssr: false }
);

export default function FlightMonitorPage() {
  return <DroneFlightVisualization />;
}