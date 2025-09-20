import React, { useState, useEffect } from 'react';
import { Map, Navigation, Layers, Search, Filter } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap';
import { argoApi, ArgoFloat } from '../services/argoApi';

interface MapViewProps {
  selectedFloat: ArgoFloat | null;
  setSelectedFloat: (float: ArgoFloat | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({ selectedFloat, setSelectedFloat }) => {
  const [floats, setFloats] = useState<ArgoFloat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadFloats();
  }, [statusFilter]);

  const loadFloats = async () => {
    setLoading(true);
    try {
      const data = await argoApi.getFloats(
        undefined,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setFloats(data);
    } catch (error) {
      console.error('Error loading floats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFloats = floats.filter(float =>
    float.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    float.wmo_id.includes(searchTerm)
  );

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Map className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold">Global ARGO Float Map</h3>
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : `${filteredFloats.length} floats displayed`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'active' : statusFilter === 'active' ? 'inactive' : 'all')}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="capitalize">{statusFilter}</span>
            </button>
            <button 
              onClick={() => setSelectedFloat(null)}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search overlay */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by WMO ID, region, or coordinates..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="relative h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <InteractiveMap
            floats={filteredFloats}
            selectedFloat={selectedFloat}
            onFloatSelect={setSelectedFloat}
          />
        )}
      </div>
    </div>
  );
};