import { LucideIcon } from 'lucide-react'

export interface Mission {
  id: string
  name: string
  description: string
  type: string
  vehicle: string
  operator: string
  status: 'In Flight' | 'Completed' | 'Pending' | 'Low Battery' | 'Failed'
  progress: number
  date: string
  time: string
  created: string
  alert: boolean
}

export interface MissionType {
  name: string
  description: string
  active: number
  lastUsed: string
  icon: LucideIcon
  color: string
}

export interface Permission {
  name: string
  description: string
  allowed: boolean
}

export interface Role {
  name: string
  description: string
  color: string
  activeUsers: number
  permissions: Permission[]
}

export interface Waypoint {
  id: string
  label: string
  coords: string
  alt: string
  color: string
}

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  indent?: boolean
}

// NEW TYPES FOR VEHICLE LIBRARY
export interface Vehicle {
  id: string
  name: string
  model: string
  type: string
  status: 'Active' | 'Maintenance' | 'Offline' | 'In Flight'
  battery: number
  location: string
  flightHours: number
  lastMission: string
  missions: number
}

// NEW TYPES FOR OPERATOR LIBRARY
export interface Operator {
  id: string
  name: string
  initials: string
  role: 'Operator' | 'Planner' | 'Commander' | 'Administrator'
  status: 'Active' | 'Offline' | 'On Mission' | 'On Leave'
  email: string
  phone: string
  location: string
  missions: number
  successRate: number
  flightHours: number
  certifications: string[]
  lastActive: string
}