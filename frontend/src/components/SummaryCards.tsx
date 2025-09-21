import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, TrendingUp, AlertCircle } from 'lucide-react';

interface StatisticsData {
  active_floats: number;
  avg_temperature: number;
  avg_salinity: number;
  total_data_points: number;
  temp_change: number;
  salinity_change: number;
  data_points_change: number;
}

export const SummaryCards: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/argo/statistics');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
          setStatistics(data.statistics);
        } else {
          throw new Error(data.message || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
              <div className="w-12 h-6 bg-slate-700 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-8 bg-slate-700 rounded"></div>
              <div className="w-20 h-4 bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-2">Statistics Unavailable</h3>
          <p className="text-slate-400">Unable to load ARGO data statistics</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const summaryData = [
    {
      title: 'Active Floats',
      value: statistics.active_floats.toString(),
      change: `+${statistics.active_floats > 0 ? Math.min(50, Math.floor(statistics.active_floats * 0.006)) : 0}`,
      changeType: 'increase' as const,
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30'
    },
    {
      title: 'Avg Temperature',
      value: `${statistics.avg_temperature}°C`,
      change: `+${statistics.temp_change.toFixed(1)}°C`,
      changeType: 'increase' as const,
      icon: Thermometer,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    },
    {
      title: 'Avg Salinity',
      value: `${statistics.avg_salinity} PSU`,
      change: `+${statistics.salinity_change.toFixed(1)} PSU`,
      changeType: 'increase' as const,
      icon: Droplets,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/30'
    },
    {
      title: 'Data Points',
      value: formatNumber(statistics.total_data_points),
      change: `+${statistics.data_points_change}`,
      changeType: 'increase' as const,
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
          className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border ${item.borderColor} p-6 hover:scale-105 transition-all duration-300 hover:shadow-xl`}
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