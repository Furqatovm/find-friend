import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { UserCardData } from '@/types';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

interface NearbyMapProps {
  users: UserCardData[];
  centerLat: number;
  centerLon: number;
  radiusKm?: number;
  onSelectUser?: (user: UserCardData) => void;
}

// Custom Leaflet DivIcon for privacy-fuzzed user avatars
const createUserIcon = (avatarUrl?: string, name?: string, isMe?: boolean, isDark?: boolean) => {
  const initials = name ? name.slice(0, 2).toUpperCase() : 'U';
  const borderColor = isMe ? '#F59E0B' : isDark ? '#FFFFFF' : '#111827';
  const bgColor = isDark ? '#0F0F0F' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';

  const html = `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      ${avatarUrl
        ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
        : `<span style="color: ${textColor}; font-weight: 800; font-size: 11px;">${initials}</span>`
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-user-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const NearbyMap: React.FC<NearbyMapProps> = ({
  users,
  centerLat,
  centerLon,
  radiusKm = 25,
  onSelectUser
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const defaultCenter: [number, number] = [centerLat || 41.2995, centerLon || 69.2401];

  const [mapStyle, setMapStyle] = useState<'theme' | 'osm' | 'streets' | 'satellite'>('theme');

  // Determine active tile provider (Zero watermark, 100% free open tiles)
  const getTileConfig = () => {
    if (mapStyle === 'satellite') {
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        overlay: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
      };
    }

    if (mapStyle === 'streets') {
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        overlay: null
      };
    }

    if (mapStyle === 'osm') {
      return {
        base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        overlay: null
      };
    }

    // Default Theme Adaptive: Dark Canvas in dark mode, World Street/OpenStreetMap in light mode
    if (isDark) {
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
        overlay: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
      };
    }

    return {
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, DeLorme, NAVTEQ, TomTom, OpenStreetMap contributors',
      overlay: null
    };
  };

  const tileConfig = getTileConfig();

  return (
    <div className="w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-[#242424] relative shadow-2xl bg-neutral-100 dark:bg-[#080808]">
      {/* Map Layer Selector Toolbar */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/90 dark:bg-[#0F0F0F]/90 backdrop-blur-md border border-neutral-200 dark:border-[#242424] rounded-xl p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setMapStyle('theme')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'theme'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
          }`}
          title="Theme Adaptive (Dark Canvas / Crisp Light)"
        >
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </button>

        <button
          type="button"
          onClick={() => setMapStyle('streets')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'streets'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
          }`}
          title="World Street Map"
        >
          Streets
        </button>

        <button
          type="button"
          onClick={() => setMapStyle('osm')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'osm'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
          }`}
          title="OpenStreetMap Standard"
        >
          OSM
        </button>

        <button
          type="button"
          onClick={() => setMapStyle('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mapStyle === 'satellite'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
          }`}
          title="Satellite Imagery"
        >
          Satellite
        </button>
      </div>

      <MapContainer
        key={`${theme}-${mapStyle}`}
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <ChangeMapView center={defaultCenter} zoom={radiusKm <= 5 ? 14 : radiusKm <= 15 ? 13 : 12} />
        
        {/* Base Tile Layer (No watermark) */}
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.base}
          maxZoom={19}
        />

        {/* Optional Label Reference Overlay Layer */}
        {tileConfig.overlay && (
          <TileLayer
            attribution=""
            url={tileConfig.overlay}
            maxZoom={19}
          />
        )}

        {/* Current user approximate center pulse circle */}
        <Circle
          center={defaultCenter}
          radius={1000}
          pathOptions={{
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '3, 3'
          }}
        />

        {/* You marker */}
        <Marker
          position={defaultCenter}
          icon={createUserIcon(undefined, 'You', true, isDark)}
        >
          <Popup>
            <div className="p-1 text-xs">
              <p className="font-bold text-amber-500 dark:text-amber-400">Your Approximate Area</p>
              <p className="text-neutral-500 dark:text-[#8A8A8A] text-[11px] mt-0.5">Exact coordinates shielded for privacy</p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby candidate users */}
        {users.map((user) => {
          if (!user.approx_lat || !user.approx_lon) return null;
          const pos: [number, number] = [user.approx_lat, user.approx_lon];

          return (
            <React.Fragment key={user.id}>
              {/* Privacy area bubble */}
              <Circle
                center={pos}
                radius={800}
                pathOptions={{
                  color: isDark ? '#444444' : '#CBD5E1',
                  fillColor: isDark ? '#FFFFFF' : '#3B82F6',
                  fillOpacity: 0.04,
                  weight: 1
                }}
              />
              <Marker
                position={pos}
                icon={createUserIcon(user.avatar_url, user.display_name, false, isDark)}
                eventHandlers={{
                  click: () => onSelectUser && onSelectUser(user)
                }}
              >
                <Popup>
                  <div className="p-1.5 space-y-2 min-w-[190px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xs">
                        {user.display_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-xs">{user.display_name}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">{user.city || 'Nearby'}</p>
                      </div>
                    </div>
                    {user.compatibility && (
                      <CompatibilityBadge compatibility={user.compatibility} size="sm" />
                    )}
                    <Link to={`/users/${user.id}`} className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
