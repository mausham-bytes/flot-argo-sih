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
    <header className={`sticky top-0 z-50 ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-slate-900/95 via-blue-950/95 to-slate-900/95Backdrop-blur-xl border-b border-slate-700/50'
        : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50'
    } shadow-lg`}>
      <div className="container mx-auto px-4 py-3">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Waves className={`w-6 h-6 ${
                  theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                }`} />
                <div className={`absolute inset-0 animate-pulse ${
                  theme === 'dark' ? 'bg-cyan-400/30' : 'bg-blue-400/30'
                } rounded-full`}></div>
              </div>
              <div>
                <h1 className={`text-lg font-bold bg-gradient-to-r ${
                  theme === 'dark'
                    ? 'from-cyan-400 to-blue-400'
                    : 'from-blue-600 to-indigo-600'
                } bg-clip-text text-transparent`}>
                  Nerida
                </h1>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-900/70'
                }`}>AI Oceanographer</p>
              </div>
            </div>
            <button
              onClick={onThemeToggle}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Stats Row */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-secondary" />
              <span className={`${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stats ? `${stats.active_floats} Floats` : '3.8K Floats'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className={`w-3 h-3 ${theme === 'dark' ? 'text-green-500' : 'text-green-500'}`} />
              <span className={`${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {formatNumber(dataPoints)} Data Points
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Waves className={`w-10 h-10 ${
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              }`} />
              <div className={`absolute inset-0 animate-pulse ${
                theme === 'dark' ? 'bg-cyan-400/20' : 'bg-blue-400/20'
              } rounded-full`}></div>
            </div>
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${
                theme === 'dark'
                  ? 'from-cyan-400 via-blue-400 to-indigo-500'
                  : 'from-blue-600 via-indigo-600 to-cyan-600'
              } bg-clip-text text-transparent`}>
                Nerida
              </h1>
              <p className={`text-base ${
                theme === 'dark' ? 'text-white/80' : 'text-gray-900/80'
              }`}>AI Oceanographer & ARGO Float Explorer</p>
            </div>
          </div>

          <div className="flex items-center space-x-8 text-sm">
            {/* Active Floats Stat */}
            <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg px-4 py-2">
              <Activity className="w-5 h-5 text-secondary" />
              <div>
                <div className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats ? stats.active_floats.toLocaleString() : '3,847'}
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-gray-900/60'
                }`}>Active Floats</div>
              </div>
            </div>

            {/* Data Points Stat */}
            <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg px-4 py-2">
              <div className="relative">
                <TrendingUp className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-green-500' : 'text-green-500'
                }`} />
                <div className={`absolute -top-1 -right-1 w-3 h-3 ${
                  theme === 'dark' ? 'bg-green-500' : 'bg-green-500'
                } rounded-full animate-pulse`}></div>
              </div>
              <div>
                <div className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatNumber(dataPoints)}
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-gray-900/60'
                }`}>Data Points</div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 shadow-lg shadow-slate-900/50'
                  : 'bg-gray-200 hover:bg-gray-300 shadow-lg shadow-gray-600/10'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};