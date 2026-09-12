import React, { useState } from 'react';
import {
  Shield,
  Locate,
  Navigation
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getNearbyUsers, getNearbyActivities } from '@/api';
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

  const { data: nearbyData, isLoading: loading, refetch: fetchNearby } = useQuery({
    queryKey: ['nearby', radiusKm, category, latitude, longitude],
    queryFn: async ({ signal }) => {
      const [users, activities] = await Promise.all([
        getNearbyUsers({ radius: radiusKm, category, lat: latitude || undefined, lon: longitude || undefined }, signal),
        getNearbyActivities({ radius: radiusKm, category, lat: latitude || undefined, lon: longitude || undefined }, signal)
      ]);
      return {
        users,
        activities
      };
    },
    staleTime: 1000 * 60 * 5
  });

  const nearbyUsers = nearbyData?.users || [];
  const nearbyActivities = nearbyData?.activities || [];

  const radiusPresets = [5, 10, 25, 50];
  const categories = ['All', 'Study', 'Coding', 'Gaming', 'Languages', 'Sports', 'Music', 'Startups'];

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">People Near You</h1>
            <p className="text-xs text-[#555] mt-1">
              Explore peers and activities around {city || 'Tashkent'}.
            </p>
          </div>

          {!hasLocationPermission ? (
            <Button
              variant="primary"
              size="sm"
              loading={isLocating}
              onClick={() => requestLocationPermission()}
            >
              <Locate className="w-3.5 h-3.5" />
              Enable Location
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#141414] border border-[#292929] text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-[#FFAA2B]" />
              Near {city || 'Tashkent'} (approximate)
            </div>
          )}
        </div>

        {/* Privacy banner */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0F0F0F] border border-[#1E1E1E] rounded-[12px] text-xs text-[#8A8A8A]">
          <Shield className="w-4 h-4 text-white shrink-0" />
          <span>
            <strong className="text-white">Location Privacy Guarantee:</strong> Only distance buckets (e.g. ~2-5 km) and fuzzed markers are used. Exact GPS coordinates are never disclosed.
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Radius presets */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#555] flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />
              Radius:
            </span>
            <div className="flex items-center gap-1.5">
              {radiusPresets.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`px-3 py-1 rounded-[20px] text-xs font-semibold border transition-all cursor-pointer ${
                    radiusKm === r
                      ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                      : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-[20px] text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                    : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map */}
          <div className="lg:col-span-7 h-[480px] lg:sticky lg:top-6 rounded-[14px] overflow-hidden">
            <NearbyMap
              users={nearbyUsers}
              activities={nearbyActivities}
              activeTab={activeTab}
              centerLat={latitude || 41.2995}
              centerLon={longitude || 69.2401}
              radiusKm={radiusKm}
            />
          </div>

          {/* List */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tab switcher */}
            <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3">
              {(['people', 'activities'] as const).map((tab) => {
                const count = tab === 'people' ? nearbyUsers.length : nearbyActivities.length;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-[8px] text-xs font-semibold capitalize transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                        : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            {/* Cards */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
              {loading ? (
                [1, 2, 3].map((i) => <UserCardSkeleton key={i} />)
              ) : activeTab === 'people' ? (
                nearbyUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#555] bg-[#0F0F0F] rounded-[12px] border border-[#1A1A1A]">
                    No people found in this radius. Try 25 km or 50 km!
                  </div>
                ) : (
                  nearbyUsers.map((u) => (
                    <UserCard key={u.id} user={u} onConnectSuccess={fetchNearby} onFollowSuccess={fetchNearby} />
                  ))
                )
              ) : (
                nearbyActivities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#555] bg-[#0F0F0F] rounded-[12px] border border-[#1A1A1A]">
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
    </div>
  );
};
