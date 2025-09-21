import React, { useState, useEffect } from 'react';
import { Waves, TrendingUp, Activity, Moon, Sun } from 'lucide-react';

interface StatisticsData {
  active_floats: number;
  avg_temperature: number;
  avg_salinity: number;
  total_data_points: number;
  temp_change: number;
  salinity_change: number;
  data_points_change: number;
}

interface HeaderProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle }) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [dataPoints, setDataPoints] = useState(2480675);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/argo/statistics');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setStats(data.statistics);
          }
        }
      } catch (error) {
        console.log('Header stats fetch failed, using fallback');
      }
    };

    fetchStats();
  }, []);

  // Simulate live data stream animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => prev + Math.floor(Math.random() * 50)); // Add random data points
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <header className={`${
      theme === 'dark' ? 'bg-slate-800/30' : 'bg-white/70 border-gray-200'
    } backdrop-blur-sm border-b border-slate-700/50`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Waves className={`w-8 h-8 ${
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              }`} />
              <div className={`absolute inset-0 animate-pulse ${
                theme === 'dark' ? 'bg-cyan-400/20' : 'bg-blue-400/20'
              } rounded-full`}></div>
            </div>
            <div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${
                theme === 'dark' ? 'from-cyan-400 to-blue-400' : 'from-blue-600 to-indigo-600'
              } bg-clip-text text-transparent`}>
                Nerida
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
              }`}>AI Oceanographer & ARGO Float Explorer</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">
                {stats ? `${stats.active_floats.toLocaleString()} Active Floats` : '3,847 Active Floats'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <TrendingUp className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
                }`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 ${
                  theme === 'dark' ? 'bg-emerald-400' : 'bg-green-500'
                } rounded-full animate-pulse`}></div>
              </div>
              <span className={`flex items-center ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                {formatNumber(dataPoints)}
                <span className={`ml-1 inline-block w-1 h-3 ${
                  theme === 'dark' ? 'bg-emerald-400' : 'bg-green-500'
                } animate-pulse`}></span>
                <span className={`ml-1 inline-block w-1 h-3 ${
                  theme === 'dark' ? 'bg-emerald-400' : 'bg-green-500'
                } animate-pulse animation-delay-100`}></span>
                <span className={`ml-1 inline-block w-1 h-3 ${
                  theme === 'dark' ? 'bg-emerald-400' : 'bg-green-500'
                } animate-pulse animation-delay-200`}></span>
              </span>
            </div>
            <button
              onClick={onThemeToggle}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm capitalize">{theme === 'dark' ? 'light' : 'dark'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};