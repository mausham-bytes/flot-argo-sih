import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, TrendingUp } from 'lucide-react';
import { argoApi } from '../services/argoApi';

export const SummaryCards: React.FC = () => {
  const [stats, setStats] = useState({
    activeFloats: 0,
    avgTemperature: 0,
    avgSalinity: 0,
    dataPoints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const floats = await argoApi.getFloats();
      const activeFloats = floats.filter(f => f.status === 'active');
      
      const avgTemp = activeFloats.reduce((sum, f) => sum + (f.temperature || 0), 0) / activeFloats.length;
      const avgSal = activeFloats.reduce((sum, f) => sum + (f.salinity || 0), 0) / activeFloats.length;
      
      setStats({
        activeFloats: activeFloats.length,
        avgTemperature: avgTemp,
        avgSalinity: avgSal,
        dataPoints: floats.length * 150 // Approximate profiles per float
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryData = [
    {
      title: 'Active Floats',
      value: loading ? '...' : stats.activeFloats.toLocaleString(),
      change: '+24',
      changeType: 'increase',
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30'
    },
    {
      title: 'Avg Temperature',
      value: loading ? '...' : `${stats.avgTemperature.toFixed(1)}°C`,
      change: '+0.3°C',
      changeType: 'increase',
      icon: Thermometer,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    },
    {
      title: 'Avg Salinity',
      value: loading ? '...' : `${stats.avgSalinity.toFixed(1)} PSU`,
      change: '+0.1 PSU',
      changeType: 'increase',
      icon: Droplets,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/30'
    },
    {
      title: 'Data Points',
      value: loading ? '...' : `${(stats.dataPoints / 1000).toFixed(1)}K`,
      change: '+12.5K',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {summaryData.map((item, index) => (
        <div
          key={index}
          className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border ${item.borderColor} p-6 hover:scale-105 transition-all duration-300 hover:shadow-xl ${loading ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              item.changeType === 'increase' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-red-400/20 text-red-400'
            }`}>
              {item.change}
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-1">{item.value}</h3>
            <p className="text-slate-300 text-sm">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};