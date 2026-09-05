import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
  hasLocationPermission: boolean;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  isLocating: boolean;
  requestLocationPermission: () => Promise<boolean>;
  setLocationManually: (city: string, lat?: number, lon?: number) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(41.2995); // Default Tashkent coordinates
  const [longitude, setLongitude] = useState<number | null>(69.2401);
  const [city, setCity] = useState<string | null>('Tashkent');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (user?.location_pref?.location_enabled) {
      setHasLocationPermission(true);
      if (user.profile?.city) {
        setCity(user.profile.city);
      }
    }
  }, [user]);

  const requestLocationPermission = async (): Promise<boolean> => {
    setIsLocating(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setIsLocating(false);
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setHasLocationPermission(true);
          setIsLocating(false);

          try {
            await api.post('/nearby/location', {
              latitude: lat,
              longitude: lon,
              city: city || 'My Area'
            });
          } catch (e) {
            console.error('Failed to sync location to backend', e);
          }
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable', err);
          setIsLocating(false);
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  };

  const setLocationManually = async (manualCity: string, lat?: number, lon?: number) => {
    setCity(manualCity);
    const resolvedLat = lat ?? 41.2995;
    const resolvedLon = lon ?? 69.2401;
    setLatitude(resolvedLat);
    setLongitude(resolvedLon);
    setHasLocationPermission(true);

    try {
      await api.post('/nearby/location', {
        latitude: resolvedLat,
        longitude: resolvedLon,
        city: manualCity
      });
    } catch (e) {
      console.error('Failed to update manual location', e);
    }
  };

  return (
    <LocationContext.Provider value={{
      hasLocationPermission,
      latitude,
      longitude,
      city,
      isLocating,
      requestLocationPermission,
      setLocationManually
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
