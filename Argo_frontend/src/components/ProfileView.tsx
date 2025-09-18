import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Thermometer,
  Droplets,
  Eye,
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

export const ProfileView: React.FC<ProfileViewProps> = ({ selectedFloat }) => {
  const [profileType, setProfileType] = useState("temperature");

  // Dummy profile data (replace later with backend data)
  const profileData = {
    temperature: [
      { depth: "0m", value: 18.4 },
      { depth: "50m", value: 17.2 },
      { depth: "100m", value: 15.8 },
      { depth: "200m", value: 13.5 },
      { depth: "500m", value: 9.2 },
      { depth: "1000m", value: 4.8 },
    ],
    salinity: [
      { depth: "0m", value: 36.1 },
      { depth: "50m", value: 36.3 },
      { depth: "100m", value: 36.0 },
      { depth: "200m", value: 35.8 },
      { depth: "500m", value: 35.2 },
      { depth: "1000m", value: 34.9 },
    ],
    oxygen: [
      { depth: "0m", value: 6.8 },
      { depth: "50m", value: 6.4 },
      { depth: "100m", value: 5.9 },
      { depth: "200m", value: 5.1 },
      { depth: "500m", value: 3.8 },
      { depth: "1000m", value: 2.5 },
    ],
  };

  const currentData =
    profileData[profileType as keyof typeof profileData] ||
    profileData.temperature;

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
                {currentData.map((_, index) => (
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
    </div>
  );
};
