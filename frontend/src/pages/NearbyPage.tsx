import React, { useState, useEffect } from 'react';
import {
  Shield,
  Locate,
  Navigation
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLocation } from '@/context/LocationContext';
import { NearbyMap } from '@/components/map/NearbyMap';
import { UserCard } from '@/components/cards/UserCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Button } from '@/components/ui/Button';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { UserCardData, Activity } from '@/types';

export const NearbyPage: React.FC = () => {
  const {
    hasLocationPermission,
    latitude,
    longitude,
    city,
    isLocating,
    requestLocationPermission
  } = useLocation();

  const [activeTab, setActiveTab] = useState<'people' | 'activities'>('people');
  const [radiusKm, setRadiusKm] = useState(25);
  const [category, setCategory] = useState('All');
  const [nearbyUsers, setNearbyUsers] = useState<UserCardData[]>([]);
  const [nearbyActivities, setNearbyActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNearby = async () => {
    setLoading(true);
    try {
      const [userRes, actRes] = await Promise.all([
        api.get('/nearby/users', { params: { radius: radiusKm, category: category !== 'All' ? category : undefined } }),
        api.get('/nearby/activities', { params: { radius: radiusKm, category: category !== 'All' ? category : undefined } })
      ]);
      setNearbyUsers(userRes.data);
      setNearbyActivities(actRes.data);
    } catch (err) {
      console.error('Failed to load nearby items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [radiusKm, category, latitude, longitude]);

  const radiusPresets = [5, 10, 25, 50];
  const categories = ['All', 'Study', 'Coding', 'Gaming', 'Languages', 'Sports', 'Music', 'Startups'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Header & Location Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">PEOPLE NEAR YOU</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Explore peers and collaborative activities around {city || 'Tashkent'}.
          </p>
        </div>

        {/* Permission Request / Status */}
        {!hasLocationPermission ? (
          <Button
            variant="primary"
            size="md"
            loading={isLocating}
            onClick={() => requestLocationPermission()}
            className="text-xs font-bold"
          >
            <Locate className="w-4 h-4 mr-1.5" />
            Enable Geolocation
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-800 dark:text-[#D4D4D4] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>Near {city || 'Tashkent'} (approximate)</span>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Alert Banner */}
      <div className="p-3.5 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl flex items-center justify-between gap-4 text-xs text-neutral-600 dark:text-[#8A8A8A] shadow-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
          <span>
            <strong className="text-neutral-900 dark:text-white">Location Privacy Guarantee:</strong> WithMe only uses distance buckets (e.g. ~2-5 km) and fuzzed markers. Exact GPS coordinates and addresses are never disclosed.
          </span>
        </div>
      </div>

      {/* Radius & Category Control Filters */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Radius presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            Radius:
          </span>
          <div className="flex items-center gap-1.5">
            {radiusPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  radiusKm === r
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-[#141414] border-neutral-200 dark:border-[#242424] text-neutral-600 dark:text-[#8A8A8A] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Category presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                category === cat
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#141414] border-neutral-200 dark:border-[#242424] text-neutral-600 dark:text-[#8A8A8A] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Map & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Map View (7 cols) */}
        <div className="lg:col-span-7 h-[560px] sticky top-20">
          <NearbyMap
            users={nearbyUsers}
            centerLat={latitude || 41.2995}
            centerLon={longitude || 69.2401}
            radiusKm={radiusKm}
          />
        </div>

        {/* Right Column: People Nearby List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#242424]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('people')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                  activeTab === 'people'
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                    : 'bg-white text-neutral-600 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
                }`}
              >
                People ({nearbyUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                  activeTab === 'activities'
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                    : 'bg-white text-neutral-600 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
                }`}
              >
                Activities ({nearbyActivities.length})
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              [1, 2, 3].map((i) => <UserCardSkeleton key={i} />)
            ) : activeTab === 'people' ? (
              nearbyUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 dark:text-[#8A8A8A] bg-white dark:bg-[#0F0F0F] rounded-2xl border border-neutral-200 dark:border-[#242424]">
                  No people found in this radius. Try selecting 25 km or 50 km!
                </div>
              ) : (
                nearbyUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onConnectSuccess={fetchNearby}
                    onFollowSuccess={fetchNearby}
                  />
                ))
              )
            ) : (
              nearbyActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 dark:text-[#8A8A8A] bg-white dark:bg-[#0F0F0F] rounded-2xl border border-neutral-200 dark:border-[#242424]">
                  No activities found in this radius.
                </div>
              ) : (
                nearbyActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} onUpdate={fetchNearby} />
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
