import React, { useState } from 'react';
import { BarChart3, TrendingUp, Thermometer, Droplets, Eye } from 'lucide-react';

interface ProfileViewProps {
  selectedFloat: any;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ selectedFloat }) => {
  const [profileType, setProfileType] = useState('temperature');
  const [viewMode, setViewMode] = useState('depth-time');

  // Mock profile data
  const profileData = {
    temperature: [
      { depth: 0, value: 18.4, time: '2024-01-15' },
      { depth: 50, value: 17.2, time: '2024-01-15' },
      { depth: 100, value: 15.8, time: '2024-01-15' },
      { depth: 200, value: 13.5, time: '2024-01-15' },
      { depth: 500, value: 9.2, time: '2024-01-15' },
      { depth: 1000, value: 4.8, time: '2024-01-15' },
    ],
    salinity: [
      { depth: 0, value: 36.1, time: '2024-01-15' },
      { depth: 50, value: 36.3, time: '2024-01-15' },
      { depth: 100, value: 36.0, time: '2024-01-15' },
      { depth: 200, value: 35.8, time: '2024-01-15' },
      { depth: 500, value: 35.2, time: '2024-01-15' },
      { depth: 1000, value: 34.9, time: '2024-01-15' },
    ]
  };

  const currentData = profileData[profileType as keyof typeof profileData] || profileData.temperature;

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">
              {selectedFloat ? `Profile: ${selectedFloat.id}` : 'Ocean Profiles'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Type Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-red-400' },
            { id: 'salinity', label: 'Salinity', icon: Droplets, color: 'text-blue-400' },
            { id: 'oxygen', label: 'Oxygen', icon: TrendingUp, color: 'text-green-400' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setProfileType(type.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                profileType === type.id
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-400'
                  : 'bg-slate-700/50 hover:bg-slate-600/50'
              }`}
            >
              <type.icon className={`w-4 h-4 ${type.color}`} />
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {selectedFloat ? (
          <div className="space-y-4">
            {/* Profile Chart */}
            <div className="relative h-64 bg-gradient-to-b from-slate-700/30 to-slate-800/50 rounded-lg p-4">
              <div className="absolute inset-4">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Grid lines */}
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="400"
                      y2={y}
                      stroke="#475569"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}
                  
                  {/* Profile line */}
                  <path
                    d={`M ${currentData.map((point, i) => `${i * 60 + 40},${200 - (point.value / (profileType === 'temperature' ? 20 : 40)) * 180}`).join(' L ')}`}
                    fill="none"
                    stroke={profileType === 'temperature' ? '#ef4444' : '#06b6d4'}
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                  
                  {/* Data points */}
                  {currentData.map((point, i) => (
                    <circle
                      key={i}
                      cx={i * 60 + 40}
                      cy={200 - (point.value / (profileType === 'temperature' ? 20 : 40)) * 180}
                      r="4"
                      fill={profileType === 'temperature' ? '#ef4444' : '#06b6d4'}
                      className="animate-pulse"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Axis labels */}
              <div className="absolute bottom-2 left-4 text-xs text-slate-400">
                Depth (m)
              </div>
              <div className="absolute top-4 right-4 text-xs text-slate-400">
                {profileType === 'temperature' ? '°C' : 'PSU'}
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-700/30 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-600/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Depth (m)</th>
                      <th className="px-4 py-2 text-left">
                        {profileType === 'temperature' ? 'Temperature (°C)' : 'Salinity (PSU)'}
                      </th>
                      <th className="px-4 py-2 text-left">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((point, i) => (
                      <tr key={i} className="border-b border-slate-600/30">
                        <td className="px-4 py-2">{point.depth}</td>
                        <td className="px-4 py-2 font-mono">{point.value}</td>
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
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-300 mb-2">
              Select a Float to View Profiles
            </h4>
            <p className="text-slate-400">
              Click on a float marker in the map to explore its oceanographic data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};