import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Thermometer,
  Droplets,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ArgoFloat, ProfileData, argoApi } from '../services/argoApi';
import { useEffect } from 'react';

interface ProfileViewProps {
  selectedFloat: ArgoFloat | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ selectedFloat }) => {
  const [profileType, setProfileType] = useState("temperature");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFloat) {
      loadProfile();
    }
  }, [selectedFloat]);

  const loadProfile = async () => {
    if (!selectedFloat) return;
    
    setLoading(true);
    try {
      const data = await argoApi.getFloatProfile(selectedFloat.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!profileData) return [];
    
    return profileData.depth.map((depth, index) => ({
      depth: `${depth}m`,
      depthValue: depth,
      temperature: profileData.temperature[index],
      salinity: profileData.salinity[index],
      oxygen: profileData.oxygen?.[index] || 0,
    }));
  };

  const chartData = getChartData();
  const currentValue = profileType as keyof typeof chartData[0];

  const getColor = () => {
    switch (profileType) {
      case 'temperature': return '#ef4444';
      case 'salinity': return '#06b6d4';
      case 'oxygen': return '#22c55e';
      default: return '#06b6d4';
    }
  };

  const getUnit = () => {
    switch (profileType) {
      case 'temperature': return '°C';
      case 'salinity': return 'PSU';
      case 'oxygen': return 'ml/L';
      default: return '';
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold">
                {selectedFloat
                  ? `Profile: ${selectedFloat.id}`
                  : "Ocean Profile"}
              </h3>
              {selectedFloat && (
                <p className="text-xs text-slate-400">
                  Cycle #{selectedFloat.cycle_number} • {selectedFloat.platform_type}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={loadProfile}
              disabled={!selectedFloat || loading}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Type Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            {
              id: "temperature",
              label: "Temperature",
              icon: Thermometer,
              color: "text-red-400",
            },
            {
              id: "salinity",
              label: "Salinity",
              icon: Droplets,
              color: "text-blue-400",
            },
            {
              id: "oxygen",
              label: "Oxygen",
              icon: TrendingUp,
              color: "text-green-400",
            },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setProfileType(type.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                profileType === type.id
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-400"
                  : "bg-slate-700/50 hover:bg-slate-600/50"
              }`}
            >
              <type.icon className={`w-4 h-4 ${type.color}`} />
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Data */}
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-4 text-cyan-400">
                {profileType.charAt(0).toUpperCase() + profileType.slice(1)} Profile
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="depth" 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={currentValue}
                    stroke={getColor()}
                    strokeWidth={2}
                    dot={{ fill: getColor(), strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Area Chart (Depth vs Value) */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-4 text-cyan-400">
                Depth Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="depthValue" 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={currentValue}
                    stroke={getColor()}
                    fill={getColor()}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a float to view profile data</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {chartData.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg overflow-hidden">
            <h4 className="text-sm font-semibold mb-2 text-cyan-400">
              Profile Data
            </h4>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-600/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Depth (m)</th>
                    <th className="px-4 py-2 text-left">
                      {profileType.charAt(0).toUpperCase() + profileType.slice(1)} ({getUnit()})
                    </th>
                    <th className="px-4 py-2 text-left">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point, i) => (
                    <tr key={i} className="border-b border-slate-600/30 hover:bg-slate-600/20">
                      <td className="px-4 py-2 font-mono">{point.depthValue}</td>
                      <td className="px-4 py-2 font-mono">
                        {typeof point[currentValue] === 'number' 
                          ? (point[currentValue] as number).toFixed(2)
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-emerald-400/20 text-emerald-400 rounded text-xs">
                          Good
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
