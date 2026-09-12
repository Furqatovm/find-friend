import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { UserCardData, Activity } from '@/types';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { Calendar, MapPin, Users } from 'lucide-react';

// Fix Leaflet's default icon assets for Vite / modern bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NearbyMapProps {
  users: UserCardData[];
  activities?: Activity[];
  activeTab?: 'people' | 'activities';
  centerLat: number;
  centerLon: number;
  radiusKm?: number;
  onSelectUser?: (user: UserCardData) => void;
  onSelectActivity?: (activity: Activity) => void;
}

// Custom Leaflet DivIcon for user avatars
const createUserIcon = (avatarUrl?: string, name?: string, isMe?: boolean, isDark?: boolean) => {
  const initials = name ? name.slice(0, 2).toUpperCase() : 'U';
  const borderColor = isMe ? '#FFAA2B' : isDark ? '#FFFFFF' : '#111827';
  const bgColor = isDark ? '#0F0F0F' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';

  const html = `
    <div style="
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      ${avatarUrl
        ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />`
        : `<span style="color: ${textColor}; font-weight: 800; font-size: 11px;">${initials}</span>`
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-user-icon',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
};

// Custom Leaflet DivIcon for activities
const createActivityIcon = (category?: string, isDark?: boolean) => {
  const html = `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #FFAA2B;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(255, 170, 43, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000000;
      font-weight: 900;
      font-size: 14px;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      📍
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-activity-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// Component to handle map center/zoom updates and ensure container size calculation
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
}

export const NearbyMap: React.FC<NearbyMapProps> = ({
  users,
  activities = [],
  activeTab = 'people',
  centerLat,
  centerLon,
  radiusKm = 25,
  onSelectUser,
  onSelectActivity
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const safeLat = typeof centerLat === 'number' && !isNaN(centerLat) && centerLat !== 0 ? centerLat : 41.2995;
  const safeLon = typeof centerLon === 'number' && !isNaN(centerLon) && centerLon !== 0 ? centerLon : 69.2401;
  const defaultCenter: [number, number] = [safeLat, safeLon];

  const [mapStyle, setMapStyle] = useState<'theme' | 'osm' | 'streets' | 'satellite'>('theme');

  const getTileConfig = () => {
    if (mapStyle === 'satellite') {
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        subdomains: 'abc',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
      };
    }

    if (mapStyle === 'streets' || mapStyle === 'osm') {
      return {
        base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      };
    }

    // Default Theme Adaptive: CartoDB Dark in dark mode, Voyager in light mode
    if (isDark) {
      return {
        base: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      };
    }

    return {
      base: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    };
  };

  const tileConfig = getTileConfig();
  const calculatedZoom = radiusKm <= 5 ? 14 : radiusKm <= 15 ? 13 : radiusKm <= 30 ? 12 : 11;

  return (
    <div className="w-full h-full min-h-[460px] rounded-[16px] overflow-hidden border border-[#222222] relative shadow-2xl bg-[#080808]">
      {/* Map Style Selector Toolbar */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-[#0F0F0F]/90 backdrop-blur-md border border-[#262626] rounded-[10px] p-1 shadow-xl">
        <button
          type="button"
          onClick={() => setMapStyle('theme')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
            mapStyle === 'theme'
              ? 'bg-[#FFAA2B] text-black shadow-xs font-bold'
              : 'text-[#8A8A8A] hover:text-white'
          }`}
          title="Dark / Light theme map"
        >
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </button>

        <button
          type="button"
          onClick={() => setMapStyle('osm')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
            mapStyle === 'osm'
              ? 'bg-[#FFAA2B] text-black shadow-xs font-bold'
              : 'text-[#8A8A8A] hover:text-white'
          }`}
          title="OpenStreetMap Standard"
        >
          OSM
        </button>

        <button
          type="button"
          onClick={() => setMapStyle('satellite')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
            mapStyle === 'satellite'
              ? 'bg-[#FFAA2B] text-black shadow-xs font-bold'
              : 'text-[#8A8A8A] hover:text-white'
          }`}
          title="Satellite Imagery"
        >
          Satellite
        </button>
      </div>

      <MapContainer
        key={`${isDark ? 'dark' : 'light'}-${mapStyle}`}
        center={defaultCenter}
        zoom={calculatedZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '460px' }}
      >
        <MapController center={defaultCenter} zoom={calculatedZoom} />

        <TileLayer
          key={tileConfig.base}
          attribution={tileConfig.attribution}
          url={tileConfig.base}
          subdomains={tileConfig.subdomains}
          maxZoom={19}
        />

        {/* Center Approximate Pulse Circle */}
        <Circle
          center={defaultCenter}
          radius={Math.max(1000, radiusKm * 200)}
          pathOptions={{
            color: '#FFAA2B',
            fillColor: '#FFAA2B',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 4'
          }}
        />

        {/* Your Location Marker */}
        <Marker
          position={defaultCenter}
          icon={createUserIcon(undefined, 'You', true, isDark)}
        >
          <Popup>
            <div className="p-1 text-xs text-black dark:text-white">
              <p className="font-bold text-[#FFAA2B]">Your Approximate Area</p>
              <p className="text-[#8A8A8A] text-[11px] mt-0.5">Exact coordinates protected for privacy</p>
            </div>
          </Popup>
        </Marker>

        {/* User Markers (when on People tab or showing both) */}
        {activeTab === 'people' &&
          users.map((user) => {
            const lat = Number(user.approx_lat);
            const lon = Number(user.approx_lon);
            if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
            const pos: [number, number] = [lat, lon];

            return (
              <React.Fragment key={user.id}>
                <Circle
                  center={pos}
                  radius={800}
                  pathOptions={{
                    color: isDark ? '#444444' : '#CBD5E1',
                    fillColor: isDark ? '#FFAA2B' : '#3B82F6',
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
                    <div className="p-1.5 space-y-2 min-w-[200px] text-black">
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-neutral-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                            {user.display_name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-neutral-900">{user.display_name}</p>
                          <p className="text-[10px] text-neutral-500">{user.city || 'Nearby'}</p>
                        </div>
                      </div>

                      {user.compatibility && (
                        <CompatibilityBadge compatibility={user.compatibility} size="sm" />
                      )}

                      <Link to={`/users/${user.id}`} className="block pt-1">
                        <Button variant="primary" size="sm" className="w-full text-xs font-bold py-1 h-7">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* Activity Markers (when on Activities tab) */}
        {activeTab === 'activities' &&
          activities.map((act) => {
            const lat = Number(act.approx_latitude);
            const lon = Number(act.approx_longitude);
            if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;
            const pos: [number, number] = [lat, lon];

            return (
              <Marker
                key={act.id}
                position={pos}
                icon={createActivityIcon(act.category, isDark)}
                eventHandlers={{
                  click: () => onSelectActivity && onSelectActivity(act)
                }}
              >
                <Popup>
                  <div className="p-1.5 space-y-2 min-w-[200px] text-black">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFAA2B] text-black mb-1">
                        {act.category}
                      </span>
                      <p className="font-bold text-xs text-neutral-900">{act.title}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        📅 {act.event_date} {act.event_time ? `• ${act.event_time}` : ''}
                      </p>
                    </div>

                    <p className="text-[11px] text-neutral-600 line-clamp-2">
                      {act.description}
                    </p>

                    <Link to={`/activities/${act.id}`} className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full text-xs font-bold py-1 h-7">
                        Join Session
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
