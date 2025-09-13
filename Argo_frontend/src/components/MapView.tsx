import React, { useState } from 'react';
import { Map, Navigation, Layers, Search } from 'lucide-react';

interface MapViewProps {
  selectedFloat: any;
  setSelectedFloat: (float: any) => void;
}

export const MapView: React.FC<MapViewProps> = ({ selectedFloat, setSelectedFloat }) => {
  const [mapLayer, setMapLayer] = useState('satellite');
  
  // Mock ARGO float data
  const argoFloats = [
    { id: 'WMO_6901234', lat: 35.5, lon: -15.2, status: 'active', lastProfile: '2024-01-15', temperature: 18.4, salinity: 36.1 },
    { id: 'WMO_6901235', lat: 42.1, lon: -8.7, status: 'active', lastProfile: '2024-01-14', temperature: 15.2, salinity: 35.8 },
    { id: 'WMO_6901236', lat: 38.9, lon: -12.4, status: 'inactive', lastProfile: '2024-01-10', temperature: 16.8, salinity: 35.9 },
    { id: 'WMO_6901237', lat: 31.2, lon: -18.6, status: 'active', lastProfile: '2024-01-15', temperature: 20.1, salinity: 36.3 }
  ];

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Map className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">Global ARGO Float Map</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMapLayer(mapLayer === 'satellite' ? 'ocean' : 'satellite')}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm capitalize">{mapLayer}</span>
            </button>
            <button className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-96 bg-gradient-to-br from-blue-900 to-slate-900">
        {/* Mock world map background */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <path 
              d="M100,100 Q200,80 300,100 T500,120 T700,100"
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="2"
              className="animate-pulse"
            />
            <circle cx="150" cy="120" r="40" fill="#0891b2" opacity="0.3" />
            <circle cx="350" cy="140" r="60" fill="#0891b2" opacity="0.3" />
            <circle cx="550" cy="110" r="45" fill="#0891b2" opacity="0.3" />
          </svg>
        </div>

        {/* ARGO Float markers */}
        <div className="absolute inset-0">
          {argoFloats.map((float, index) => (
            <div
              key={float.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedFloat?.id === float.id ? 'scale-150 z-10' : 'hover:scale-125'
              }`}
              style={{
                left: `${(float.lon + 180) / 360 * 100}%`,
                top: `${(90 - float.lat) / 180 * 100}%`
              }}
              onClick={() => setSelectedFloat(selectedFloat?.id === float.id ? null : float)}
            >
              <div className={`w-4 h-4 rounded-full border-2 ${
                float.status === 'active' 
                  ? 'bg-emerald-400 border-emerald-200 shadow-lg shadow-emerald-400/50' 
                  : 'bg-orange-400 border-orange-200 shadow-lg shadow-orange-400/50'
              } animate-pulse`} />
              
              {selectedFloat?.id === float.id && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-600 rounded-lg p-3 min-w-48 shadow-xl">
                  <h4 className="font-semibold text-cyan-400 mb-2">{float.id}</h4>
                  <div className="space-y-1 text-sm">
                    <div>Status: <span className={float.status === 'active' ? 'text-emerald-400' : 'text-orange-400'}>{float.status}</span></div>
                    <div>Position: {float.lat}°, {float.lon}°</div>
                    <div>Temperature: {float.temperature}°C</div>
                    <div>Salinity: {float.salinity} PSU</div>
                    <div>Last Profile: {float.lastProfile}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search overlay */}
        <div className="absolute top-4 left-4 right-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by WMO ID, region, or coordinates..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-600 rounded-lg p-3">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              <span>Active Float</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span>Inactive Float</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};