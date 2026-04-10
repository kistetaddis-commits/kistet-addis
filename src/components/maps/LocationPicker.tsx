import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const LocationMarker = ({ lat, lng, onChange }: LocationPickerProps) => {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <Marker position={[lat, lng]} />
  );
};

const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChange }) => {
  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
        <RecenterMap lat={lat} lng={lng} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-2 pointer-events-none">
        <MapPin className="w-4 h-4 text-blue-600" />
        <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
      <div className="absolute top-4 right-4 z-[1000] bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-wider">Click to select location</span>
      </div>
    </div>
  );
};

export default LocationPicker;