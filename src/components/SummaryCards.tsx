import React from 'react';
import { Activity, Thermometer, Droplets, TrendingUp } from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const summaryData = [
    {
      title: 'Active Floats',
      value: '3,847',
      change: '+24',
      changeType: 'increase',
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30'
    },
    {
      title: 'Avg Temperature',
      value: '16.8°C',
      change: '+0.3°C',
      changeType: 'increase',
      icon: Thermometer,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    },
    {
      title: 'Avg Salinity',
      value: '35.9 PSU',
      change: '+0.1 PSU',
      changeType: 'increase',
      icon: Droplets,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/30'
    },
    {
      title: 'Data Points',
      value: '2.4M',
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