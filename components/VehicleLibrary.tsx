'use client'

import { useState } from 'react'
import { Package, Search, Filter, Plus, Battery, Signal, MapPin, Clock, Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react'
import { vehiclesData } from '@/lib/data'
import { Vehicle } from '@/types'

export default function VehicleLibrary() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('All')

  const getStatusColor = (status: Vehicle['status']): string => {
    switch (status) {
      case 'Active': return 'bg-green-500'
      case 'In Flight': return 'bg-blue-500'
      case 'Maintenance': return 'bg-yellow-500'
      case 'Offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getBatteryColor = (battery: number): string => {
    if (battery > 60) return 'bg-green-500'
    if (battery > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Surveillance': return 'bg-blue-600'
      case 'Logistics': return 'bg-orange-700'
      case 'Agriculture': return 'bg-green-600'
      case 'Emergency': return 'bg-red-700'
      case 'Inspection': return 'bg-purple-600'
      case 'Mapping': return 'bg-indigo-600'
      case 'Delivery': return 'bg-pink-600'
      case 'Monitoring': return 'bg-teal-600'
      default: return 'bg-gray-600'
    }
  }

  const filteredVehicles = vehiclesData.filter(vehicle => {
    if (filterStatus !== 'All' && vehicle.status !== filterStatus) return false
    if (searchQuery && !vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !vehicle.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusCounts = {
    All: vehiclesData.length,
    Active: vehiclesData.filter(v => v.status === 'Active').length,
    'In Flight': vehiclesData.filter(v => v.status === 'In Flight').length,
    Maintenance: vehiclesData.filter(v => v.status === 'Maintenance').length,
    Offline: vehiclesData.filter(v => v.status === 'Offline').length
  }

  return (
    <div className="flex-1 bg-slate-900 min-h-screen">
      <div className="p-8">
        {/* Header */}
        <div className="bg-blue-600 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vehicle Library</h1>
              <p className="text-blue-100">Manage and monitor all UAV vehicles in the fleet</p>
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
              <Plus size={20} />
              <span>Add New Vehicle</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by vehicle name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-400 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors shadow-lg">
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-3 mb-6 overflow-x-auto">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status} <span className="ml-2 text-sm">({count})</span>
            </button>
          ))}
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl hover:shadow-2xl transition-all hover:border-blue-500">
              {/* Vehicle Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Package size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{vehicle.name}</h3>
                      <p className="text-sm text-slate-400">{vehicle.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 ${getStatusColor(vehicle.status)} rounded-full animate-pulse`}></div>
                    <span className="text-xs text-slate-400">{vehicle.status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 ${getTypeColor(vehicle.type)} text-white text-xs font-semibold rounded-full`}>
                    {vehicle.type}
                  </span>
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-semibold rounded-full">
                    {vehicle.model}
                  </span>
                </div>
              </div>

              {/* Vehicle Stats */}
              <div className="p-6 space-y-4">
                {/* Battery Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Battery size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-400">Battery</span>
                    </div>
                    <span className="text-sm font-bold text-white">{vehicle.battery}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`${getBatteryColor(vehicle.battery)} h-2 rounded-full transition-all`}
                      style={{ width: `${vehicle.battery}%` }}
                    ></div>
                  </div>
                  {vehicle.battery < 30 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertTriangle size={14} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400">Low Battery Warning</span>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-blue-400" />
                    <span className="text-sm text-slate-400">Location</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{vehicle.location}</span>
                </div>

                {/* Flight Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-green-400" />
                    <span className="text-sm text-slate-400">Flight Hours</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{vehicle.flightHours}h</span>
                </div>

                {/* Missions Completed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Signal size={16} className="text-purple-400" />
                    <span className="text-sm text-slate-400">Missions</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{vehicle.missions} completed</span>
                </div>

                {/* Last Mission */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Last Mission</span>
                    <span className="text-xs font-semibold text-slate-400">{vehicle.lastMission}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-900 rounded-b-xl flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Eye size={16} />
                  <span className="text-sm font-semibold">View Details</span>
                </button>
                <button className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVehicles.length === 0 && (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No vehicles found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}