'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dynamically import the component to avoid SSR issues with Leaflet
const MultiDroneSituationalAwareness = dynamic(
  () => import('@/components/MultiDroneSituationalAwareness'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Multi-Drone Situational Awareness...</p>
          <p className="text-slate-500 text-sm mt-2">Initializing 4 drone missions...</p>
        </div>
      </div>
    )
  }
);

export default function MultiDroneAwarenessPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-700 p-3 flex items-center justify-between z-[1000]">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <h1 className="text-lg font-bold text-white">Situational Awareness</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-green-900/30 border border-green-600 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-400">LIVE SIMULATION</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <MultiDroneSituationalAwareness />
      </div>
    </div>
  );
}