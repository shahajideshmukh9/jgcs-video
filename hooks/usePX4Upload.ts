import { useState } from 'react'
import { toast } from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_DRONE_API_URL || 'http://localhost:7000'

interface Mission {
  id: number
  mission_name: string
  waypoints: Array<{
    lat: number
    lon: number
    alt?: number
  }>
  vehicle_id?: string
}

export const usePX4Upload = () => {
  const [uploading, setUploading] = useState<number | null>(null)

  const uploadMissionToPX4 = async (mission: Mission) => {
    setUploading(mission.id)
    const uploadToast = toast.loading(`Uploading ${mission.mission_name}...`)

    try {
      // Format waypoints for PX4 - ensure all values are numbers
      const waypoints = mission.waypoints.map(wp => ({
        latitude: Number(wp.lat),
        longitude: Number(wp.lon),
        altitude: Number(wp.alt || 10)
      }))

      console.log('Formatted waypoints:', waypoints)

      // Upload to PX4
      const response = await fetch(
        `${API_BASE_URL}/api/v1/missions/upload-to-px4/${mission.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mission_id: mission.id.toString(),
            vehicle_id: mission.vehicle_id || 'UAV-001',
            waypoints: waypoints,
            connection_string: 'udp:127.0.0.1:14540'  // PyMAVLink format (no //)
          })
        }
      )

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(
          `✅ Mission uploaded! ${result.data?.waypoint_count} waypoints`,
          { id: uploadToast }
        )
        
        // Update mission status to active
        await fetch(`${API_BASE_URL}/api/missions/${mission.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' })
        })
        
        return true
      } else {
        throw new Error(result.detail || result.message || 'Upload failed')
      }
    } catch (error: any) {
      toast.error(
        error.message || 'Upload failed. Ensure PX4 Gazebo SITL is running.',
        { id: uploadToast }
      )
      return false
    } finally {
      setUploading(null)
    }
  }

  return {
    uploadMissionToPX4,
    uploading
  }
}