import React from 'react';
import { Waves, MapPin, TrendingUp } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Waves className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 animate-pulse bg-cyan-400/20 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Nerida
              </h1>
              <p className="text-sm text-slate-300">AI Oceanographer & ARGO Float Explorer</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">3,847 Active Floats</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Live Data Stream</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};