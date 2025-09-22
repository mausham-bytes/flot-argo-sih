import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Thermometer,
  Droplets,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ProfileViewProps {
  selectedFloat: any;
}

interface ProfileDataPoint {
  depth: string;
  value: number;
  unit?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ selectedFloat }) => {
  const [profileType, setProfileType] = useState("temperature");
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async (parameter: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://127.0.0.1:5000/argo/profile/${parameter}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
          setProfileData(data.profile);
        } else {
          throw new Error(data.message || 'Failed to load profile data');
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
        // Fallback to empty profile
        setProfileData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData(profileType);
  }, [profileType]);

  if (loading && !profileData) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-slate-300">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden p-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 mb-2">Error loading profile data</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentData = profileData || [];

  const pieColors = ["#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#f97316", "#ef4444"];

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">
              {selectedFloat
                ? `Profile: ${selectedFloat.id}`
                : "Ocean Profile"}
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
        {/* Bar + Pie charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-cyan-400">
              {profileType.charAt(0).toUpperCase() + profileType.slice(1)} vs Depth
            </h4>
            <BarChart width={350} height={250} data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depth" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                fill={profileType === "temperature" ? "#ef4444" : profileType === "salinity" ? "#06b6d4" : "#22c55e"}
              />
            </BarChart>
          </div>

          {/* Pie Chart */}
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-cyan-400">
              Proportional Distribution
            </h4>
            <PieChart width={350} height={250}>
              <Pie
                data={currentData}
                dataKey="value"
                nameKey="depth"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {currentData.map((_point: ProfileDataPoint, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-700/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-600/50">
                <tr>
                  <th className="px-4 py-2 text-left">Depth</th>
                  <th className="px-4 py-2 text-left">
                    {profileType === "temperature"
                      ? "Temperature (°C)"
                      : profileType === "salinity"
                      ? "Salinity (PSU)"
                      : "Oxygen (ml/L)"}
                  </th>
                  <th className="px-4 py-2 text-left">Quality</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((point: ProfileDataPoint, i: number) => (
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
    </div>
  );
};
