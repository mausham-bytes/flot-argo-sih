import React, { useState, useEffect } from 'react';
import { Map, Layers, Search, Loader2, AlertCircle, Calendar, BarChart3 } from 'lucide-react';

interface MapViewProps {
  selectedFloat: any;
  setSelectedFloat: (float: any) => void;
  theme: 'dark' | 'light';
  mapPoints?: {lat: number, lon: number, salinity: number}[];
}

interface ArgoFloat {
  id: string;
  lat: number;
  lon: number;
  temperature: number | null;
  salinity: number | null;
  pressure: number | null;
  cycle: number | null;
  time: string | null;
  status: string;
}

export const MapView: React.FC<MapViewProps> = ({ selectedFloat, setSelectedFloat, theme, mapPoints }) => {
  const [mapLayer, setMapLayer] = useState('ocean'); // Start with ocean view as default
  const [argoFloats, setArgoFloats] = useState<ArgoFloat[]>([]);
  const [filteredFloats, setFilteredFloats] = useState<ArgoFloat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const toggleMapLayer = () => {
    setMapLayer(mapLayer === 'satellite' ? 'ocean' : 'satellite');
  };

  // Extract year and adjust date filters from search term
  const extractDateFilterFromSearch = (term: string) => {
    const yearMatch = term.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = yearMatch[1];
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      };
    }
    return null;
  };

  useEffect(() => {
    const fetchArgoFloats = async () => {
      try {
        // Build query string with date filters
        const params = new URLSearchParams();
        if (startDate !== '2015-01-01') params.set('start_date', startDate);
        if (endDate !== '2024-12-31') params.set('end_date', endDate);

        const url = `/floats/locations${params.toString() ? '?' + params.toString() : ''}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'success') {
          setArgoFloats(data.floats);
          console.log(`Loaded ${data.floats.length} ARGO floats for ${data.date_range?.start} to ${data.date_range?.end}`);
        } else {
          throw new Error(data.message || 'Failed to load float data');
        }
      } catch (err) {
        console.error('Error fetching ARGO floats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchArgoFloats();
  }, [startDate, endDate]);

  // Filter floats based on search term and adjust date filters if year detected
  useEffect(() => {
    const dateFilters = extractDateFilterFromSearch(searchTerm);
    if (dateFilters) {
      setStartDate(dateFilters.startDate);
      setEndDate(dateFilters.endDate);
    }

    if (!searchTerm.trim()) {
      setFilteredFloats(argoFloats);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = argoFloats.filter(float => {
        // Search by float ID/WMO number
        if (float.id.toLowerCase().includes(term)) return true;

        // Search by coordinates (lat,lon format)
        if (`${float.lat.toFixed(1)},${float.lon.toFixed(1)}`.includes(term)) return true;
        if (`${float.lat.toFixed(0)},${float.lon.toFixed(0)}`.includes(term)) return true;

        // Search by cycle number
        if (float.cycle && float.cycle.toString().includes(term)) return true;

        // Search by ocean regions
        if (term.includes('atlantic')) {
          return float.lon >= -70 && float.lon <= 20 && Math.abs(float.lat) <= 60;
        }
        if (term.includes('pacific')) {
          return (float.lon >= 120 || float.lon <= -70) && Math.abs(float.lat) <= 60;
        }
        if (term.includes('indian')) {
          return float.lon >= 20 && float.lon <= 120 && float.lat >= -60 && float.lat <= 30;
        }

        // Search by latitude bands
        if (term.includes('north') || term === 'arctic') {
          return float.lat > 23;
        }
        if (term.includes('south') || term === 'antarctic') {
          return float.lat < -23;
        }
        if (term.includes('equatorial') || term === 'equator') {
          return Math.abs(float.lat) <= 23;
        }

        return false;
      });
      setFilteredFloats(filtered);
    }
  }, [searchTerm, argoFloats]);

  return (
    <div className={`${
      theme === 'dark'
        ? 'bg-slate-800/30 border-slate-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-sm rounded-xl border overflow-hidden`}>
      <div className={`p-3 border-b ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Map className={`w-5 h-5 ${
              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
            }`} />
            <div>
              <h3 className={`font-medium text-sm md:text-base ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>ARGO Float Network</h3>
              {argoFloats.length > 0 && (
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mt-0.5`}>
                  Total: {argoFloats.length} floats ({argoFloats.filter(f => f.status === 'active').length} active, {argoFloats.filter(f => f.status === 'inactive').length} inactive)
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMapLayer}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 text-xs md:text-sm ${
                mapLayer === 'satellite'
                  ? theme === 'dark'
                    ? 'bg-cyan-500 text-slate-900'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                  : 'bg-gray-200/70 hover:bg-gray-300/70 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{mapLayer}</span>
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 text-xs md:text-sm ${
                showStats
                  ? theme === 'dark'
                    ? 'bg-cyan-500 text-slate-900'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                  : 'bg-gray-200/70 hover:bg-gray-300/70 text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200 text-xs md:text-sm ${
                theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                  : 'bg-gray-200/70 hover:bg-gray-300/70 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Panel */}
      {showDateFilter && (
        <div className={`p-3 border-t ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h4 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Filter by Date Range</h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min="2000-01-01"
                  max={endDate}
                  className={`px-2 py-1 text-xs rounded border ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                }`}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max="2025-12-31"
                  className={`px-2 py-1 text-xs rounded border ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <button
                onClick={() => setShowDateFilter(false)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-600 hover:bg-slate-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {showStats && (
        <div className={`p-3 border-t ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <h4 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Float Status Summary
          </h4>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                Total Floats:
              </span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
                {argoFloats.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`}>
                Active:
              </span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`}>
                {argoFloats.filter(f => f.status === 'active').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`}>
                Inactive:
              </span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`}>
                {argoFloats.filter(f => f.status === 'inactive').length}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="relative h-96">
        {/* Layer-specific background gradients */}
        <div className={`absolute inset-0 transition-all duration-700 ${
          mapLayer === 'satellite'
            ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800'
            : 'bg-gradient-to-br from-cyan-900 via-blue-800 to-slate-900'
        }`}>
        </div>

        {/* Satellite Image Layer */}
        {mapLayer === 'satellite' && (
          <div className="absolute inset-0">
            <svg viewBox="-180 -90 360 180" className="w-full h-full">
              {/* Satellite background pattern */}
              <defs>
                <pattern id="satelliteImage" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect width="10" height="10" fill="#1e1b4b" opacity="0.4" />
                  <circle cx="2" cy="2" r="1" fill="#a78bfa" opacity="0.6" />
                  <circle cx="8" cy="6" r="0.5" fill="#c4b5fd" opacity="0.4" />
                </pattern>
                <pattern id="satelliteGrid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" stroke="#6366f1" strokeWidth="0.5" opacity="0.3" fill="none" />
                </pattern>
              </defs>
              <rect x="-180" y="-90" width="360" height="180" fill="url(#satelliteImage)" />
              <rect x="-180" y="-90" width="360" height="180" fill="url(#satelliteGrid)" opacity="0.6" />
            </svg>
          </div>
        )}

        {/* Ocean Layer */}
        {mapLayer === 'ocean' && (
          <div className="absolute inset-0">
            <svg viewBox="-180 -90 360 180" className="w-full h-full">
              {/* Ocean background */}
              <rect x="-180" y="-90" width="360" height="180" fill="#001122" opacity="0.95" />

              {/* Ocean depth layers */}
              <defs>
                <radialGradient id="deepOcean">
                  <stop offset="0%" stopColor="#000411" stopOpacity="1" />
                  <stop offset="70%" stopColor="#082f49" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#164e63" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="oceanWaves">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Multiple ocean depth circles for realism */}
              <circle cx="-80" cy="20" r="120" fill="url(#deepOcean)" />
              <circle cx="60" cy="-10" r="90" fill="url(#deepOcean)" />
              <circle cx="-20" cy="-40" r="85" fill="url(#oceanWaves)" />
              <circle cx="100" cy="30" r="70" fill="url(#oceanWaves)" />

              {/* Ocean surface wave patterns */}
              <defs>
                <pattern id="waves" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20 Q10 5 20 20 T40 20" stroke="#0891b2" strokeWidth="1" opacity="0.3" fill="none" />
                  <path d="M0 25 Q10 10 20 25 T40 25" stroke="#06b6d4" strokeWidth="0.8" opacity="0.2" fill="none" />
                </pattern>
              </defs>
              <rect x="-180" y="-90" width="360" height="180" fill="url(#waves)" opacity="0.4" />
            </svg>
          </div>
        )}

        {/* World continents - shared by both layers */}
        <div className="absolute inset-0">
          <svg viewBox="-180 -90 360 180" className="w-full h-full">
            {/* Continent outlines with dynamic colors based on layer */}
            <g stroke={mapLayer === 'satellite' ? '#a78bfa' : '#475569'}
               strokeWidth="1.5" fill="none" opacity={mapLayer === 'satellite' ? '0.7' : '0.6'}>
              {/* North America */}
              <path d="M-160,15 L-130,25 L-115,32 L-95,38 L-75,32 L-60,25 L-50,10 L-60,5 L-75,-5 L-90,-8 L-110,-5 L-130,5 L-150,-2 L-160,15"
                    fill={mapLayer === 'satellite' ? '#3730a3' : '#334155'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
              {/* South America */}
              <path d="M-80,-10 L-70,5 L-65,25 L-60,40 L-45,42 L-25,40 L-15,35 L-12,25 L-8,15 L-15,5 L-25,-2 L-40,0 L-55,-5 L-70,-5 L-80,-10"
                    fill={mapLayer === 'satellite' ? '#5b21b6' : '#374151'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
              {/* Europe */}
              <path d="M-10,45 L5,48 L20,50 L40,48 L45,45 L50,40 L55,35 L50,30 L40,32 L30,35 L15,40 L5,42 L-5,44 L-10,45"
                    fill={mapLayer === 'satellite' ? '#4c1d95' : '#4b5563'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
              {/* Africa */}
              <path d="M-15,-5 L-10,10 L-5,25 L10,42 L25,45 L35,43 L40,38 L45,30 L50,20 L45,10 L40,-10 L35,-25 L25,-35 L15,-40 L5,-38 L-5,-30 L-10,-20 L-15,-5"
                    fill={mapLayer === 'satellite' ? '#581c87' : '#4b5563'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
              {/* Asia */}
              <path d="M45,40 L65,42 L80,45 L100,48 L130,50 L160,48 L175,45 L180,42 L175,35 L165,32 L150,38 L130,42 L110,44 L85,40 L70,38 L55,35 L45,40"
                    fill={mapLayer === 'satellite' ? '#7c3aed' : '#6b7280'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
              {/* Australia */}
              <rect x="120" y="-40" width="30" height="15" rx="3"
                    fill={mapLayer === 'satellite' ? '#6d28d9' : '#71717a'} fillOpacity={mapLayer === 'satellite' ? '0.3' : '0.2'} />
            </g>
          </svg>
        </div>

        {/* ARGO Float markers */}
        <div className="absolute inset-0">
          {!loading && !error && filteredFloats.slice(0, 1000).map((float) => (
            <div
              key={float.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                selectedFloat?.id === float.id ? 'scale-110 z-10' : 'hover:scale-105'
              }`}
              style={{
                left: `${(float.lon + 180) / 360 * 100}%`,
                top: `${(90 - float.lat) / 180 * 100}%`
              }}
              onClick={() => setSelectedFloat(selectedFloat?.id === float.id ? null : float)}
            >
              <div className={`w-2.5 h-2.5 rounded-full border ${
                float.status === 'active'
                  ? 'bg-emerald-500 border-emerald-400'
                  : 'bg-orange-500 border-orange-400'
              }`} />

              {selectedFloat?.id === float.id && (
                <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 border rounded-lg p-3 min-w-48 shadow-xl ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                  }`}>{float.id}</h4>
                  <div className="space-y-1 text-sm">
                    <div>Status: <span className={
                      float.status === 'active'
                        ? theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-500'
                    }>{float.status}</span></div>
                    <div>Position: {float.lat.toFixed(2)}°, {float.lon.toFixed(2)}°</div>
                    {float.temperature !== null && (
                      <div>Temperature: {float.temperature.toFixed(1)}°C</div>
                    )}
                    {float.salinity !== null && (
                      <div>Salinity: {float.salinity.toFixed(1)} PSU</div>
                    )}
                    {float.pressure !== null && (
                      <div>Pressure: {float.pressure.toFixed(0)} dbar</div>
                    )}
                    {float.cycle !== null && (
                      <div>Cycle: {float.cycle}</div>
                    )}
                    {float.time && (
                      <div>Last Profile: {float.time.split(' ')[0]}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Query result salinity markers */}
          {mapPoints && mapPoints.slice(0, 500).map((point, index) => (
            <div
              key={`query-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(point.lon + 180) / 360 * 100}%`,
                top: `${(90 - point.lat) / 180 * 100}%`
              }}
            >
              <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400 opacity-80" />
            </div>
          ))}
        </div>

        {/* Minimal Search overlay */}
        <div className="absolute top-2 left-2 right-2">
          <div className="relative">
            <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search floats..."
              title="Search by: WMO ID (e.g. WMO_1_52), coordinates (e.g. 30,-35), regions (Indian, Atlantic, Pacific), or cycle numbers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                  e.currentTarget.blur();
                }
              }}
              className={`w-full pl-6 pr-6 py-1.5 backdrop-blur-sm border rounded text-xs focus:outline-none transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800/60 border-slate-600 focus:border-cyan-400 text-white placeholder:text-slate-400'
                  : 'bg-white/70 border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                title="Clear search (ESC)"
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-slate-600 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center ${
            theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'
          }`}>
            <div className="text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-2 ${
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              }`} />
              <p className={`${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>Loading ARGO float data...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center ${
            theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'
          }`}>
            <div className="text-center">
              <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-500'
              }`} />
              <p className={`mb-2 ${
                theme === 'dark' ? 'text-red-300' : 'text-red-600'
              }`}>Error loading map data</p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
              }`}>{error}</p>
            </div>
          </div>
        )}

        {/* Status display with active/inactive counts */}
        {!loading && !error && (searchTerm || filteredFloats.length !== argoFloats.length) && (
          <div className={`absolute top-12 right-2 backdrop-blur-sm border rounded px-2 py-1 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-600 text-slate-300'
              : 'bg-white/80 border-gray-300 text-gray-700'
          }`}>
            <div className="text-xs">
              {filteredFloats.length} found<br/>
              {filteredFloats.filter(f => f.status === 'active').length} active, {filteredFloats.filter(f => f.status === 'inactive').length} inactive
            </div>
          </div>
        )}

        {/* Subtle layer indicator */}
        {!loading && !error && (
          <div className={`absolute top-12 left-2 backdrop-blur-sm border rounded px-2 py-1 ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-600 text-slate-300'
              : 'bg-white/80 border-gray-300 text-gray-700'
          }`}>
            <div className="text-xs flex items-center">
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                mapLayer === 'satellite'
                  ? theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'
                  : theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-500'
              }`} />
              {mapLayer}
            </div>
          </div>
        )}

        {/* Compact Legend */}
        <div className={`absolute bottom-3 left-3 backdrop-blur-sm border rounded-md px-2 py-1.5 ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-slate-600'
            : 'bg-white/80 border-gray-300'
        }`}>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-emerald-500' : 'bg-green-500'
              }`}></div>
              <span className={`${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>Active</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-orange-500' : 'bg-orange-400'
              }`}></div>
              <span className={`${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>Inactive</span>
            </div>
            {mapPoints && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                }`}></div>
                <span className={`${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                }`}>Query</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};