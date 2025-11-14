'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dynamically import the component to avoid SSR issues with Leaflet
const SituationalAwareness = dynamic(
  () => import('@/components/SituationalAwareness'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Situational Awareness...</p>
        </div>
      </div>
    )
  }
);

interface SelectedMissionData {
  id: string;
  mission_name: string;
  waypoints: Array<{
    lat: number;
    lon: number;
    lng?: number;
    alt?: number;
    label?: string;
  }>;
  corridor?: {
    value: string;
    label: string;
    color: string;
    description: string;
  };
  total_distance?: number;
  mission_type?: string;
  status?: string;
}

export default function SituationalAwarenessPage() {
  const router = useRouter();
  const [selectedMission, setSelectedMission] = useState<SelectedMissionData | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMissionSelector, setShowMissionSelector] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_MISSION_API_URL || 'http://localhost:8000';

  // Fetch missions from API
  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/missions?limit=20&status=active`);
      const data = await response.json();
      
      if (data.success && data.missions) {
        setMissions(data.missions);
        
        // Auto-select first mission if available
        if (data.missions.length > 0 && !selectedMission) {
          selectMission(data.missions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectMission = (mission: any) => {
    // Transform mission data to match expected format
    const transformedMission: SelectedMissionData = {
      id: mission.id.toString(),
      mission_name: mission.mission_name,
      mission_type: mission.mission_type,
      status: mission.status,
      total_distance: mission.total_distance,
      waypoints: mission.waypoints.map((wp: any) => ({
        lat: wp.lat,
        lon: wp.lon,
        lng: wp.lon,
        alt: parseFloat(wp.alt?.replace('m AGL', '')) || 100,
        label: wp.label,
      })),
      corridor: mission.corridor_value ? {
        value: mission.corridor_value,
        label: mission.corridor_label,
        color: mission.corridor_color,
        description: mission.corridor_description,
      } : undefined,
    };

    setSelectedMission(transformedMission);
    setShowMissionSelector(false);
  };

  return (
    <div className="relative h-screen w-full">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-slate-900/95 backdrop-blur border-b border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Live Feed Active</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedMission && (
              <div className="px-4 py-2 bg-blue-900/50 border border-blue-700 rounded-lg">
                <div className="text-xs text-blue-300 mb-0.5">Selected Mission</div>
                <div className="text-sm text-white font-semibold">{selectedMission.mission_name}</div>
              </div>
            )}

            <button
              onClick={() => setShowMissionSelector(!showMissionSelector)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {showMissionSelector ? 'Close' : 'Select Mission'}
            </button>

            <button
              onClick={fetchMissions}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
              title="Refresh missions"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mission Selector Dropdown */}
      {showMissionSelector && (
        <div className="absolute top-16 right-4 z-[1001] w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Select Mission to Display</h3>
            <p className="text-xs text-slate-400 mt-1">Choose a mission to overlay on the map</p>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Loading missions...</p>
              </div>
            ) : missions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No missions available
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedMission(null);
                    setShowMissionSelector(false);
                  }}
                  className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="text-white font-medium text-sm">No Mission</div>
                  <div className="text-xs text-slate-400">Show only demo drones</div>
                </button>

                {missions.map((mission) => (
                  <button
                    key={mission.id}
                    onClick={() => selectMission(mission)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all
                      ${selectedMission?.id === mission.id.toString()
                        ? 'bg-blue-900/50 border-blue-600'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-white font-medium text-sm">{mission.mission_name}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        mission.corridor_color === 'blue' ? 'bg-blue-600' :
                        mission.corridor_color === 'orange' ? 'bg-orange-600' :
                        mission.corridor_color === 'green' ? 'bg-green-600' :
                        mission.corridor_color === 'purple' ? 'bg-purple-600' :
                        mission.corridor_color === 'yellow' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {mission.corridor_label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {mission.mission_type} • {mission.waypoints?.length || 0} waypoints • {mission.total_distance?.toFixed(1) || 'N/A'} km
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Situational Awareness Component */}
      <div className="pt-16 h-full">
        <SituationalAwareness selectedMission={selectedMission} />
      </div>
    </div>
  );
}