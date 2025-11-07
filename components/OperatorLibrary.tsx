'use client'

import { useState } from 'react'
import { User, Search, Filter, Plus, Mail, Phone, MapPin, Shield, Award, Activity, Edit2, Trash2, Eye, AlertCircle } from 'lucide-react'
import { operatorsData } from '@/lib/data'
import { Operator } from '@/types'

export default function OperatorLibrary() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('All')

  const getStatusColor = (status: Operator['status']): string => {
    switch (status) {
      case 'Active': return 'bg-green-500'
      case 'On Mission': return 'bg-blue-500'
      case 'On Leave': return 'bg-yellow-500'
      case 'Offline': return 'bg-slate-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleColor = (role: Operator['role']): string => {
    switch (role) {
      case 'Operator': return 'bg-green-500'
      case 'Planner': return 'bg-blue-500'
      case 'Commander': return 'bg-yellow-500'
      case 'Administrator': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 98) return 'text-green-400'
    if (rate >= 95) return 'text-blue-400'
    return 'text-yellow-400'
  }

  const filteredOperators = operatorsData.filter(operator => {
    if (filterRole !== 'All' && operator.role !== filterRole) return false
    if (searchQuery && !operator.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !operator.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const roleCounts = {
    All: operatorsData.length,
    Operator: operatorsData.filter(o => o.role === 'Operator').length,
    Planner: operatorsData.filter(o => o.role === 'Planner').length,
    Commander: operatorsData.filter(o => o.role === 'Commander').length,
    Administrator: operatorsData.filter(o => o.role === 'Administrator').length
  }

  return (
    <div className="flex-1 bg-slate-900 min-h-screen">
      <div className="p-8">
        {/* Header */}
        <div className="bg-blue-600 rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Operator Library</h1>
              <p className="text-blue-100">Manage and monitor all operators in the system</p>
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
              <Plus size={20} />
              <span>Add New Operator</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by operator name or ID..."
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

        {/* Role Filter Tabs */}
        <div className="flex items-center space-x-3 mb-6 overflow-x-auto">
          {Object.entries(roleCounts).map(([role, count]) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterRole === role
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {role} <span className="ml-2 text-sm">({count})</span>
            </button>
          ))}
        </div>

        {/* Operator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOperators.map((operator) => (
            <div key={operator.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl hover:shadow-2xl transition-all hover:border-blue-500">
              {/* Operator Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">{operator.initials}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{operator.name}</h3>
                      <p className="text-sm text-slate-400">{operator.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 ${getStatusColor(operator.status)} rounded-full animate-pulse`}></div>
                    <span className="text-xs text-slate-400">{operator.status}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 ${getRoleColor(operator.role)} text-white text-xs font-semibold rounded-full flex items-center space-x-1`}>
                    <Shield size={12} />
                    <span>{operator.role}</span>
                  </span>
                </div>
              </div>

              {/* Operator Details */}
              <div className="p-6 space-y-3">
                {/* Contact Info */}
                <div className="flex items-center space-x-2 text-sm">
                  <Mail size={14} className="text-blue-400" />
                  <span className="text-slate-300 truncate">{operator.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone size={14} className="text-green-400" />
                  <span className="text-slate-300">{operator.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin size={14} className="text-red-400" />
                  <span className="text-slate-300">{operator.location}</span>
                </div>

                {/* Performance Stats */}
                <div className="pt-4 border-t border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity size={16} className="text-purple-400" />
                      <span className="text-sm text-slate-400">Missions</span>
                    </div>
                    <span className="text-sm font-bold text-white">{operator.missions}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle size={16} className="text-blue-400" />
                      <span className="text-sm text-slate-400">Success Rate</span>
                    </div>
                    <span className={`text-sm font-bold ${getSuccessRateColor(operator.successRate)}`}>
                      {operator.successRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity size={16} className="text-green-400" />
                      <span className="text-sm text-slate-400">Flight Hours</span>
                    </div>
                    <span className="text-sm font-bold text-white">{operator.flightHours}h</span>
                  </div>
                </div>

                {/* Certifications */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award size={16} className="text-yellow-400" />
                    <span className="text-sm text-slate-400">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {operator.certifications.map((cert, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Last Active */}
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Last Active</span>
                    <span className="text-xs font-semibold text-slate-400">{operator.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-900 rounded-b-xl flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Eye size={16} />
                  <span className="text-sm font-semibold">View Profile</span>
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
        {filteredOperators.length === 0 && (
          <div className="text-center py-16">
            <User size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No operators found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}