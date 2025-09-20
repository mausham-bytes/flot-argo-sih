import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { ArgoFloat } from '../services/argoApi';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  floats: ArgoFloat[];
  selectedFloat: ArgoFloat | null;
  onFloatSelect: (float: ArgoFloat | null) => void;
}

const activeFloatIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="8" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const inactiveFloatIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="8" fill="#f97316" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const MapController: React.FC<{ selectedFloat: ArgoFloat | null }> = ({ selectedFloat }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedFloat) {
      map.setView([selectedFloat.lat, selectedFloat.lon], 8);
    }
  }, [selectedFloat, map]);
  
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  floats,
  selectedFloat,
  onFloatSelect
}) => {
  const [mapCenter] = useState<[number, number]>([35, -15]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController selectedFloat={selectedFloat} />
        
        {floats.map((float) => (
          <Marker
            key={float.id}
            position={[float.lat, float.lon]}
            icon={float.status === 'active' ? activeFloatIcon : inactiveFloatIcon}
            eventHandlers={{
              click: () => onFloatSelect(float),
            }}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <h4 className="font-bold text-lg mb-2 text-cyan-600">{float.id}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      float.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {float.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Position:</span>
                    <span>{float.lat.toFixed(2)}°, {float.lon.toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Temperature:</span>
                    <span>{float.temperature?.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Salinity:</span>
                    <span>{float.salinity?.toFixed(1)} PSU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Profile:</span>
                    <span>{format(new Date(float.last_profile), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cycle:</span>
                    <span>#{float.cycle_number}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};